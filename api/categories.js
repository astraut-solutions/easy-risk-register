const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('./_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('./_lib/apiErrors')

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET,OPTIONS')
    return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
  }

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    const { supabase, workspaceId } = ctx

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true })

    if (error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
      const apiError = supabaseErrorToApiError(error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    const categories = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }))

    return res.status(200).json(categories)
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

