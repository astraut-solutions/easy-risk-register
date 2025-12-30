const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { stringifyCsvHeader, stringifyCsvRow, DEFAULT_MAX_ROWS } = require('../_lib/csv')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')

const CSV_SPEC_VERSION = 2
const CSV_VARIANT = 'standard'

const CSV_COLUMNS = [
  'csvSpecVersion',
  'csvVariant',
  'id',
  'title',
  'description',
  'probability',
  'impact',
  'riskScore',
  'category',
  'threatType',
  'templateId',
  'status',
  'mitigationPlan',
  'owner',
  'ownerTeam',
  'dueDate',
  'reviewDate',
  'reviewCadence',
  'riskResponse',
  'ownerResponse',
  'securityAdvisorComment',
  'vendorResponse',
  'notes',
  'checklistStatus',
  'checklistsJson',
  'evidenceJson',
  'mitigationStepsJson',
  'creationDate',
  'lastModified',
]

function normalizeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value
}

function normalizeString(value, { fallback = '', maxLen } = {}) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  const clipped = typeof maxLen === 'number' && trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
  return clipped
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value : []
}

function safeJsonStringify(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return '[]'
  }
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

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    if (req.method !== 'GET') {
      res.setHeader('allow', 'GET,OPTIONS')
      return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
    }

    const { supabase, workspaceId } = ctx
    const maxRows = DEFAULT_MAX_ROWS

    const threatType = req.query?.threatType ?? req.query?.threat_type
    const checklistStatus = req.query?.checklistStatus ?? req.query?.checklist_status

    const threatResult = parseThreatTypeFilter(threatType)
    if (threatResult.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: threatResult.error })

    const checklistStatusResult = parseChecklistStatusFilter(checklistStatus)
    if (checklistStatusResult.error)
      return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: checklistStatusResult.error })

    const { count, error: countError } = await supabase
      .from('risks')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .match({
        ...(threatResult.value ? { threat_type: threatResult.value } : {}),
        ...(checklistStatusResult.value ? { checklist_status: checklistStatusResult.value } : {}),
      })

    if (countError) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: countError.message })
      const apiError = supabaseErrorToApiError(countError, { action: 'query' })
      return sendApiError(req, res, apiError)
    }
    if (Number.isFinite(count) && count > maxRows) {
      return sendApiError(req, res, {
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: `Export exceeds limit (${maxRows} rows)`,
        retryable: false,
      })
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="risks.csv"')
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = 200

    res.write(stringifyCsvHeader(CSV_COLUMNS) + '\n')

    const pageSize = 1000
    let offset = 0
    let total = 0

    while (true) {
      const { data, error } = await supabase
        .from('risks')
        .select(
          'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, checklist_status, data, created_at, updated_at',
        )
        .eq('workspace_id', workspaceId)
        .match({
          ...(threatResult.value ? { threat_type: threatResult.value } : {}),
          ...(checklistStatusResult.value ? { checklist_status: checklistStatusResult.value } : {}),
        })
        .order('updated_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (error) {
        logApiWarn('supabase_query_failed', { requestId, workspaceId, offset, message: error.message })
        break
      }

      const batch = data || []
      if (!batch.length) break

      for (const risk of batch) {
        total += 1
        if (total > maxRows) break

        const dataObj = normalizeObject(risk.data)
        const row = {
          csvSpecVersion: CSV_SPEC_VERSION,
          csvVariant: CSV_VARIANT,
          id: risk.id,
          title: normalizeString(risk.title, { maxLen: 200 }),
          description: normalizeString(risk.description ?? '', { maxLen: 5000 }),
          probability: Number(risk.probability),
          impact: Number(risk.impact),
          riskScore: Number(risk.risk_score),
          category: normalizeString(risk.category, { maxLen: 100 }),
          threatType: normalizeString(risk.threat_type, { maxLen: 64 }),
          templateId: normalizeString(dataObj.templateId, { maxLen: 200 }),
          status: normalizeString(risk.status, { maxLen: 32 }),
          mitigationPlan: normalizeString(risk.mitigation_plan ?? '', { maxLen: 5000 }),
          owner: normalizeString(dataObj.owner, { maxLen: 200 }),
          ownerTeam: normalizeString(dataObj.ownerTeam, { maxLen: 200 }),
          dueDate: normalizeString(dataObj.dueDate, { maxLen: 64 }),
          reviewDate: normalizeString(dataObj.reviewDate, { maxLen: 64 }),
          reviewCadence: normalizeString(dataObj.reviewCadence, { maxLen: 32 }),
          riskResponse: normalizeString(dataObj.riskResponse, { maxLen: 32 }),
          ownerResponse: normalizeString(dataObj.ownerResponse, { maxLen: 2000 }),
          securityAdvisorComment: normalizeString(dataObj.securityAdvisorComment, { maxLen: 2000 }),
          vendorResponse: normalizeString(dataObj.vendorResponse, { maxLen: 2000 }),
          notes: normalizeString(dataObj.notes, { maxLen: 10000 }),
          checklistStatus: normalizeString(risk.checklist_status ?? 'not_started', { maxLen: 32 }),
          checklistsJson: safeJsonStringify(normalizeJsonArray(dataObj.checklists)),
          evidenceJson: safeJsonStringify(normalizeJsonArray(dataObj.evidence)),
          mitigationStepsJson: safeJsonStringify(normalizeJsonArray(dataObj.mitigationSteps)),
          creationDate: risk.created_at,
          lastModified: risk.updated_at,
        }

        res.write(stringifyCsvRow({ columns: CSV_COLUMNS, row }) + '\n')
      }

      if (batch.length < pageSize) break
      offset += pageSize
    }

    return res.end()
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
