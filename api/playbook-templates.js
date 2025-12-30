const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('./_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('./_lib/apiErrors')

function mapTemplateRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    steps: Array.isArray(row.steps)
      ? row.steps.map((step) => ({
          id: step.id,
          position: Number(step.position),
          section: step.section,
          description: step.description,
        }))
      : [],
  }
}

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res, { requireWorkspace: false })
    if (!ctx) return

    if (req.method !== 'GET') {
      res.setHeader('allow', 'GET,OPTIONS')
      return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
    }

    const { supabase } = ctx

    const { data, error } = await supabase
      .from('playbook_templates')
      .select('id, title, description, steps:playbook_template_steps(id, position, section, description)')
      .order('title', { ascending: true })
      .order('position', { ascending: true, foreignTable: 'playbook_template_steps' })

    if (error) {
      logApiWarn('supabase_query_failed', { requestId, message: error.message })
      const apiError = supabaseErrorToApiError(error, { action: 'query' })
      return sendApiError(req, res, apiError)
    }

    return res.status(200).json({ items: (data || []).map(mapTemplateRow) })
  } catch (error) {
    logApiError({ requestId, method: req.method, path: req.url, error })
    const apiError = unexpectedErrorToApiError(error)
    return sendApiError(req, res, apiError)
  } finally {
    logApiResponse({ requestId, method: req.method, path: req.url, status: res.statusCode, durationMs: Date.now() - start })
  }
}

