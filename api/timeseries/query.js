const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')

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

    const { riskId, category, start, end, limit } = req.query || {}
    const limitN = clampInt(limit, { min: 1, max: 5000, fallback: 500 })

    const startMs = typeof start === 'string' && start ? parseTimestampMs(start) : null
    const endMs = typeof end === 'string' && end ? parseTimestampMs(end) : null

    const { supabase, workspaceId } = ctx

    let query = supabase
      .from('risk_trends')
      .select('risk_id, probability, impact, risk_score, timestamp, category, status')
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: true })
      .limit(limitN)

    if (typeof riskId === 'string' && riskId) query = query.eq('risk_id', riskId)
    if (typeof category === 'string' && category) query = query.eq('category', category)
    if (Number.isFinite(startMs)) query = query.gte('timestamp', startMs)
    if (Number.isFinite(endMs)) query = query.lte('timestamp', endMs)

    const { data, error } = await query
    if (error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
      const apiError = supabaseErrorToApiError(error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    const points = (data || []).map(r => ({
      riskId: r.risk_id,
      probability: Number(r.probability),
      impact: Number(r.impact),
      riskScore: Number(r.risk_score),
      timestamp: Number(r.timestamp),
      category: r.category ?? undefined,
      status: r.status ?? undefined,
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
