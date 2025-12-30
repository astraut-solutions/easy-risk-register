const UUID_V4ish_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeUuid(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!UUID_V4ish_REGEX.test(trimmed)) return null
  return trimmed.toLowerCase()
}

function clampInt(value, { min, max, fallback }) {
  const num = Number.parseInt(String(value), 10)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeFrameworkId(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > 200) return trimmed.slice(0, 200)
  return trimmed
}

function parseOptionalIsoTimestampOrNull(value) {
  if (value === undefined) return { value: undefined }
  if (value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Expected ISO timestamp string or null' }

  const trimmed = value.trim()
  if (!trimmed) return { error: 'Expected ISO timestamp string or null' }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return { error: 'Invalid timestamp' }
  return { value: date.toISOString() }
}

function parseScoresObject(value) {
  if (!isPlainObject(value)) return { error: 'Invalid scores (expected object)' }

  const out = {}
  for (const [rawKey, rawScore] of Object.entries(value)) {
    const key = typeof rawKey === 'string' ? rawKey.trim() : ''
    if (!key) return { error: 'Invalid scores (empty domain key)' }
    if (key.length > 100) return { error: 'Invalid scores (domain key too long)' }

    const score = clampInt(rawScore, { min: 0, max: 4, fallback: NaN })
    if (!Number.isFinite(score)) return { error: `Invalid score for ${key} (expected 0-4)` }

    out[key] = score
  }

  if (Object.keys(out).length === 0) return { error: 'Invalid scores (empty object)' }
  return { value: out }
}

async function getAssessmentWithScores({ supabase, workspaceId, assessmentId }) {
  const { data: assessment, error: assessmentError } = await supabase
    .from('maturity_assessments')
    .select('id, framework_id, assessed_at, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('id', assessmentId)
    .maybeSingle()

  if (assessmentError) return { error: assessmentError }
  if (!assessment) return { data: null }

  const frameworkId = assessment.framework_id

  const { data: domains, error: domainsError } = await supabase
    .from('maturity_framework_domains')
    .select('id, key, title, description, position')
    .eq('framework_id', frameworkId)
    .order('position', { ascending: true })

  if (domainsError) return { error: domainsError }

  const { data: scores, error: scoresError } = await supabase
    .from('maturity_assessment_domain_scores')
    .select('domain_id, score')
    .eq('workspace_id', workspaceId)
    .eq('assessment_id', assessmentId)

  if (scoresError) return { error: scoresError }

  const scoreByDomainId = new Map()
  for (const row of scores || []) {
    scoreByDomainId.set(row.domain_id, Number(row.score))
  }

  return {
    data: {
      id: assessment.id,
      frameworkId,
      assessedAt: assessment.assessed_at,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at,
      domains: (domains || []).map((d) => ({
        id: d.id,
        key: d.key,
        title: d.title,
        description: d.description ?? '',
        position: Number(d.position),
        score: scoreByDomainId.has(d.id) ? scoreByDomainId.get(d.id) : null,
      })),
    },
  }
}

function rpcErrorToResponse(error) {
  const message = typeof error?.message === 'string' ? error.message : ''

  if (message.includes('Forbidden')) return { status: 403, code: 'FORBIDDEN', message: 'Forbidden' }
  if (message.includes('Assessment not found')) return { status: 404, code: 'NOT_FOUND', message: 'Not found' }
  if (message.includes('Unknown framework')) return { status: 400, code: 'BAD_REQUEST', message: 'Unknown framework' }
  if (message.includes('Framework has no domains')) return { status: 400, code: 'BAD_REQUEST', message: 'Framework misconfigured' }
  if (message.includes('Scores must be a JSON object')) {
    return { status: 400, code: 'BAD_REQUEST', message: 'Invalid scores payload' }
  }
  if (message.includes('Scores contain unknown domain keys')) {
    return { status: 400, code: 'BAD_REQUEST', message: 'Scores contain unknown domain keys' }
  }
  if (message.includes('Expected') && message.includes('domain scores')) {
    return { status: 400, code: 'BAD_REQUEST', message: 'Scores must include every domain' }
  }
  if (message.includes('Invalid score values')) {
    return { status: 400, code: 'BAD_REQUEST', message: 'Invalid score values (expected integers 0-4)' }
  }

  return null
}

module.exports = {
  normalizeUuid,
  clampInt,
  normalizeFrameworkId,
  parseOptionalIsoTimestampOrNull,
  parseScoresObject,
  getAssessmentWithScores,
  rpcErrorToResponse,
}

