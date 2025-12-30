const { ensureRequestId, handleOptions, setCors } = require('../../_lib/http')
const { requireApiContext } = require('../../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../../_lib/apiErrors')
const { getWorkspaceRole, isAuditViewerRole } = require('../../_lib/auditEvents')

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

function mapAuditRow(row) {
  return {
    id: row.id,
    riskId: row.risk_id,
    type: row.event_type,
    occurredAt: row.occurred_at,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    payload: row.payload ?? {},
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

    const { supabase, workspaceId, user } = ctx

    const roleResult = await getWorkspaceRole({ supabase, workspaceId, userId: user.id })
    if (roleResult.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: roleResult.error.message })
      return sendApiError(req, res, roleResult.error)
    }
    if (!isAuditViewerRole(roleResult.role)) {
      return sendApiError(req, res, { status: 403, code: 'FORBIDDEN', message: 'Forbidden', retryable: false })
    }

    switch (req.method) {
      case 'GET': {
        const limit = clampInt(req.query?.limit, { min: 1, max: 500, fallback: 100 })
        const offset = clampInt(req.query?.offset, { min: 0, max: 100000, fallback: 0 })

        const { data, error } = await supabase
          .from('audit_events')
          .select('id, risk_id, event_type, occurred_at, actor_user_id, actor_role, payload')
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .order('occurred_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }

        return res.status(200).json({ items: (data || []).map(mapAuditRow) })
      }

      default:
        res.setHeader('allow', 'GET,OPTIONS')
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

