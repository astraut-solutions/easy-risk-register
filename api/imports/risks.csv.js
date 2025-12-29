const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { parseCsv, readTextBody, hasUnescapedFormulaCell, DEFAULT_MAX_CSV_BYTES } = require('../_lib/csv')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')

const MAX_IMPORT_ROWS = 2000

function clampInt(value, { min, max, fallback }) {
  const num = Number.parseInt(String(value), 10)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

function normalizeText(value, { maxLen, allowEmpty = false, trim = true } = {}) {
  if (typeof value !== 'string') return null
  const raw = trim ? value.trim() : value
  if (!raw && !allowEmpty) return null
  if (typeof maxLen === 'number' && raw.length > maxLen) return raw.slice(0, maxLen)
  return raw
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

function parseReviewCadence(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'weekly' || v === 'monthly' || v === 'quarterly' || v === 'semiannual' || v === 'annual' || v === 'ad-hoc')
    return v
  return null
}

function parseRiskResponse(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'treat' || v === 'transfer' || v === 'tolerate' || v === 'terminate') return v
  return null
}

function parseChecklistStatus(value) {
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'not_started' || v === 'in_progress' || v === 'done') return v
  return null
}

function normalizeISODateOrUndefined(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const t = Date.parse(trimmed)
  if (!Number.isFinite(t)) return undefined
  if (!/^\d{4}-\d{2}-\d{2}t/i.test(trimmed)) return undefined
  return trimmed
}

function normalizeHttpUrlOrUndefined(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function getCell(record, names) {
  for (const name of names) {
    const v = record[name]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

function normalizeSafeCell(value) {
  if (typeof value !== 'string') return value
  const trimmedLeft = value.replace(/^\s+/, '')
  if (trimmedLeft.startsWith("'") && trimmedLeft.length >= 2) {
    const candidate = trimmedLeft[1]
    if (candidate === '=' || candidate === '+' || candidate === '-' || candidate === '@') {
      return trimmedLeft.slice(1)
    }
  }
  return value
}

function parseJsonArray(value) {
  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []
  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeEvidenceArray(entries) {
  const now = new Date().toISOString()
  if (!Array.isArray(entries)) return []
  const out = []

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue

    const url = normalizeHttpUrlOrUndefined(entry.url)
    if (!url) continue

    const type = typeof entry.type === 'string' && entry.type.trim() ? entry.type.trim().slice(0, 32) : 'link'
    const description =
      typeof entry.description === 'string' && entry.description.trim()
        ? entry.description.trim().slice(0, 2000)
        : undefined
    const addedAt = normalizeISODateOrUndefined(entry.addedAt) ?? now

    out.push({ type, url, ...(description ? { description } : {}), addedAt })
    if (out.length >= 200) break
  }

  return out
}

function normalizeMitigationStepsArray(entries) {
  const now = new Date().toISOString()
  if (!Array.isArray(entries)) return []
  const out = []

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue

    const description =
      typeof entry.description === 'string' && entry.description.trim()
        ? entry.description.trim().slice(0, 2000)
        : null
    if (!description) continue

    const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim().slice(0, 64) : undefined
    const owner =
      typeof entry.owner === 'string' && entry.owner.trim() ? entry.owner.trim().slice(0, 200) : undefined
    const dueDate = normalizeISODateOrUndefined(entry.dueDate)
    const status = entry.status === 'done' || entry.status === 'open' ? entry.status : 'open'
    const createdAt = normalizeISODateOrUndefined(entry.createdAt) ?? now
    const completedAt = normalizeISODateOrUndefined(entry.completedAt)

    out.push({
      ...(id ? { id } : {}),
      description,
      ...(owner ? { owner } : {}),
      ...(dueDate ? { dueDate } : {}),
      status,
      createdAt,
      ...(completedAt ? { completedAt } : {}),
    })
    if (out.length >= 200) break
  }

  return out
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

    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST,OPTIONS')
      return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
    }

    const { supabase, workspaceId } = ctx
    const csvText = await readTextBody(req, { maxBytes: DEFAULT_MAX_CSV_BYTES })

    const parsed = parseCsv(csvText, { maxRows: MAX_IMPORT_ROWS, maxColumns: 64 })
    if (parsed.error) return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: parsed.error })

    const records = parsed.records || []
    if (!records.length) {
      return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: 'CSV contains no data rows' })
    }

    const toInsert = []
    const errors = []

    for (let index = 0; index < records.length; index += 1) {
      const row = records[index]
      const rowNumber = index + 2 // header is row 1

      const titleCell = String(getCell(row, ['title']) ?? '')
      if (hasUnescapedFormulaCell(titleCell)) {
        errors.push({ row: rowNumber, field: 'title', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const title = normalizeText(String(normalizeSafeCell(titleCell) ?? ''), { maxLen: 200 })
      if (!title) {
        errors.push({ row: rowNumber, field: 'title', error: 'Required' })
        continue
      }

      const categoryCell = String(getCell(row, ['category']) ?? '')
      if (hasUnescapedFormulaCell(categoryCell)) {
        errors.push({ row: rowNumber, field: 'category', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const category = normalizeText(String(normalizeSafeCell(categoryCell) ?? ''), { maxLen: 100 })
      if (!category) {
        errors.push({ row: rowNumber, field: 'category', error: 'Required' })
        continue
      }

      const descriptionCell = String(getCell(row, ['description']) ?? '')
      if (hasUnescapedFormulaCell(descriptionCell)) {
        errors.push({ row: rowNumber, field: 'description', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const description =
        normalizeText(String(normalizeSafeCell(descriptionCell) ?? ''), { maxLen: 5000, allowEmpty: true }) ?? ''

      const mitigationPlanCell = String(getCell(row, ['mitigationPlan', 'mitigation_plan']) ?? '')
      if (hasUnescapedFormulaCell(mitigationPlanCell)) {
        errors.push({ row: rowNumber, field: 'mitigationPlan', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const mitigationPlan =
        normalizeText(String(normalizeSafeCell(mitigationPlanCell) ?? ''), { maxLen: 5000, allowEmpty: true }) ?? ''

      const probability = clampInt(getCell(row, ['probability']), { min: 1, max: 5, fallback: NaN })
      if (!Number.isFinite(probability)) {
        errors.push({ row: rowNumber, field: 'probability', error: 'Expected integer 1-5' })
        continue
      }

      const impact = clampInt(getCell(row, ['impact']), { min: 1, max: 5, fallback: NaN })
      if (!Number.isFinite(impact)) {
        errors.push({ row: rowNumber, field: 'impact', error: 'Expected integer 1-5' })
        continue
      }

      const statusRaw = getCell(row, ['status'])
      const status = statusRaw === undefined ? 'open' : parseRiskStatus(String(statusRaw))
      if (!status) {
        errors.push({ row: rowNumber, field: 'status', error: 'Invalid value' })
        continue
      }

      const threatRaw = getCell(row, ['threatType', 'threat_type'])
      const threatType = threatRaw === undefined ? 'other' : parseThreatType(String(threatRaw))
      if (!threatType) {
        errors.push({ row: rowNumber, field: 'threatType', error: 'Invalid value' })
        continue
      }

      const templateIdCell = String(getCell(row, ['templateId']) ?? '')
      if (hasUnescapedFormulaCell(templateIdCell)) {
        errors.push({ row: rowNumber, field: 'templateId', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const templateId =
        normalizeText(String(normalizeSafeCell(templateIdCell) ?? ''), { maxLen: 200, allowEmpty: true }) ?? ''

      const ownerCell = String(getCell(row, ['owner']) ?? '')
      if (hasUnescapedFormulaCell(ownerCell)) {
        errors.push({ row: rowNumber, field: 'owner', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const owner = normalizeText(String(normalizeSafeCell(ownerCell) ?? ''), { maxLen: 200, allowEmpty: true }) ?? ''

      const ownerTeamCell = String(getCell(row, ['ownerTeam']) ?? '')
      if (hasUnescapedFormulaCell(ownerTeamCell)) {
        errors.push({ row: rowNumber, field: 'ownerTeam', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const ownerTeam =
        normalizeText(String(normalizeSafeCell(ownerTeamCell) ?? ''), { maxLen: 200, allowEmpty: true }) ?? ''

      const dueDate = normalizeISODateOrUndefined(String(getCell(row, ['dueDate']) ?? ''))
      const reviewDate = normalizeISODateOrUndefined(String(getCell(row, ['reviewDate']) ?? ''))
      const reviewCadence = parseReviewCadence(String(getCell(row, ['reviewCadence']) ?? ''))

      const riskResponseRaw = getCell(row, ['riskResponse'])
      const riskResponse = riskResponseRaw ? parseRiskResponse(String(riskResponseRaw)) : null
      if (riskResponseRaw && !riskResponse) {
        errors.push({ row: rowNumber, field: 'riskResponse', error: 'Invalid value' })
        continue
      }

      const ownerResponseCell = String(getCell(row, ['ownerResponse']) ?? '')
      if (hasUnescapedFormulaCell(ownerResponseCell)) {
        errors.push({ row: rowNumber, field: 'ownerResponse', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const ownerResponse =
        normalizeText(String(normalizeSafeCell(ownerResponseCell) ?? ''), { maxLen: 2000, allowEmpty: true }) ?? ''

      const securityAdvisorCommentCell = String(getCell(row, ['securityAdvisorComment']) ?? '')
      if (hasUnescapedFormulaCell(securityAdvisorCommentCell)) {
        errors.push({ row: rowNumber, field: 'securityAdvisorComment', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const securityAdvisorComment =
        normalizeText(String(normalizeSafeCell(securityAdvisorCommentCell) ?? ''), { maxLen: 2000, allowEmpty: true }) ??
        ''

      const vendorResponseCell = String(getCell(row, ['vendorResponse']) ?? '')
      if (hasUnescapedFormulaCell(vendorResponseCell)) {
        errors.push({ row: rowNumber, field: 'vendorResponse', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const vendorResponse =
        normalizeText(String(normalizeSafeCell(vendorResponseCell) ?? ''), { maxLen: 2000, allowEmpty: true }) ?? ''

      const notesCell = String(getCell(row, ['notes']) ?? '')
      if (hasUnescapedFormulaCell(notesCell)) {
        errors.push({ row: rowNumber, field: 'notes', error: 'Unsafe spreadsheet formula detected' })
        continue
      }
      const notes = normalizeText(String(normalizeSafeCell(notesCell) ?? ''), { maxLen: 10000, allowEmpty: true }) ?? ''

      const checklistStatusRaw = getCell(row, ['checklistStatus'])
      const checklistStatus = checklistStatusRaw ? parseChecklistStatus(String(checklistStatusRaw)) : null
      if (checklistStatusRaw && !checklistStatus) {
        errors.push({ row: rowNumber, field: 'checklistStatus', error: 'Invalid value' })
        continue
      }

      const evidenceJson = getCell(row, ['evidenceJson', 'evidence'])
      const mitigationStepsJson = getCell(row, ['mitigationStepsJson', 'mitigationSteps'])
      const checklistsJson = getCell(row, ['checklistsJson', 'checklists'])

      const evidenceFromJson = normalizeEvidenceArray(parseJsonArray(evidenceJson))
      const stepsFromJson = normalizeMitigationStepsArray(parseJsonArray(mitigationStepsJson))
      const checklistsFromJson = parseJsonArray(checklistsJson).slice(0, 200)

      const evidenceUrlsRaw = getCell(row, ['evidenceUrls'])
      const evidenceFromUrls =
        !evidenceFromJson.length && typeof evidenceUrlsRaw === 'string' && evidenceUrlsRaw.trim()
          ? evidenceUrlsRaw
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 200)
              .map((url) => {
                const parsedUrl = normalizeHttpUrlOrUndefined(url)
                return parsedUrl ? { type: 'link', url: parsedUrl, addedAt: new Date().toISOString() } : null
              })
              .filter(Boolean)
          : []

      const data = {}
      if (templateId) data.templateId = templateId
      if (owner) data.owner = owner
      if (ownerTeam) data.ownerTeam = ownerTeam
      if (dueDate) data.dueDate = dueDate
      if (reviewDate) data.reviewDate = reviewDate
      if (reviewCadence) data.reviewCadence = reviewCadence
      data.riskResponse = riskResponse ?? 'treat'
      if (ownerResponse) data.ownerResponse = ownerResponse
      if (securityAdvisorComment) data.securityAdvisorComment = securityAdvisorComment
      if (vendorResponse) data.vendorResponse = vendorResponse
      if (notes) data.notes = notes
      if (checklistStatus) data.checklistStatus = checklistStatus
      if (checklistsFromJson.length) data.checklists = checklistsFromJson
      if (evidenceFromJson.length || evidenceFromUrls.length) data.evidence = evidenceFromJson.length ? evidenceFromJson : evidenceFromUrls
      if (stepsFromJson.length) data.mitigationSteps = stepsFromJson

      toInsert.push({
        workspace_id: workspaceId,
        title,
        description,
        mitigation_plan: mitigationPlan,
        probability,
        impact,
        category,
        status,
        threat_type: threatType,
        ...(checklistStatus ? { checklist_status: checklistStatus } : {}),
        data,
      })
    }

    if (!toInsert.length) {
      return sendApiError(req, res, {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'No valid rows to import',
        details: errors.slice(0, 50),
      })
    }

    let imported = 0
    for (let offset = 0; offset < toInsert.length; offset += 200) {
      const batch = toInsert.slice(offset, offset + 200)
      const { error } = await supabase.from('risks').insert(batch)
      if (error) {
        logApiWarn('supabase_insert_failed', { requestId, workspaceId, message: error.message })
        const apiError = supabaseErrorToApiError(error, { action: 'insert' })
        return sendApiError(req, res, apiError)
      }
      imported += batch.length
    }

    return res.status(200).json({
      imported,
      skipped: records.length - imported,
      errors: errors.slice(0, 50),
    })
  } catch (error) {
    if (error && error.code === 'PAYLOAD_TOO_LARGE') {
      return sendApiError(req, res, { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'CSV payload too large' })
    }
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
