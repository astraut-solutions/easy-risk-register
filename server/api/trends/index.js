const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')

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

function parseTimestampMs(isoString) {
  const ms = Date.parse(String(isoString))
  return Number.isFinite(ms) ? ms : null
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

    const { riskId, category, status, start, end, limit } = req.query || {}
    const limitN = clampInt(limit, { min: 1, max: 5000, fallback: 500 })

    const startMs = typeof start === 'string' && start ? parseTimestampMs(start) : null
    const endMs = typeof end === 'string' && end ? parseTimestampMs(end) : null

    const normalizedRiskId = typeof riskId === 'string' && riskId ? normalizeUuid(riskId) : null
    if (typeof riskId === 'string' && riskId && !normalizedRiskId) {
      return res.status(400).json({ error: 'Invalid riskId' })
    }

    const normalizedCategory = typeof category === 'string' && category.trim() ? category.trim() : null
    const normalizedStatus = typeof status === 'string' && status.trim() ? status.trim().toLowerCase() : null

    const { supabase, workspaceId } = ctx

    let query = supabase
      .from('risk_score_snapshots')
      .select('risk_id, probability, impact, risk_score, created_at, category, status')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
      .limit(limitN)

    if (normalizedRiskId) query = query.eq('risk_id', normalizedRiskId)
    if (normalizedCategory) query = query.eq('category', normalizedCategory)
    if (normalizedStatus) query = query.eq('status', normalizedStatus)
    if (Number.isFinite(startMs)) query = query.gte('created_at', new Date(startMs).toISOString())
    if (Number.isFinite(endMs)) query = query.lte('created_at', new Date(endMs).toISOString())

    const { data, error } = await query
    if (error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
      const apiError = supabaseErrorToApiError(error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    const points = (data || []).map((row) => ({
      riskId: row.risk_id,
      probability: Number(row.probability),
      impact: Number(row.impact),
      riskScore: Number(row.risk_score),
      timestamp: Date.parse(row.created_at),
      category: row.category,
      status: row.status,
    }))

    return res.status(200).json(points)
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

