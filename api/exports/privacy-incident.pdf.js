const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const { PdfDoc } = require('../_lib/pdf')

const UUID_V4ish_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeUuid(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!UUID_V4ish_REGEX.test(trimmed)) return null
  return trimmed.toLowerCase()
}

function normalizeTemplateId(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed
}

function safeString(value, { fallback = '', maxLen = 5000 } = {}) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}

function toIsoForFilename(iso) {
  return String(iso).replace(/[:.]/g, '-')
}

function formatDateTime(iso) {
  if (!iso) return '-'
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return String(iso)
  return new Date(parsed).toISOString()
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

    const riskIdParam = Array.isArray(req.query?.riskId) ? req.query.riskId[0] : req.query?.riskId
    const riskId = normalizeUuid(riskIdParam)
    if (!riskId) {
      return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: '`riskId` is required (uuid)' })
    }

    const templateId = normalizeTemplateId(req.query?.checklistTemplateId ?? req.query?.checklist_template_id) ?? 'checklist_privacy_incident_ndb_v1'

    const { supabase, workspaceId } = ctx

    const { data: risk, error: riskError } = await supabase
      .from('risks')
      .select('id, title, description, status, checklist_status, data, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .eq('id', riskId)
      .maybeSingle()

    if (riskError) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: riskError.message })
      const apiError = supabaseErrorToApiError(riskError, { action: 'query' })
      return sendApiError(req, res, apiError)
    }
    if (!risk) return sendApiError(req, res, { status: 404, code: 'NOT_FOUND', message: 'Not found' })

    const { data: checklists, error: checklistError } = await supabase
      .from('risk_checklists')
      .select(
        'id, template_id, template_title, template_description, attached_at, started_at, completed_at, status, items:risk_checklist_items(id, position, description, created_at, completed_at, completed_by)',
      )
      .eq('workspace_id', workspaceId)
      .eq('risk_id', riskId)
      .eq('template_id', templateId)
      .order('attached_at', { ascending: false })
      .order('position', { ascending: true, foreignTable: 'risk_checklist_items' })

    if (checklistError) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: checklistError.message })
      const apiError = supabaseErrorToApiError(checklistError, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    const checklist = Array.isArray(checklists) && checklists.length ? checklists[0] : null
    const items = Array.isArray(checklist?.items) ? checklist.items : []
    const completedCount = items.filter((item) => Boolean(item.completed_at)).length

    const dataObj = risk.data && typeof risk.data === 'object' && !Array.isArray(risk.data) ? risk.data : {}
    const legacyPlaybook =
      dataObj.playbook && typeof dataObj.playbook === 'object' && !Array.isArray(dataObj.playbook) ? dataObj.playbook : null

    const { data: playbooks, error: playbookError } = await supabase
      .from('risk_playbooks')
      .select(
        'id, title, description, attached_at, steps:risk_playbook_steps(id, position, section, description, created_at, completed_at, completed_by)',
      )
      .eq('workspace_id', workspaceId)
      .eq('risk_id', riskId)
      .order('attached_at', { ascending: false })
      .order('position', { ascending: true, foreignTable: 'risk_playbook_steps' })

    if (playbookError) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: playbookError.message })
      const apiError = supabaseErrorToApiError(playbookError, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    const latestPlaybook = Array.isArray(playbooks) && playbooks.length ? playbooks[0] : null
    const dbSteps = Array.isArray(latestPlaybook?.steps) ? latestPlaybook.steps : []

    const playbookTitle = latestPlaybook?.title ?? legacyPlaybook?.title ?? null
    const playbookSteps =
      latestPlaybook && dbSteps.length
        ? dbSteps.map((step) => ({
            description: step?.description,
            completedAt: step?.completed_at,
          }))
        : Array.isArray(legacyPlaybook?.steps)
          ? legacyPlaybook.steps
          : []

    const generatedAtIso = new Date().toISOString()
    const doc = new PdfDoc({ title: 'Privacy incident / checklist report', author: 'Easy Risk Register' })

    doc.addText('Privacy incident / checklist report', { font: 'F1', fontSizePt: 16 })
    doc.addLineBreak(16)
    doc.addText(`Generated: ${generatedAtIso}`, { font: 'F1', fontSizePt: 10 })
    doc.addLineBreak(12)
    doc.addText(`Risk: ${safeString(risk.title, { fallback: '(untitled)', maxLen: 200 })}`, { font: 'F1', fontSizePt: 10 })
    doc.addLineBreak(12)
    doc.addText(`Risk status: ${safeString(risk.status, { fallback: '-' })}`, { font: 'F1', fontSizePt: 10 })
    doc.addLineBreak(12)
    doc.addText(`Checklist template: ${safeString(checklist?.template_title, { fallback: templateId, maxLen: 200 })}`, {
      font: 'F1',
      fontSizePt: 10,
    })
    doc.addLineBreak(12)
    doc.addText(`Checklist completion: ${completedCount}/${items.length} (rollup: ${safeString(risk.checklist_status, { fallback: '-' })})`, {
      font: 'F1',
      fontSizePt: 10,
    })
    doc.addLineBreak(10)
    doc.addHr()

    doc.addText('Risk context', { font: 'F1', fontSizePt: 12 })
    doc.addLineBreak(14)
    doc.addWrappedText(safeString(risk.description, { fallback: '(no description)', maxLen: 5000 }), {
      font: 'F1',
      fontSizePt: 10,
      maxWidthPt: 520,
      lineHeightPt: 12,
    })
    doc.addLineBreak(4)
    doc.addText(`Created: ${formatDateTime(risk.created_at)} | Updated: ${formatDateTime(risk.updated_at)}`, { font: 'F1', fontSizePt: 9 })
    doc.addLineBreak(10)

    if (playbookTitle && playbookSteps.length) {
      doc.addText('Incident response playbook', { font: 'F1', fontSizePt: 12 })
      doc.addLineBreak(12)
      doc.addText(safeString(playbookTitle, { fallback: 'Playbook' }), { font: 'F1', fontSizePt: 10 })
      doc.addLineBreak(12)

      for (let i = 0; i < playbookSteps.length; i += 1) {
        const step = playbookSteps[i] && typeof playbookSteps[i] === 'object' ? playbookSteps[i] : {}
        const status = step.completedAt ? 'Done' : 'Open'
        const timestamp = step.completedAt ? formatDateTime(step.completedAt) : '-'
        doc.addWrappedText(`${i + 1}. [${status}] ${safeString(step.description, { fallback: '' })} (${timestamp})`, {
          font: 'F1',
          fontSizePt: 10,
          maxWidthPt: 520,
          lineHeightPt: 12,
        })
      }
      doc.addLineBreak(4)
    }

    doc.addText('Checklist items', { font: 'F1', fontSizePt: 12 })
    doc.addLineBreak(12)

    if (!checklist) {
      doc.addWrappedText('Checklist is not attached to this risk.', { font: 'F1', fontSizePt: 10, maxWidthPt: 520 })
    } else if (!items.length) {
      doc.addWrappedText('No checklist items found.', { font: 'F1', fontSizePt: 10, maxWidthPt: 520 })
    } else {
      for (const item of items) {
        const status = item.completed_at ? 'Done' : 'Open'
        const completedAt = item.completed_at ? formatDateTime(item.completed_at) : '-'
        const prefix = `${String(item.position ?? '').padStart(2, ' ')}. [${status}] `
        doc.addWrappedText(prefix + safeString(item.description, { fallback: '', maxLen: 2000 }), {
          font: 'F1',
          fontSizePt: 10,
          maxWidthPt: 520,
          lineHeightPt: 12,
        })
        doc.addText(`Completed at: ${completedAt}`, { font: 'F1', fontSizePt: 9 })
        doc.addLineBreak(12)
      }
    }

    const pdf = doc.toBuffer()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="privacy-incident-${riskId}-${toIsoForFilename(generatedAtIso)}.pdf"`,
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
