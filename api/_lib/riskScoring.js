const { supabaseErrorToApiError } = require('./apiErrors')

function clampInt(value, { min, max, fallback }) {
  const num = Number.parseInt(String(value), 10)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

function normalizeRiskSeverity(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return null
}

function scoreFromProbabilityImpact(probability, impact) {
  return Number(probability) * Number(impact)
}

function severityFromScore(score, { lowMax, mediumMax }) {
  if (!Number.isFinite(score)) return null
  if (score <= lowMax) return 'low'
  if (score <= mediumMax) return 'medium'
  return 'high'
}

async function getWorkspaceRiskThresholds({ supabase, workspaceId }) {
  const { data, error } = await supabase
    .from('workspace_risk_thresholds')
    .select('low_max, medium_max')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    return { error: supabaseErrorToApiError(error, { action: 'query' }) }
  }

  const lowMax = clampInt(data?.low_max ?? 8, { min: 1, max: 23, fallback: 8 })
  const mediumMax = clampInt(data?.medium_max ?? 15, { min: 2, max: 24, fallback: 15 })

  const normalizedLowMax = Math.min(lowMax, mediumMax - 1)
  const normalizedMediumMax = Math.max(mediumMax, normalizedLowMax + 1)

  return { thresholds: { lowMax: normalizedLowMax, mediumMax: normalizedMediumMax } }
}

function validateClientRiskScore({ clientRiskScore, expectedScore }) {
  if (clientRiskScore === undefined) return null

  const parsed = clampInt(clientRiskScore, { min: 1, max: 25, fallback: NaN })
  if (!Number.isFinite(parsed)) return 'Invalid riskScore (expected integer 1-25)'
  if (parsed !== expectedScore) return `riskScore mismatch (expected ${expectedScore})`
  return null
}

function validateClientSeverity({ clientSeverity, expectedSeverity }) {
  if (clientSeverity === undefined) return null

  const parsed = normalizeRiskSeverity(clientSeverity)
  if (!parsed) return 'Invalid severity (expected low|medium|high)'
  if (parsed !== expectedSeverity) return `severity mismatch (expected ${expectedSeverity})`
  return null
}

module.exports = {
  getWorkspaceRiskThresholds,
  normalizeRiskSeverity,
  scoreFromProbabilityImpact,
  severityFromScore,
  validateClientRiskScore,
  validateClientSeverity,
}
