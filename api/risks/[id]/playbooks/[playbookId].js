const { ensureRequestId, handleOptions, setCors } = require('../../../_lib/http')
const { requireApiContext } = require('../../../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../../../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../../../_lib/apiErrors')
const { readJsonBody } = require('../../../_lib/body')

const UUID_V4ish_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeUuid(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!UUID_V4ish_REGEX.test(trimmed)) return null
  return trimmed.toLowerCase()
}

function normalizeText(value, { maxLen, allowEmpty = false } = {}) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed && !allowEmpty) return null
  if (typeof maxLen === 'number' && trimmed.length > maxLen) return trimmed.slice(0, maxLen)
  return trimmed
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mapPlaybookRow(row) {
  return {
    id: row.id,
    templateId: row.template_id,
    templateTitle: row.template_title,
    templateDescription: row.template_description ?? '',
    attachedAt: row.attached_at,
    title: row.title,
    description: row.description ?? '',
    data: row.data ?? {},
    encryptedFields: row.encrypted_fields ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps: Array.isArray(row.steps)
      ? row.steps.map((step) => ({
          id: step.id,
          position: Number(step.position),
          section: step.section,
          description: step.description,
          createdAt: step.created_at,
          completedAt: step.completed_at,
          completedBy: step.completed_by,
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

    const playbookIdParam = Array.isArray(req.query?.playbookId) ? req.query.playbookId[0] : req.query?.playbookId
    const playbookId = normalizeUuid(playbookIdParam)
    if (!playbookId) return res.status(400).json({ error: 'Invalid playbook id' })

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('risk_playbooks')
          .select(
            'id, template_id, template_title, template_description, attached_at, title, description, data, encrypted_fields, created_at, updated_at, steps:risk_playbook_steps(id, position, section, description, created_at, completed_at, completed_by)',
          )
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .eq('id', playbookId)
          .order('position', { ascending: true, foreignTable: 'risk_playbook_steps' })
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, playbookId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'query' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json(mapPlaybookRow(data))
      }

      case 'PATCH': {
        const body = await readJsonBody(req, { maxBytes: 128 * 1024 })
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const updates = {}

        if (body.title !== undefined) {
          const title = normalizeText(body.title, { maxLen: 200 })
          if (!title) return res.status(400).json({ error: 'Invalid title' })
          updates.title = title
        }

        if (body.description !== undefined) {
          const description = normalizeText(body.description, { maxLen: 5000, allowEmpty: true })
          if (description === null) return res.status(400).json({ error: 'Invalid description' })
          updates.description = description
        }

        if (body.data !== undefined) {
          if (!isPlainObject(body.data)) return res.status(400).json({ error: 'Invalid data (expected object)' })
          updates.data = body.data
        }

        if (body.encryptedFields !== undefined || body.encrypted_fields !== undefined) {
          const encryptedFields = body.encryptedFields ?? body.encrypted_fields
          if (!isPlainObject(encryptedFields)) return res.status(400).json({ error: 'Invalid encryptedFields (expected object)' })
          updates.encrypted_fields = encryptedFields
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'No updates provided' })
        }

        const { data, error } = await supabase
          .from('risk_playbooks')
          .update(updates)
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .eq('id', playbookId)
          .select(
            'id, template_id, template_title, template_description, attached_at, title, description, data, encrypted_fields, created_at, updated_at, steps:risk_playbook_steps(id, position, section, description, created_at, completed_at, completed_by)',
          )
          .order('position', { ascending: true, foreignTable: 'risk_playbook_steps' })
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_update_failed', { requestId, workspaceId, riskId, playbookId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'update' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json(mapPlaybookRow(data))
      }

      case 'DELETE': {
        const { data, error } = await supabase
          .from('risk_playbooks')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .eq('id', playbookId)
          .select('id')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_delete_failed', { requestId, workspaceId, riskId, playbookId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'delete' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(204).end()
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

