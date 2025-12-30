const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const { normalizeFrameworkId, getAssessmentWithScores } = require('./_shared')

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

    const frameworkIdParam = Array.isArray(req.query?.frameworkId) ? req.query.frameworkId[0] : req.query?.frameworkId
    const frameworkId = normalizeFrameworkId(frameworkIdParam)
    if (!frameworkId) return res.status(400).json({ error: 'Invalid frameworkId' })

    const { supabase, workspaceId } = ctx

    const { data: latest, error } = await supabase
      .from('maturity_assessments')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('framework_id', frameworkId)
      .order('assessed_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
      const apiError = supabaseErrorToApiError(error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }
    if (!latest?.id) return res.status(404).json({ error: 'Not found' })

    const detailsResult = await getAssessmentWithScores({ supabase, workspaceId, assessmentId: latest.id })
    if (detailsResult.error) {
      logApiWarn('supabase_query_failed', { requestId, workspaceId, message: detailsResult.error.message })
      const apiError = supabaseErrorToApiError(detailsResult.error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }
    if (!detailsResult.data) return res.status(404).json({ error: 'Not found' })

    return res.status(200).json(detailsResult.data)
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

