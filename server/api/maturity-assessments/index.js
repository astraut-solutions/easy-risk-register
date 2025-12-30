const { ensureRequestId, handleOptions, setCors } = require('../_lib/http')
const { requireApiContext } = require('../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../_lib/apiErrors')
const { readJsonBody } = require('../_lib/body')
const {
  clampInt,
  normalizeFrameworkId,
  parseOptionalIsoTimestampOrNull,
  parseScoresObject,
  normalizeUuid,
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

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'GET': {
        const { frameworkId, start, end, limit } = req.query || {}

        const normalizedFrameworkId =
          frameworkId === undefined || frameworkId === null || frameworkId === ''
            ? null
            : normalizeFrameworkId(frameworkId)
        if (frameworkId && !normalizedFrameworkId) {
          return res.status(400).json({ error: 'Invalid frameworkId' })
        }

        const startIso = typeof start === 'string' ? parseOptionalIsoTimestampOrNull(start) : { value: null }
        if (startIso.error) return res.status(400).json({ error: 'Invalid start' })
        const endIso = typeof end === 'string' ? parseOptionalIsoTimestampOrNull(end) : { value: null }
        if (endIso.error) return res.status(400).json({ error: 'Invalid end' })

        const limitN = clampInt(limit ?? 200, { min: 1, max: 1000, fallback: 200 })

        let query = supabase
          .from('maturity_assessments')
          .select('id, framework_id, assessed_at, created_at, updated_at')
          .eq('workspace_id', workspaceId)
          .order('assessed_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limitN)

        if (normalizedFrameworkId) query = query.eq('framework_id', normalizedFrameworkId)
        if (startIso.value) query = query.gte('assessed_at', startIso.value)
        if (endIso.value) query = query.lte('assessed_at', endIso.value)

        const { data, error } = await query
        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }

        return res.status(200).json({
          items: (data || []).map((row) => ({
            id: row.id,
            frameworkId: row.framework_id,
            assessedAt: row.assessed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
        })
      }

      case 'POST': {
        const body = await readJsonBody(req, { maxBytes: 64 * 1024 })
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const frameworkId = normalizeFrameworkId(body.frameworkId ?? body.framework_id)
        if (!frameworkId) return res.status(400).json({ error: '`frameworkId` is required' })

        const assessedAtParsed = parseOptionalIsoTimestampOrNull(body.assessedAt ?? body.assessed_at)
        if (assessedAtParsed.error) return res.status(400).json({ error: 'Invalid assessedAt' })

        const scoresParsed = parseScoresObject(body.scores)
        if (scoresParsed.error) return res.status(400).json({ error: scoresParsed.error })

        const { data: assessmentId, error: rpcError } = await supabase.rpc('create_maturity_assessment', {
          p_workspace_id: workspaceId,
          p_framework_id: frameworkId,
          p_assessed_at: assessedAtParsed.value ?? undefined,
          p_scores: scoresParsed.value,
        })

        if (rpcError) {
          logApiWarn('supabase_rpc_failed', { requestId, workspaceId, message: rpcError.message })
          const mapped = rpcErrorToResponse(rpcError)
          if (mapped) return sendApiError(req, res, { ...mapped, retryable: false })
          const apiError = supabaseErrorToApiError(rpcError, { action: 'rpc' })
          return sendApiError(req, res, apiError)
        }

        const createdId = normalizeUuid(String(assessmentId))
        if (!createdId) {
          return sendApiError(req, res, {
            status: 502,
            code: 'SUPABASE_ERROR',
            message: 'Supabase rpc failed: missing assessment id',
            retryable: false,
          })
        }

        const detailsResult = await getAssessmentWithScores({ supabase, workspaceId, assessmentId: createdId })
        if (detailsResult.error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: detailsResult.error.message })
          const apiError = supabaseErrorToApiError(detailsResult.error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }
        if (!detailsResult.data) return res.status(404).json({ error: 'Not found' })

        return res.status(201).json(detailsResult.data)
      }

      default:
        res.setHeader('allow', 'GET,POST,OPTIONS')
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

