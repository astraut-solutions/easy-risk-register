const { handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')

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
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET,OPTIONS')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

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
      return res.status(502).json({ error: `Supabase query failed: ${error.message}` })
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
    return res.status(500).json({ error: 'Failed to query time-series data' })
  }
}
