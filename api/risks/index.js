const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')

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

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (chunks.length === 0) return null

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  return JSON.parse(raw)
}

function mapRiskRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    probability: Number(row.probability),
    impact: Number(row.impact),
    riskScore: Number(row.risk_score),
    category: row.category,
    status: row.status,
    threatType: row.threat_type,
    mitigationPlan: row.mitigation_plan,
    data: row.data ?? {},
    creationDate: row.created_at,
    lastModified: row.updated_at,
  }
}

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'GET': {
        const { status, category, q, threatType, minScore, maxScore, sort, order, limit, offset } = req.query || {}

        const limitN = clampInt(limit, { min: 1, max: 500, fallback: 100 })
        const offsetN = clampInt(offset, { min: 0, max: 100000, fallback: 0 })

        const sortKey = typeof sort === 'string' ? sort.trim() : ''
        const sortColumn =
          sortKey === 'created_at'
            ? 'created_at'
            : sortKey === 'risk_score'
              ? 'risk_score'
              : sortKey === 'title'
                ? 'title'
                : 'updated_at'

        const orderKey = typeof order === 'string' ? order.trim().toLowerCase() : 'desc'
        const ascending = orderKey === 'asc'

        const statusValue = parseRiskStatus(status)
        if (status && !statusValue) return res.status(400).json({ error: 'Invalid status' })

        const threatValue = parseThreatType(threatType)
        if (threatType && !threatValue) return res.status(400).json({ error: 'Invalid threatType' })

        const minScoreN = minScore !== undefined ? clampInt(minScore, { min: 1, max: 25, fallback: null }) : null
        const maxScoreN = maxScore !== undefined ? clampInt(maxScore, { min: 1, max: 25, fallback: null }) : null

        let query = supabase
          .from('risks')
          .select(
            'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, data, created_at, updated_at',
            { count: 'exact' },
          )
          .eq('workspace_id', workspaceId)
          .order(sortColumn, { ascending })
          .range(offsetN, offsetN + limitN - 1)

        if (statusValue) query = query.eq('status', statusValue)
        if (typeof category === 'string' && category.trim()) query = query.eq('category', category.trim())
        if (threatValue) query = query.eq('threat_type', threatValue)
        if (Number.isFinite(minScoreN)) query = query.gte('risk_score', minScoreN)
        if (Number.isFinite(maxScoreN)) query = query.lte('risk_score', maxScoreN)

        if (typeof q === 'string' && q.trim()) {
          const term = q.trim().slice(0, 200).replace(/,/g, ' ')
          query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        }

        const { data, error, count } = await query
        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
          return res.status(502).json({ error: `Supabase query failed: ${error.message}` })
        }

        const items = (data || []).map(mapRiskRow)
        return res.status(200).json({ items, count: Number.isFinite(count) ? count : null })
      }

      case 'POST': {
        const body = await readJsonBody(req)
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const title = normalizeText(body.title, { maxLen: 200 })
        if (!title) return res.status(400).json({ error: '`title` is required' })

        const description = normalizeText(body.description ?? '', { maxLen: 5000, allowEmpty: true }) ?? ''
        const mitigationPlan = normalizeText(body.mitigationPlan ?? '', { maxLen: 5000, allowEmpty: true }) ?? ''

        const category = normalizeText(body.category, { maxLen: 100 })
        if (!category) return res.status(400).json({ error: '`category` is required' })

        const probability = clampInt(body.probability, { min: 1, max: 5, fallback: NaN })
        if (!Number.isFinite(probability)) {
          return res.status(400).json({ error: '`probability` must be an integer between 1 and 5' })
        }

        const impact = clampInt(body.impact, { min: 1, max: 5, fallback: NaN })
        if (!Number.isFinite(impact)) {
          return res.status(400).json({ error: '`impact` must be an integer between 1 and 5' })
        }

        const status = body.status === undefined ? 'open' : parseRiskStatus(body.status)
        if (!status) return res.status(400).json({ error: 'Invalid status' })

        const threatType = body.threatType === undefined ? 'other' : parseThreatType(body.threatType)
        if (!threatType) return res.status(400).json({ error: 'Invalid threatType' })

        const payloadData =
          body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {}

        const { data: createdRow, error } = await supabase
          .from('risks')
          .insert({
            workspace_id: workspaceId,
            title,
            description,
            probability,
            impact,
            category,
            status,
            threat_type: threatType,
            mitigation_plan: mitigationPlan,
            data: payloadData,
          })
          .select(
            'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, data, created_at, updated_at',
          )
          .single()

        if (error) {
          logApiWarn('supabase_insert_failed', { requestId, workspaceId, message: error.message })
          return res.status(502).json({ error: `Supabase insert failed: ${error.message}` })
        }

        return res.status(201).json(mapRiskRow(createdRow))
      }

      default:
        res.setHeader('allow', 'GET,POST,OPTIONS')
        return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (error) {
    logApiError({ requestId, method: req.method, path: req.url, error })
    return res.status(500).json({ error: 'Unexpected API error' })
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
