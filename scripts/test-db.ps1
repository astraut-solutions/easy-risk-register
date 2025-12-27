param(
  [ValidateSet('up', 'down', 'reset', 'smoke')]
  [string]$Action = 'smoke',
  [string]$ProjectName = 'easy-risk-register-testdb'
)

$ErrorActionPreference = 'Stop'

function Invoke-Compose([string[]]$ComposeArgs) {
  $composeArgs = $ComposeArgs
  & docker-compose -p $ProjectName -f docker-compose.test-db.yml @composeArgs
  if ($LASTEXITCODE -ne 0) { throw "docker-compose failed (exit $LASTEXITCODE)" }
}

function Get-DbContainerId() {
  $id = (Invoke-Compose @('ps', '-q', 'supabase-db') | Select-Object -First 1)
  if (-not $id) { throw "supabase-db container not running for project '$ProjectName'." }
  return $id.Trim()
}

function Wait-ForDbReady() {
  $deadline = (Get-Date).AddSeconds(90)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-Compose @('exec', '-T', 'supabase-db', 'pg_isready', '-U', 'postgres', '-d', 'postgres') | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 750
    }
  }
  throw 'Timed out waiting for Postgres to become ready.'
}

switch ($Action) {
  'up' {
    Invoke-Compose @('up', '-d', 'supabase-db') | Out-Host
    Wait-ForDbReady
    Write-Host "Test DB is up (project: $ProjectName)."
  }

  'down' {
    Invoke-Compose @('down', '--remove-orphans') | Out-Host
    Write-Host "Test DB is down (project: $ProjectName)."
  }

  'reset' {
    Invoke-Compose @('down', '-v', '--remove-orphans') | Out-Host
    Write-Host "Test DB reset complete (project: $ProjectName)."
  }

  'smoke' {
    try {
      Invoke-Compose @('down', '-v', '--remove-orphans') | Out-Null
    } catch {
      # ignore
    }

    Invoke-Compose @('up', '-d', 'supabase-db') | Out-Host
    Wait-ForDbReady

    $containerId = Get-DbContainerId
    $sqlPath = Join-Path $PSScriptRoot 'test-db-schema-smoke.sql'
    if (-not (Test-Path $sqlPath)) { throw "Missing smoke SQL at $sqlPath" }

    & docker cp $sqlPath "$containerId`:/tmp/test-db-schema-smoke.sql"
    if ($LASTEXITCODE -ne 0) { throw "docker cp failed (exit $LASTEXITCODE)" }
    Invoke-Compose @(
      'exec',
      '-T',
      'supabase-db',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-f',
      '/tmp/test-db-schema-smoke.sql'
    ) | Out-Host

    Write-Host "Schema smoke checks passed (project: $ProjectName)."
    Write-Host "Tip: the full dev Supabase stack is still `docker-compose --profile development up -d` (separate from this test DB)."
  }
}
