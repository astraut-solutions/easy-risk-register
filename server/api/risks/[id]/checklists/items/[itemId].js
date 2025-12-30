const { ensureRequestId, handleOptions, setCors } = require('../../../../_lib/http')
const { requireApiContext } = require('../../../../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../../../../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../../../../_lib/apiErrors')
const { readJsonBody } = require('../../../../_lib/body')
const { insertAuditEvent } = require('../../../../_lib/auditEvents')

const UUID_V4ish_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeUuid(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!UUID_V4ish_REGEX.test(trimmed)) return null
  return trimmed.toLowerCase()
}

function rpcErrorToResponse(error) {
  const message = typeof error?.message === 'string' ? error.message : ''

  if (message.includes('Forbidden')) return { status: 403, code: 'FORBIDDEN', message: 'Forbidden' }
  if (message.includes('Item not found')) return { status: 404, code: 'NOT_FOUND', message: 'Not found' }

  return null
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

    const riskIdParam = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
    const riskId = normalizeUuid(riskIdParam)
    if (!riskId) return res.status(400).json({ error: 'Invalid risk id' })

    const itemIdParam = Array.isArray(req.query?.itemId) ? req.query.itemId[0] : req.query?.itemId
    const itemId = normalizeUuid(itemIdParam)
    if (!itemId) return res.status(400).json({ error: 'Invalid item id' })

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'PATCH': {
        const body = await readJsonBody(req, { maxBytes: 64 * 1024 })
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const completed = body.completed
        if (typeof completed !== 'boolean') {
          return res.status(400).json({ error: '`completed` must be a boolean' })
        }

        const { data, error } = await supabase.rpc('set_risk_checklist_item_completed', {
          p_workspace_id: workspaceId,
          p_risk_id: riskId,
          p_item_id: itemId,
          p_completed: completed,
        })

        if (error) {
          logApiWarn('supabase_rpc_failed', { requestId, workspaceId, riskId, itemId, message: error.message })
          const mapped = rpcErrorToResponse(error)
          if (mapped) return sendApiError(req, res, { ...mapped, retryable: false })
          const apiError = supabaseErrorToApiError(error, { action: 'rpc' })
          return sendApiError(req, res, apiError)
        }

        const row = Array.isArray(data) ? data[0] : data
        if (!row) {
          return sendApiError(req, res, {
            status: 502,
            code: 'SUPABASE_ERROR',
            message: 'Supabase rpc failed: missing response',
            retryable: false,
          })
        }

        const auditResult = await insertAuditEvent({
          supabase,
          workspaceId,
          riskId,
          eventType: completed ? 'checklist_item.completed' : 'checklist_item.uncompleted',
          payload: {
            itemId: row.item_id,
            checklistId: row.checklist_id,
            completed,
            completedAt: row.completed_at,
            checklistStatus: row.checklist_status,
            riskChecklistStatus: row.risk_checklist_status,
          },
        })
        if (auditResult?.error) {
          logApiWarn('audit_insert_failed', { requestId, workspaceId, riskId, itemId, message: auditResult.error.message })
        }

        return res.status(200).json({
          itemId: row.item_id,
          checklistId: row.checklist_id,
          completedAt: row.completed_at,
          checklistStatus: row.checklist_status,
          riskChecklistStatus: row.risk_checklist_status,
        })
      }

      default:
        res.setHeader('allow', 'PATCH,OPTIONS')
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
