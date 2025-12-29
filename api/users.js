const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('./_lib/logger')
const { sendApiError, unexpectedErrorToApiError } = require('./_lib/apiErrors')

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    switch (req.method) {
      case 'GET': {
        let workspaceName = null
        try {
          const { data } = await ctx.supabase
            .from('workspaces')
            .select('name')
            .eq('id', ctx.workspaceId)
            .maybeSingle()
          if (data?.name) workspaceName = data.name
        } catch (error) {
          logApiWarn('workspace_name_lookup_failed', {
            requestId,
            workspaceId: ctx.workspaceId,
            userId: ctx.user.id,
            message: typeof error?.message === 'string' ? error.message : undefined,
          })
        }

        return res.status(200).json({
          user: { id: ctx.user.id, email: ctx.user.email ?? null },
          workspaceId: ctx.workspaceId,
          workspaceName,
        })
      }

      case 'POST': {
        return sendApiError(req, res, { status: 501, code: 'NOT_IMPLEMENTED', message: 'Not implemented' })
      }

      default:
        res.setHeader('allow', 'GET,POST,OPTIONS')
        return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
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
