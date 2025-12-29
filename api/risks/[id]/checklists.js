const { ensureRequestId, handleOptions, setCors } = require('../../_lib/http')
const { requireApiContext } = require('../../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../../_lib/apiErrors')

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
  if (trimmed.length > 200) return trimmed.slice(0, 200)
  return trimmed
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body

  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (chunks.length === 0) return null

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  return JSON.parse(raw)
}

function rpcErrorToResponse(error) {
  const message = typeof error?.message === 'string' ? error.message : ''

  if (message.includes('Forbidden')) return { status: 403, code: 'FORBIDDEN', message: 'Forbidden' }
  if (message.includes('Risk not found')) return { status: 404, code: 'NOT_FOUND', message: 'Not found' }
  if (message.includes('Unknown template')) return { status: 400, code: 'BAD_REQUEST', message: 'Unknown template' }
  if (message.toLowerCase().includes('duplicate key value')) {
    return { status: 409, code: 'CONFLICT', message: 'Checklist already attached' }
  }

  return null
}

function mapChecklistRow(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.template_title,
    description: row.template_description,
    status: row.status,
    attachedAt: row.attached_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    items: Array.isArray(row.items)
      ? row.items.map((item) => ({
          id: item.id,
          position: Number(item.position),
          description: item.description,
          createdAt: item.created_at,
          completedAt: item.completed_at,
          completedBy: item.completed_by,
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
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    const idParam = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
    const riskId = normalizeUuid(idParam)
    if (!riskId) return res.status(400).json({ error: 'Invalid risk id' })

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('risk_checklists')
          .select(
            'id, template_id, template_title, template_description, attached_at, started_at, completed_at, status, items:risk_checklist_items(id, position, description, created_at, completed_at, completed_by)',
          )
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .order('attached_at', { ascending: true })
          .order('position', { ascending: true, foreignTable: 'risk_checklist_items' })

        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }

        return res.status(200).json({ items: (data || []).map(mapChecklistRow) })
      }

      case 'POST': {
        const body = await readJsonBody(req)
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const templateId = normalizeTemplateId(body.templateId ?? body.template_id)
        if (!templateId) return res.status(400).json({ error: '`templateId` is required' })

        const { data: checklistId, error: attachError } = await supabase.rpc('attach_risk_checklist_template', {
          p_workspace_id: workspaceId,
          p_risk_id: riskId,
          p_template_id: templateId,
        })

        if (attachError) {
          logApiWarn('supabase_rpc_failed', { requestId, workspaceId, riskId, message: attachError.message })
          const mapped = rpcErrorToResponse(attachError)
          if (mapped) return sendApiError(req, res, { ...mapped, retryable: false })
          const apiError = supabaseErrorToApiError(attachError, { action: 'rpc' })
          return sendApiError(req, res, apiError)
        }

        const createdId = normalizeUuid(String(checklistId))
        if (!createdId) {
          return sendApiError(req, res, {
            status: 502,
            code: 'SUPABASE_ERROR',
            message: 'Supabase rpc failed: missing checklist id',
            retryable: false,
          })
        }

        const { data: checklist, error } = await supabase
          .from('risk_checklists')
          .select(
            'id, template_id, template_title, template_description, attached_at, started_at, completed_at, status, items:risk_checklist_items(id, position, description, created_at, completed_at, completed_by)',
          )
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .eq('id', createdId)
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }
        if (!checklist) return res.status(404).json({ error: 'Not found' })

        return res.status(201).json(mapChecklistRow(checklist))
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

