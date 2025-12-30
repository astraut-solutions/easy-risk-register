const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const { PdfDoc } = require('../_lib/pdf')
const { getWorkspaceRiskThresholds, severityFromScore } = require('../_lib/riskScoring')

const DEFAULT_MAX_ROWS = 2000

function clampInt(value, { min, max, fallback }) {
  const num = Number.parseInt(String(value), 10)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

function normalizeText(value, { maxLen } = {}) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (typeof maxLen === 'number' && trimmed.length > maxLen) return trimmed.slice(0, maxLen)
  return trimmed
}

function parseEnumFilter(value, { allowed, paramName }) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string') return { error: `Invalid ${paramName}` }
  const v = value.trim().toLowerCase()
  if (!v || v === 'all') return { value: null }
  return allowed.has(v) ? { value: v } : { error: `Invalid ${paramName}` }
}

function parseCategoryFilter(value) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Invalid category' }
  const normalized = value.trim()
  if (!normalized || normalized.toLowerCase() === 'all') return { value: null }
  return { value: normalized.slice(0, 100) }
}

function parseNumberFilter(value, { min, max, name }) {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== 'string' && typeof value !== 'number') return { error: `Invalid ${name}` }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'all') return { value: null }
  const num = clampInt(value, { min, max, fallback: NaN })
  if (!Number.isFinite(num)) return { error: `Invalid ${name}` }
  return { value: num }
}

function toIsoForFilename(iso) {
  return String(iso).replace(/[:.]/g, '-')
}

function formatFiltersForPdf(filters) {
  const parts = []
  if (filters.q) parts.push(`Search: ${filters.q}`)
  if (filters.category) parts.push(`Category: ${filters.category}`)
  if (filters.status) parts.push(`Status: ${filters.status}`)
  if (filters.threatType) parts.push(`Threat: ${filters.threatType}`)
  if (filters.checklistStatus) parts.push(`Checklist: ${filters.checklistStatus}`)
  if (Number.isFinite(filters.probability)) parts.push(`Probability: ${filters.probability}`)
  if (Number.isFinite(filters.impact)) parts.push(`Impact: ${filters.impact}`)
  if (Number.isFinite(filters.minScore)) parts.push(`Min score: ${filters.minScore}`)
  if (Number.isFinite(filters.maxScore)) parts.push(`Max score: ${filters.maxScore}`)
  return parts.length ? parts.join(' | ') : 'None (all risks)'
}

function makeRiskRowLine(risk) {
  const cols = [
    (risk.title || '').slice(0, 38).padEnd(38, ' '),
    (risk.category || '').slice(0, 14).padEnd(14, ' '),
    (risk.status || '').slice(0, 9).padEnd(9, ' '),
    String(risk.probability ?? '').padStart(1, ' ').padEnd(2, ' '),
    String(risk.impact ?? '').padStart(1, ' ').padEnd(2, ' '),
    String(risk.riskScore ?? '').padStart(2, ' ').padEnd(4, ' '),
    (risk.severity || '').slice(0, 6).padEnd(6, ' '),
    (risk.threatType || '').slice(0, 12).padEnd(12, ' '),
    (risk.checklistStatus || '').slice(0, 11).padEnd(11, ' '),
  ]
  return cols.join(' ')
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

    const q = normalizeText(req.query?.q, { maxLen: 200 })
    const categoryResult = parseCategoryFilter(req.query?.category)
    if (categoryResult.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: categoryResult.error })

    const statusResult = parseEnumFilter(req.query?.status, {
      paramName: 'status',
      allowed: new Set(['open', 'mitigated', 'closed', 'accepted']),
    })
    if (statusResult.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: statusResult.error })

    const threatType = req.query?.threatType ?? req.query?.threat_type
    const threatResult = parseEnumFilter(threatType, {
      paramName: 'threatType',
      allowed: new Set([
        'phishing',
        'ransomware',
        'business_email_compromise',
        'malware',
        'vulnerability',
        'data_breach',
        'supply_chain',
        'insider',
        'other',
      ]),
    })
    if (threatResult.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: threatResult.error })

    const checklistStatus = req.query?.checklistStatus ?? req.query?.checklist_status
    const checklistStatusResult = parseEnumFilter(checklistStatus, {
      paramName: 'checklistStatus',
      allowed: new Set(['not_started', 'in_progress', 'done']),
    })
    if (checklistStatusResult.error)
      return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: checklistStatusResult.error })

    const probabilityResult = parseNumberFilter(req.query?.probability, { min: 1, max: 5, name: 'probability' })
    if (probabilityResult.error)
      return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: probabilityResult.error })

    const impactResult = parseNumberFilter(req.query?.impact, { min: 1, max: 5, name: 'impact' })
    if (impactResult.error)
      return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: impactResult.error })

    const minScoreResult = parseNumberFilter(req.query?.minScore, { min: 1, max: 25, name: 'minScore' })
    if (minScoreResult.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: minScoreResult.error })

    const maxScoreResult = parseNumberFilter(req.query?.maxScore, { min: 1, max: 25, name: 'maxScore' })
    if (maxScoreResult.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: maxScoreResult.error })

    const maxRows = clampInt(req.query?.maxRows ?? req.query?.max_rows ?? DEFAULT_MAX_ROWS, {
      min: 1,
      max: DEFAULT_MAX_ROWS,
      fallback: DEFAULT_MAX_ROWS,
    })

    const thresholdsResult = await getWorkspaceRiskThresholds({ supabase, workspaceId })
    if (thresholdsResult.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: thresholdsResult.error.message })
      return sendApiError(req, res, thresholdsResult.error)
    }
    const thresholds = thresholdsResult.thresholds

    let countQuery = supabase.from('risks').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId)
    if (categoryResult.value) countQuery = countQuery.eq('category', categoryResult.value)
    if (statusResult.value) countQuery = countQuery.eq('status', statusResult.value)
    if (threatResult.value) countQuery = countQuery.eq('threat_type', threatResult.value)
    if (checklistStatusResult.value) countQuery = countQuery.eq('checklist_status', checklistStatusResult.value)
    if (probabilityResult.value) countQuery = countQuery.eq('probability', probabilityResult.value)
    if (impactResult.value) countQuery = countQuery.eq('impact', impactResult.value)
    if (Number.isFinite(minScoreResult.value)) countQuery = countQuery.gte('risk_score', minScoreResult.value)
    if (Number.isFinite(maxScoreResult.value)) countQuery = countQuery.lte('risk_score', maxScoreResult.value)
    if (q) {
      const term = q.replace(/,/g, ' ')
      countQuery = countQuery.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    }

    const { count, error: countError } = await countQuery
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

    const pageSize = 500
    let offset = 0
    const rows = []

    while (true) {
      let query = supabase
        .from('risks')
        .select(
          'id, title, description, probability, impact, risk_score, category, status, threat_type, mitigation_plan, checklist_status, data, created_at, updated_at',
        )
        .eq('workspace_id', workspaceId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (categoryResult.value) query = query.eq('category', categoryResult.value)
      if (statusResult.value) query = query.eq('status', statusResult.value)
      if (threatResult.value) query = query.eq('threat_type', threatResult.value)
      if (checklistStatusResult.value) query = query.eq('checklist_status', checklistStatusResult.value)
      if (probabilityResult.value) query = query.eq('probability', probabilityResult.value)
      if (impactResult.value) query = query.eq('impact', impactResult.value)
      if (Number.isFinite(minScoreResult.value)) query = query.gte('risk_score', minScoreResult.value)
      if (Number.isFinite(maxScoreResult.value)) query = query.lte('risk_score', maxScoreResult.value)
      if (q) {
        const term = q.replace(/,/g, ' ')
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      }

      const { data, error } = await query
      if (error) {
        logApiWarn('supabase_query_failed', { requestId, workspaceId, offset, message: error.message })
        const apiError = supabaseErrorToApiError(error, { action: 'query' })
        return sendApiError(req, res, apiError)
      }

      const batch = data || []
      if (!batch.length) break

      for (const row of batch) {
        rows.push({
          id: row.id,
          title: row.title,
          category: row.category,
          status: row.status,
          probability: Number(row.probability),
          impact: Number(row.impact),
          riskScore: Number(row.risk_score),
          severity: severityFromScore(Number(row.risk_score), thresholds),
          threatType: row.threat_type,
          checklistStatus: row.checklist_status ?? 'not_started',
          data: row.data ?? {},
        })
      }

      if (batch.length < pageSize) break
      offset += pageSize
    }

    const generatedAtIso = new Date().toISOString()
    const doc = new PdfDoc({ title: 'Risk register export', author: 'Easy Risk Register' })

    doc.addText('Risk register export', { font: 'F1', fontSizePt: 18 })
    doc.addLineBreak(18)
    doc.addText(`Generated: ${generatedAtIso}`, { font: 'F1', fontSizePt: 10 })
    doc.addLineBreak(12)
    doc.addText(`Applied filters: ${formatFiltersForPdf({
      q,
      category: categoryResult.value,
      status: statusResult.value,
      threatType: threatResult.value,
      checklistStatus: checklistStatusResult.value,
      probability: probabilityResult.value,
      impact: impactResult.value,
      minScore: minScoreResult.value,
      maxScore: maxScoreResult.value,
    })}`, { font: 'F1', fontSizePt: 10 })
    doc.addLineBreak(14)
    doc.addText(`Total risks: ${rows.length}`, { font: 'F1', fontSizePt: 10 })
    doc.addLineBreak(10)
    doc.addHr()

    doc.addText('Title                                   Category        Status    P I  Sc  Sev    Threat       Checklist', {
      font: 'F2',
      fontSizePt: 9,
    })
    doc.addLineBreak(11)
    doc.addText('----------------------------------------------------------------------------------------------------------', {
      font: 'F2',
      fontSizePt: 9,
    })
    doc.addLineBreak(11)

    for (const risk of rows) {
      doc.addText(makeRiskRowLine(risk), { font: 'F2', fontSizePt: 9 })
      doc.addLineBreak(11)
    }

    const pdf = doc.toBuffer()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="risk-register-${toIsoForFilename(generatedAtIso)}.pdf"`,
    )
    res.setHeader('Cache-Control', 'no-store')
    res.statusCode = 200
    return res.end(pdf)
  } catch (error) {
    logApiError({ requestId, method: req.method, path: req.url, error })
    const apiError = unexpectedErrorToApiError(error)
    return sendApiError(req, res, apiError)
  } finally {
    logApiResponse({ requestId, method: req.method, path: req.url, status: res.statusCode, durationMs: Date.now() - start })
  }
}

