const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const { getWorkspaceRiskThresholds, severityFromScore } = require('../_lib/riskScoring')

function clampInt(value, { min, max, fallback }) {
  const num = Number.parseInt(String(value), 10)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

function normalizeText(value, { maxLen, allowEmpty = false } = {}) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed && !allowEmpty) return null
  if (typeof maxLen === 'number' && trimmed.length > maxLen) return trimmed.slice(0, maxLen)
  return trimmed
}

function parseRiskStatus(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'open' || v === 'mitigated' || v === 'closed' || v === 'accepted') return v
  return null
}

function parseRiskStatusFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Invalid status' }

  const v = value.trim().toLowerCase()
  if (!v || v === 'all') return { value: null }

  const parsed = parseRiskStatus(v)
  if (!parsed) return { error: 'Invalid status' }
  return { value: parsed }
}

function parseThreatType(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  const allowed = new Set([
    'phishing',
    'ransomware',
    'business_email_compromise',
    'malware',
    'vulnerability',
    'data_breach',
    'supply_chain',
    'insider',
    'other',
  ])
  return allowed.has(v) ? v : null
}

function parseThreatTypeFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Invalid threatType' }

  const v = value.trim().toLowerCase()
  if (!v || v === 'all') return { value: null }

  const parsed = parseThreatType(v)
  if (!parsed) return { error: 'Invalid threatType' }
  return { value: parsed }
}

function parseChecklistStatus(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'not_started' || v === 'in_progress' || v === 'done') return v
  return null
}

function parseChecklistStatusFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Invalid checklistStatus' }

  const v = value.trim().toLowerCase()
  if (!v || v === 'all') return { value: null }

  const parsed = parseChecklistStatus(v)
  if (!parsed) return { error: 'Invalid checklistStatus' }
  return { value: parsed }
}

function parseCategoryFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Invalid category' }

  const normalized = value.trim()
  if (!normalized || normalized.toLowerCase() === 'all') return { value: null }

  return { value: normalized }
}

function parseProbabilityImpactFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string' && typeof value !== 'number') return { error: 'Invalid value' }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'all') return { value: null }

  const num = clampInt(value, { min: 1, max: 5, fallback: NaN })
  if (!Number.isFinite(num)) return { error: 'Invalid value' }
  return { value: num }
}

function parseScoreFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string' && typeof value !== 'number') return { error: 'Invalid score' }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'all') return { value: null }

  const num = clampInt(value, { min: 1, max: 25, fallback: NaN })
  if (!Number.isFinite(num)) return { error: 'Invalid score' }
  return { value: num }
}

function incrementRecord(target, key) {
  if (!Object.prototype.hasOwnProperty.call(target, key)) target[key] = 0
  target[key] += 1
}

function toSortedCountPairs(counts) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count: Number(count) }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.key.localeCompare(b.key)))
}

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET,OPTIONS')
    return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
  }

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    const { supabase, workspaceId } = ctx
    const thresholdsResult = await getWorkspaceRiskThresholds({ supabase, workspaceId })
    if (thresholdsResult.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: thresholdsResult.error.message })
      return sendApiError(req, res, thresholdsResult.error)
    }
    const thresholds = thresholdsResult.thresholds

    const {
      status,
      category,
      threatType,
      checklistStatus,
      probability,
      impact,
      minScore,
      maxScore,
      q,
      limit,
    } = req.query || {}

    const statusResult = parseRiskStatusFilter(status)
    if (statusResult.error) return res.status(400).json({ error: statusResult.error })

    const categoryResult = parseCategoryFilter(category)
    if (categoryResult.error) return res.status(400).json({ error: categoryResult.error })

    const threatResult = parseThreatTypeFilter(threatType)
    if (threatResult.error) return res.status(400).json({ error: threatResult.error })

    const checklistResult = parseChecklistStatusFilter(checklistStatus)
    if (checklistResult.error) return res.status(400).json({ error: checklistResult.error })

    const probabilityResult = parseProbabilityImpactFilter(probability)
    if (probabilityResult.error) return res.status(400).json({ error: probabilityResult.error })

    const impactResult = parseProbabilityImpactFilter(impact)
    if (impactResult.error) return res.status(400).json({ error: impactResult.error })

    const minScoreResult = parseScoreFilter(minScore)
    if (minScoreResult.error) return res.status(400).json({ error: minScoreResult.error })

    const maxScoreResult = parseScoreFilter(maxScore)
    if (maxScoreResult.error) return res.status(400).json({ error: maxScoreResult.error })

    const limitN = clampInt(limit, { min: 1, max: 1000, fallback: 1000 })

    let query = supabase
      .from('risks')
      .select('id, probability, impact, risk_score, category, status', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .range(0, limitN - 1)

    if (statusResult.value) query = query.eq('status', statusResult.value)
    if (categoryResult.value) query = query.eq('category', categoryResult.value)
    if (threatResult.value) query = query.eq('threat_type', threatResult.value)
    if (checklistResult.value) query = query.eq('checklist_status', checklistResult.value)
    if (probabilityResult.value) query = query.eq('probability', probabilityResult.value)
    if (impactResult.value) query = query.eq('impact', impactResult.value)
    if (minScoreResult.value) query = query.gte('risk_score', minScoreResult.value)
    if (maxScoreResult.value) query = query.lte('risk_score', maxScoreResult.value)

    const term = normalizeText(q, { maxLen: 200 })
    if (term) {
      query = query.or(`title.ilike.%${term.replace(/,/g, ' ')}%,description.ilike.%${term.replace(/,/g, ' ')}%`)
    }

    const { data, error, count } = await query
    if (error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
      const apiError = supabaseErrorToApiError(error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    const countsByStatus = { open: 0, mitigated: 0, closed: 0, accepted: 0 }
    const countsBySeverity = { low: 0, medium: 0, high: 0 }
    const countsByCategory = {}
    const countsBySeverityByCategory = {}
    const matrix = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 0))

    for (const row of data || []) {
      if (row.status && Object.prototype.hasOwnProperty.call(countsByStatus, row.status)) {
        countsByStatus[row.status] += 1
      }

      const score = Number(row.risk_score)
      const severity = severityFromScore(score, thresholds)
      if (severity && Object.prototype.hasOwnProperty.call(countsBySeverity, severity)) {
        countsBySeverity[severity] += 1
      }

      const categoryKey = typeof row.category === 'string' && row.category.trim() ? row.category : 'Uncategorized'
      incrementRecord(countsByCategory, categoryKey)

      if (!countsBySeverityByCategory[categoryKey]) {
        countsBySeverityByCategory[categoryKey] = { low: 0, medium: 0, high: 0, total: 0 }
      }
      if (severity && Object.prototype.hasOwnProperty.call(countsBySeverityByCategory[categoryKey], severity)) {
        countsBySeverityByCategory[categoryKey][severity] += 1
      }
      countsBySeverityByCategory[categoryKey].total += 1

      const prob = clampInt(row.probability, { min: 1, max: 5, fallback: null })
      const imp = clampInt(row.impact, { min: 1, max: 5, fallback: null })
      if (prob && imp) {
        matrix[prob - 1][imp - 1] += 1
      }
    }

    const byCategory = toSortedCountPairs(countsByCategory).map(({ key, count: c }) => ({ category: key, count: c }))

    const bySeverityByCategory = Object.entries(countsBySeverityByCategory)
      .map(([categoryKey, counts]) => ({ category: categoryKey, ...counts }))
      .sort((a, b) => (b.total !== a.total ? b.total - a.total : a.category.localeCompare(b.category)))

    const totalCount = Number.isFinite(count) ? count : null
    const truncated = totalCount !== null ? totalCount > limitN : Boolean(data && data.length >= limitN)

    return res.status(200).json({
      totals: {
        risks: (data || []).length,
      },
      truncated,
      limit: limitN,
      totalCount,
      countsByStatus,
      countsBySeverity,
      byCategory,
      bySeverityByCategory,
      matrix: {
        probabilityLevels: 5,
        impactLevels: 5,
        counts: matrix,
      },
      thresholds,
    })
  } catch (error) {
    logApiError({ requestId, method: req.method, path: req.url, error })
    const apiError = unexpectedErrorToApiError(error)
    return sendApiError(req, res, apiError)
  } finally {
    logApiResponse({
      requestId,
      method: req.method,
      path: req.url,
      status: res.statusCode,
      durationMs: Date.now() - start,
    })
  }
}
