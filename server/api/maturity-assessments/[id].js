const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const { readJsonBody } = require('../_lib/body')
const {
  normalizeUuid,
  parseOptionalIsoTimestampOrNull,
  parseScoresObject,
  getAssessmentWithScores,
  rpcErrorToResponse,
} = require('./_shared')

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
    const assessmentId = normalizeUuid(idParam)
    if (!assessmentId) return res.status(400).json({ error: 'Invalid assessment id' })

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'GET': {
        const detailsResult = await getAssessmentWithScores({ supabase, workspaceId, assessmentId })
        if (detailsResult.error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: detailsResult.error.message })
          const apiError = supabaseErrorToApiError(detailsResult.error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }
        if (!detailsResult.data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json(detailsResult.data)
      }

      case 'PATCH': {
        const body = await readJsonBody(req, { maxBytes: 64 * 1024 })
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const assessedAtParsed = parseOptionalIsoTimestampOrNull(body.assessedAt ?? body.assessed_at)
        if (assessedAtParsed.error) return res.status(400).json({ error: 'Invalid assessedAt' })

        const hasScores = body.scores !== undefined && body.scores !== null
        const scoresParsed = hasScores ? parseScoresObject(body.scores) : { value: null }
        if (scoresParsed.error) return res.status(400).json({ error: scoresParsed.error })

        if (assessedAtParsed.value === undefined && !hasScores) {
          return res.status(400).json({ error: 'No fields to update' })
        }

        const { error: rpcError } = await supabase.rpc('update_maturity_assessment', {
          p_workspace_id: workspaceId,
          p_assessment_id: assessmentId,
          p_assessed_at: assessedAtParsed.value === undefined ? null : assessedAtParsed.value,
          p_scores: hasScores ? scoresParsed.value : null,
        })

        if (rpcError) {
          logApiWarn('supabase_rpc_failed', { requestId, workspaceId, message: rpcError.message })
          const mapped = rpcErrorToResponse(rpcError)
          if (mapped) return sendApiError(req, res, { ...mapped, retryable: false })
          const apiError = supabaseErrorToApiError(rpcError, { action: 'rpc' })
          return sendApiError(req, res, apiError)
        }

        const detailsResult = await getAssessmentWithScores({ supabase, workspaceId, assessmentId })
        if (detailsResult.error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: detailsResult.error.message })
          const apiError = supabaseErrorToApiError(detailsResult.error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }
        if (!detailsResult.data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json(detailsResult.data)
      }

      case 'DELETE': {
        const { data, error } = await supabase
          .from('maturity_assessments')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('id', assessmentId)
          .select('id')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_delete_failed', { requestId, workspaceId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'delete' })
          return sendApiError(req, res, apiError)
        }

        if (!data) return res.status(404).json({ error: 'Not found' })
        return res.status(204).send('')
      }

      default:
        res.setHeader('allow', 'GET,PATCH,DELETE,OPTIONS')
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

