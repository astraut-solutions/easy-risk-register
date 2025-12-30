const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const {
  getWorkspaceRiskThresholds,
  scoreFromProbabilityImpact,
  severityFromScore,
  validateClientRiskScore,
  validateClientSeverity,
} = require('../_lib/riskScoring')

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
  if (v === 'open' || v === 'mitigated' || v === 'closed' || v === 'accepted') return { value: v }

  return { error: 'Invalid status' }
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

function parseOptionalIntOrNull(value, { min, max }) {
  if (value === undefined) return { value: undefined }
  if (value === null) return { value: null }
  const num = clampInt(value, { min, max, fallback: NaN })
  if (!Number.isFinite(num)) return { error: `Expected integer ${min}-${max} or null` }
  return { value: num }
}

function parseProbabilityImpactFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string' && typeof value !== 'number') return { error: 'Invalid value' }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'all') return { value: null }
  const num = clampInt(value, { min: 1, max: 5, fallback: NaN })
  if (!Number.isFinite(num)) return { error: 'Invalid value' }
  return { value: num }
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

function mapRiskRow(row, { thresholds }) {
  const score = Number(row.risk_score)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    probability: Number(row.probability),
    impact: Number(row.impact),
    riskScore: score,
    severity: severityFromScore(score, thresholds),
    category: row.category,
    status: row.status,
    threatType: row.threat_type,
    mitigationPlan: row.mitigation_plan,
    checklistStatus: row.checklist_status ?? 'not_started',
    data: row.data ?? {},
    lastReviewedAt: row.last_reviewed_at ?? null,
    nextReviewAt: row.next_review_at ?? null,
    reviewIntervalDays: row.review_interval_days ?? null,
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
    const thresholdsResult = await getWorkspaceRiskThresholds({ supabase, workspaceId })
    if (thresholdsResult.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: thresholdsResult.error.message })
      return sendApiError(req, res, thresholdsResult.error)
    }
    const thresholds = thresholdsResult.thresholds

    switch (req.method) {
      case 'GET': {
        const { status, category, q, threatType, probability, impact, minScore, maxScore, sort, order, limit, offset } =
          req.query || {}
        const checklistStatus = req.query?.checklistStatus ?? req.query?.checklist_status

        const limitN = clampInt(limit, { min: 1, max: 1000, fallback: 100 })
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

        const statusResult = parseRiskStatusFilter(status)
        if (statusResult.error) return res.status(400).json({ error: statusResult.error })

        const threatResult = parseThreatTypeFilter(threatType)
        if (threatResult.error) return res.status(400).json({ error: threatResult.error })

        const checklistStatusResult = parseChecklistStatusFilter(checklistStatus)
        if (checklistStatusResult.error) return res.status(400).json({ error: checklistStatusResult.error })

        const categoryResult = parseCategoryFilter(category)
        if (categoryResult.error) return res.status(400).json({ error: categoryResult.error })

        const probabilityResult = parseProbabilityImpactFilter(probability)
        if (probabilityResult.error) return res.status(400).json({ error: 'Invalid probability' })

        const impactResult = parseProbabilityImpactFilter(impact)
        if (impactResult.error) return res.status(400).json({ error: 'Invalid impact' })

        const minScoreN = minScore !== undefined ? clampInt(minScore, { min: 1, max: 25, fallback: null }) : null
        const maxScoreN = maxScore !== undefined ? clampInt(maxScore, { min: 1, max: 25, fallback: null }) : null

        let query = supabase
          .from('risks')
          .select(
            'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, checklist_status, data, last_reviewed_at, next_review_at, review_interval_days, created_at, updated_at',
            { count: 'exact' },
          )
          .eq('workspace_id', workspaceId)
          .order(sortColumn, { ascending })
          .range(offsetN, offsetN + limitN - 1)

        if (statusResult.value) query = query.eq('status', statusResult.value)
        if (categoryResult.value) query = query.eq('category', categoryResult.value)
        if (threatResult.value) query = query.eq('threat_type', threatResult.value)
        if (checklistStatusResult.value) query = query.eq('checklist_status', checklistStatusResult.value)
        if (probabilityResult.value) query = query.eq('probability', probabilityResult.value)
        if (impactResult.value) query = query.eq('impact', impactResult.value)
        if (Number.isFinite(minScoreN)) query = query.gte('risk_score', minScoreN)
        if (Number.isFinite(maxScoreN)) query = query.lte('risk_score', maxScoreN)

        if (typeof q === 'string' && q.trim()) {
          const term = q.trim().slice(0, 200).replace(/,/g, ' ')
          query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        }

        const { data, error, count } = await query
        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }

        const items = (data || []).map((row) => mapRiskRow(row, { thresholds }))
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

        const expectedScore = scoreFromProbabilityImpact(probability, impact)
        const expectedSeverity = severityFromScore(expectedScore, thresholds)

        const riskScoreError = validateClientRiskScore({ clientRiskScore: body.riskScore, expectedScore })
        if (riskScoreError) return res.status(400).json({ error: riskScoreError })

        const severityError = validateClientSeverity({ clientSeverity: body.severity, expectedSeverity })
        if (severityError) return res.status(400).json({ error: severityError })

        const status = body.status === undefined ? 'open' : parseRiskStatus(body.status)
        if (!status) return res.status(400).json({ error: 'Invalid status' })

        const threatType = body.threatType === undefined ? 'other' : parseThreatType(body.threatType)
        if (!threatType) return res.status(400).json({ error: 'Invalid threatType' })

        const payloadData =
          body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {}

        const reviewIntervalDays = parseOptionalIntOrNull(body.reviewIntervalDays, { min: 1, max: 365 })
        if (reviewIntervalDays.error) return res.status(400).json({ error: 'Invalid reviewIntervalDays' })

        const lastReviewedAt = parseOptionalIsoTimestampOrNull(body.lastReviewedAt)
        if (lastReviewedAt.error) return res.status(400).json({ error: 'Invalid lastReviewedAt' })

        const nextReviewAt = parseOptionalIsoTimestampOrNull(body.nextReviewAt)
        if (nextReviewAt.error) return res.status(400).json({ error: 'Invalid nextReviewAt' })

        const insertRow = {
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
        }

        if (reviewIntervalDays.value !== undefined) insertRow.review_interval_days = reviewIntervalDays.value
        if (lastReviewedAt.value !== undefined) insertRow.last_reviewed_at = lastReviewedAt.value
        if (nextReviewAt.value !== undefined) insertRow.next_review_at = nextReviewAt.value

        const { data: createdRow, error } = await supabase
          .from('risks')
          .insert(insertRow)
          .select(
            'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, checklist_status, data, last_reviewed_at, next_review_at, review_interval_days, created_at, updated_at',
          )
          .single()

        if (error) {
          logApiWarn('supabase_insert_failed', { requestId, workspaceId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'insert' })
          return sendApiError(req, res, apiError)
        }

        return res.status(201).json(mapRiskRow(createdRow, { thresholds }))
      }

      default:
        res.setHeader('allow', 'GET,POST,OPTIONS')
        return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
    }
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
