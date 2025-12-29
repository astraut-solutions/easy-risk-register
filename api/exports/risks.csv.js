const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { stringifyCsv, DEFAULT_MAX_ROWS } = require('../_lib/csv')

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

async function fetchRisksForExport({ supabase, workspaceId, maxRows }) {
  const pageSize = 1000
  let offset = 0
  const items = []

  while (true) {
    const { data, error } = await supabase
      .from('risks')
      .select(
        'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, data, created_at, updated_at',
      )
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) return { error: `Supabase query failed: ${error.message}` }

    const batch = data || []
    if (!batch.length) break

    items.push(...batch)
    if (items.length > maxRows) return { error: `Export exceeds limit (${maxRows} rows)` }

    if (batch.length < pageSize) break
    offset += pageSize
  }

  return { items }
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
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const { supabase, workspaceId } = ctx
    const maxRows = DEFAULT_MAX_ROWS

    const result = await fetchRisksForExport({ supabase, workspaceId, maxRows })
    if (result.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: result.error })
      const status = result.error.includes('exceeds limit') ? 413 : 502
      return res.status(status).json({ error: result.error })
    }

    const rows = result.items.map((risk) => {
      const data = normalizeObject(risk.data)

      return {
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
        templateId: normalizeString(data.templateId, { maxLen: 200 }),
        status: normalizeString(risk.status, { maxLen: 32 }),
        mitigationPlan: normalizeString(risk.mitigation_plan ?? '', { maxLen: 5000 }),
        owner: normalizeString(data.owner, { maxLen: 200 }),
        ownerTeam: normalizeString(data.ownerTeam, { maxLen: 200 }),
        dueDate: normalizeString(data.dueDate, { maxLen: 64 }),
        reviewDate: normalizeString(data.reviewDate, { maxLen: 64 }),
        reviewCadence: normalizeString(data.reviewCadence, { maxLen: 32 }),
        riskResponse: normalizeString(data.riskResponse, { maxLen: 32 }),
        ownerResponse: normalizeString(data.ownerResponse, { maxLen: 2000 }),
        securityAdvisorComment: normalizeString(data.securityAdvisorComment, { maxLen: 2000 }),
        vendorResponse: normalizeString(data.vendorResponse, { maxLen: 2000 }),
        notes: normalizeString(data.notes, { maxLen: 10000 }),
        checklistStatus: normalizeString(data.checklistStatus, { maxLen: 32 }),
        checklistsJson: safeJsonStringify(normalizeJsonArray(data.checklists)),
        evidenceJson: safeJsonStringify(normalizeJsonArray(data.evidence)),
        mitigationStepsJson: safeJsonStringify(normalizeJsonArray(data.mitigationSteps)),
        creationDate: risk.created_at,
        lastModified: risk.updated_at,
      }
    })

    const csv = stringifyCsv({ columns: CSV_COLUMNS, rows })

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="risks.csv"')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).end(csv)
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

