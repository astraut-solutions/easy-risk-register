param(
  [string]$BaseUrl = "http://localhost:54321",
  [string]$ComposeProfile = "development",
  [string]$WorkspaceName = "Demo Workspace",
  [string]$Password = "DemoPassword123!",
  [string]$EmailSuffix = "",
  [switch]$SkipAuthUsers,
  [int]$WaitSeconds = 120
)

$ErrorActionPreference = "Stop"

function Read-DotEnvFile([string]$path) {
  $map = @{}
  if (-not (Test-Path -LiteralPath $path)) {
    return $map
  }

  foreach ($line in Get-Content -LiteralPath $path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0) { continue }
    if ($trimmed.StartsWith("#")) { continue }
    $idx = $trimmed.IndexOf("=")
    if ($idx -lt 1) { continue }

    $key = $trimmed.Substring(0, $idx).Trim()
    $value = $trimmed.Substring($idx + 1).Trim()
    $map[$key] = $value
  }

  return $map
}

function Require-RunningService([string]$serviceName) {
  $id = docker compose --profile $ComposeProfile ps -q $serviceName 2>$null
  if (-not $id) {
    throw "Service '$serviceName' is not running. Start it first: docker compose --profile $ComposeProfile up -d $serviceName"
  }
}

function Wait-Until([string]$name, [int]$timeoutSeconds, [scriptblock]$condition) {
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      if (& $condition) { return }
    } catch {
      # ignore and retry
    }
    Start-Sleep -Seconds 2
  }
  throw "Timed out waiting for $name (>${timeoutSeconds}s)."
}

function Wait-ForPostgresReady() {
  Wait-Until -name "Postgres readiness" -timeoutSeconds $WaitSeconds -condition {
    $out = docker compose --profile $ComposeProfile exec -T supabase-db pg_isready -U postgres -d postgres 2>$null
    return ($LASTEXITCODE -eq 0)
  }
}

function Wait-ForSchema() {
  Wait-Until -name "DB init scripts to finish" -timeoutSeconds $WaitSeconds -condition {
    $res = docker compose --profile $ComposeProfile exec -T supabase-db psql -U postgres -d postgres -tA -c "select to_regclass('public.risk_score_snapshots') is not null;" 2>$null
    return ($LASTEXITCODE -eq 0 -and ($res -match '^(t|true)$'))
  }
}

function Wait-ForGateway() {
  Wait-Until -name "supabase-gateway (/health)" -timeoutSeconds $WaitSeconds -condition {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 -Uri "$BaseUrl/health"
    return ($r.StatusCode -eq 200)
  }
}

function New-GoTrueUser([string]$email, [string]$password, [string]$serviceKey) {
  $uri = "$BaseUrl/auth/v1/admin/users"
  $headers = @{
    "apikey"        = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type"  = "application/json"
  }

  $body = @{
    email         = $email
    password      = $password
    email_confirm = $true
  } | ConvertTo-Json

  $deadline = (Get-Date).AddSeconds($WaitSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body
      if ($null -ne $res.user -and $null -ne $res.user.id) { return $res.user.id }
      if ($null -ne $res.id) { return $res.id }
      throw "Unexpected GoTrue response shape while creating '$email'."
    } catch {
      $message = $_.Exception.Message
      $status = $null
      try { $status = $_.Exception.Response.StatusCode.value__ } catch { }

      # Common during startup while gateway/auth boot or migrations apply.
      if ($status -eq 502 -or $status -eq 503 -or $status -eq 504) {
        Start-Sleep -Seconds 2
        continue
      }

      throw "Failed to create auth user '$email' via GoTrue admin API at '$uri'. Ensure supabase-gateway and supabase-auth are running, and SUPABASE_SERVICE_KEY in .env is valid. Underlying error: $message"
    }
  }
  throw "Timed out creating auth user '$email' via GoTrue admin API at '$uri'."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envPath = Join-Path $repoRoot ".env"
$env = Read-DotEnvFile $envPath

if (-not $SkipAuthUsers) {
  if (-not $env.ContainsKey("SUPABASE_SERVICE_KEY")) {
    throw "Missing SUPABASE_SERVICE_KEY in '$envPath'. Create it from .env.example and set keys (or run: node scripts/generate-local-supabase-keys.mjs)."
  }
  if ($env["SUPABASE_SERVICE_KEY"] -match '^sb_service_role_change_me$') {
    throw "SUPABASE_SERVICE_KEY in '$envPath' is still the placeholder value. Generate real keys (node scripts/generate-local-supabase-keys.mjs) and restart the docker compose stack."
  }
}

Require-RunningService "supabase-db"
Wait-ForPostgresReady
Wait-ForSchema

if (-not $SkipAuthUsers) {
  Require-RunningService "supabase-gateway"
  Require-RunningService "supabase-auth"
  Wait-ForGateway
}

$suffix = $EmailSuffix.Trim()
if ($suffix) {
  $ownerEmail = "demo.owner.$suffix@example.com"
  $adminEmail = "demo.admin.$suffix@example.com"
  $memberEmail = "demo.member.$suffix@example.com"
} else {
  $ownerEmail = "demo.owner@example.com"
  $adminEmail = "demo.admin@example.com"
  $memberEmail = "demo.member@example.com"
}

if (-not $SkipAuthUsers) {
  $serviceKey = $env["SUPABASE_SERVICE_KEY"]
  $ownerId = New-GoTrueUser -email $ownerEmail -password $Password -serviceKey $serviceKey
  $adminId = New-GoTrueUser -email $adminEmail -password $Password -serviceKey $serviceKey
  $memberId = New-GoTrueUser -email $memberEmail -password $Password -serviceKey $serviceKey
} else {
  $ownerId = [guid]::NewGuid().ToString()
  $adminId = [guid]::NewGuid().ToString()
  $memberId = [guid]::NewGuid().ToString()
}

$sqlPath = Join-Path $PSScriptRoot "seed-demo.sql"
if (-not (Test-Path -LiteralPath $sqlPath)) {
  throw "Missing SQL seed file: $sqlPath"
}

$dockerArgs = @(
  "compose",
  "--profile",
  $ComposeProfile,
  "exec",
  "-T",
  "supabase-db",
  "psql",
  "-U",
  "postgres",
  "-d",
  "postgres",
  "-v",
  "ON_ERROR_STOP=1",
  "-v",
  "owner_id=$ownerId",
  "-v",
  "admin_id=$adminId",
  "-v",
  "member_id=$memberId",
  "-v",
  "workspace_name=$WorkspaceName",
  "-v",
  "owner_email=$ownerEmail",
  "-v",
  "admin_email=$adminEmail",
  "-v",
  "member_email=$memberEmail",
  "-f",
  "-"
)

Get-Content -LiteralPath $sqlPath -Raw | & docker @dockerArgs
if ($LASTEXITCODE -ne 0) {
  throw "DB seed failed (psql exit code $LASTEXITCODE)."
}

Write-Host ""
Write-Host "Seeded demo data."
Write-Host "Workspace: $WorkspaceName"
Write-Host "Users:"
Write-Host "  Owner : $ownerEmail"
Write-Host "  Admin : $adminEmail"
Write-Host "  Member: $memberEmail"
if (-not $SkipAuthUsers) {
  Write-Host "Password: $Password"
} else {
  Write-Host "Auth users were not created (use -SkipAuthUsers to only seed DB rows)."
}
