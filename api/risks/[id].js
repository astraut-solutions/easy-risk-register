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

    const idParam = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
    const riskId = normalizeUuid(idParam)
    if (!riskId) return res.status(400).json({ error: 'Invalid risk id' })

    const { supabase, workspaceId } = ctx
    const thresholdsResult = await getWorkspaceRiskThresholds({ supabase, workspaceId })
    if (thresholdsResult.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: thresholdsResult.error.message })
      return sendApiError(req, res, thresholdsResult.error)
    }
    const thresholds = thresholdsResult.thresholds

    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('risks')
          .select(
            'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, checklist_status, data, created_at, updated_at',
          )
          .eq('id', riskId)
          .eq('workspace_id', workspaceId)
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json(mapRiskRow(data, { thresholds }))
      }

      case 'PATCH': {
        const body = await readJsonBody(req)
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const requiresScoreValidation = body.riskScore !== undefined || body.severity !== undefined
        let baseProbability = null
        let baseImpact = null

        if (requiresScoreValidation) {
          const { data: existingRisk, error: existingError } = await supabase
            .from('risks')
            .select('probability, impact')
            .eq('id', riskId)
            .eq('workspace_id', workspaceId)
            .maybeSingle()

          if (existingError) {
            logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: existingError.message })
            const apiError = supabaseErrorToApiError(existingError, { action: 'query' })
            return sendApiError(req, res, apiError)
          }
          if (!existingRisk) return res.status(404).json({ error: 'Not found' })

          baseProbability = Number(existingRisk.probability)
          baseImpact = Number(existingRisk.impact)
        }

        const updates = {}

        if (body.title !== undefined) {
          const title = normalizeText(body.title, { maxLen: 200 })
          if (!title) return res.status(400).json({ error: 'Invalid title' })
          updates.title = title
        }

        if (body.description !== undefined) {
          const description = normalizeText(body.description ?? '', { maxLen: 5000, allowEmpty: true })
          if (description === null) return res.status(400).json({ error: 'Invalid description' })
          updates.description = description
        }

        if (body.mitigationPlan !== undefined) {
          const mitigationPlan = normalizeText(body.mitigationPlan ?? '', { maxLen: 5000, allowEmpty: true })
          if (mitigationPlan === null) return res.status(400).json({ error: 'Invalid mitigationPlan' })
          updates.mitigation_plan = mitigationPlan
        }

        if (body.category !== undefined) {
          const category = normalizeText(body.category, { maxLen: 100 })
          if (!category) return res.status(400).json({ error: 'Invalid category' })
          updates.category = category
        }

        if (body.status !== undefined) {
          const status = parseRiskStatus(body.status)
          if (!status) return res.status(400).json({ error: 'Invalid status' })
          updates.status = status
        }

        if (body.threatType !== undefined) {
          const threatType = parseThreatType(body.threatType)
          if (!threatType) return res.status(400).json({ error: 'Invalid threatType' })
          updates.threat_type = threatType
        }

        if (body.probability !== undefined) {
          const probability = clampInt(body.probability, { min: 1, max: 5, fallback: NaN })
          if (!Number.isFinite(probability)) {
            return res.status(400).json({ error: 'Invalid probability (expected 1-5)' })
          }
          updates.probability = probability
        }

        if (body.impact !== undefined) {
          const impact = clampInt(body.impact, { min: 1, max: 5, fallback: NaN })
          if (!Number.isFinite(impact)) {
            return res.status(400).json({ error: 'Invalid impact (expected 1-5)' })
          }
          updates.impact = impact
        }

        if (requiresScoreValidation) {
          const expectedProbability = updates.probability !== undefined ? updates.probability : baseProbability
          const expectedImpact = updates.impact !== undefined ? updates.impact : baseImpact

          const expectedScore = scoreFromProbabilityImpact(expectedProbability, expectedImpact)
          const expectedSeverity = severityFromScore(expectedScore, thresholds)

          const riskScoreError = validateClientRiskScore({ clientRiskScore: body.riskScore, expectedScore })
          if (riskScoreError) return res.status(400).json({ error: riskScoreError })

          const severityError = validateClientSeverity({ clientSeverity: body.severity, expectedSeverity })
          if (severityError) return res.status(400).json({ error: severityError })
        }

        if (body.data !== undefined) {
          if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
            return res.status(400).json({ error: 'Invalid data (expected object)' })
          }
          updates.data = body.data
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'No updates provided' })
        }

        const { data, error } = await supabase
          .from('risks')
          .update(updates)
          .eq('id', riskId)
          .eq('workspace_id', workspaceId)
          .select(
            'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, checklist_status, data, created_at, updated_at',
          )
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_update_failed', { requestId, workspaceId, riskId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'update' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json(mapRiskRow(data, { thresholds }))
      }

      case 'DELETE': {
        const { data, error } = await supabase
          .from('risks')
          .delete()
          .eq('id', riskId)
          .eq('workspace_id', workspaceId)
          .select('id')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_delete_failed', { requestId, workspaceId, riskId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'delete' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(204).end()
      }

      default:
        res.setHeader('allow', 'GET,PATCH,DELETE,OPTIONS')
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
