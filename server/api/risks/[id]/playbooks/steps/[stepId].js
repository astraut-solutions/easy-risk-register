const { ensureRequestId, handleOptions, setCors } = require('../../../../_lib/http')
const { requireApiContext } = require('../../../../_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('../../../../_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('../../../../_lib/apiErrors')
const { readJsonBody } = require('../../../../_lib/body')

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

function normalizeText(value, { maxLen, allowEmpty = false } = {}) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed && !allowEmpty) return null
  if (typeof maxLen === 'number' && trimmed.length > maxLen) return trimmed.slice(0, maxLen)
  return trimmed
}

function normalizeSection(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  const allowed = new Set(['roles', 'immediate_actions', 'communications', 'recovery', 'other'])
  return allowed.has(trimmed) ? trimmed : null
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

    const stepIdParam = Array.isArray(req.query?.stepId) ? req.query.stepId[0] : req.query?.stepId
    const stepId = normalizeUuid(stepIdParam)
    if (!stepId) return res.status(400).json({ error: 'Invalid step id' })

    const { supabase, workspaceId, user } = ctx

    switch (req.method) {
      case 'PATCH': {
        const body = await readJsonBody(req, { maxBytes: 64 * 1024 })
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const updates = {}

        if (body.description !== undefined) {
          const description = normalizeText(body.description, { maxLen: 2000 })
          if (!description) return res.status(400).json({ error: 'Invalid description' })
          updates.description = description
        }

        if (body.section !== undefined) {
          const section = normalizeSection(body.section)
          if (!section) return res.status(400).json({ error: 'Invalid section' })
          updates.section = section
        }

        if (body.position !== undefined) {
          const position = clampInt(body.position, { min: 1, max: 5000, fallback: NaN })
          if (!Number.isFinite(position)) return res.status(400).json({ error: 'Invalid position' })
          updates.position = position
        }

        if (body.completed !== undefined) {
          if (typeof body.completed !== 'boolean') return res.status(400).json({ error: 'Invalid completed (expected boolean)' })
          if (body.completed) {
            updates.completed_at = new Date().toISOString()
            updates.completed_by = user?.id ?? null
          } else {
            updates.completed_at = null
            updates.completed_by = null
          }
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'No updates provided' })
        }

        const { data, error } = await supabase
          .from('risk_playbook_steps')
          .update(updates)
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .eq('id', stepId)
          .select('id, playbook_id, position, section, description, created_at, completed_at, completed_by')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_update_failed', { requestId, workspaceId, riskId, stepId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'update' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(200).json({
          id: data.id,
          playbookId: data.playbook_id,
          position: Number(data.position),
          section: data.section,
          description: data.description,
          createdAt: data.created_at,
          completedAt: data.completed_at,
          completedBy: data.completed_by,
        })
      }

      case 'DELETE': {
        const { data, error } = await supabase
          .from('risk_playbook_steps')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('risk_id', riskId)
          .eq('id', stepId)
          .select('id')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_delete_failed', { requestId, workspaceId, riskId, stepId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'delete' })
          return sendApiError(req, res, apiError)
        }
        if (!data) return res.status(404).json({ error: 'Not found' })

        return res.status(204).end()
      }

      default:
        res.setHeader('allow', 'PATCH,DELETE,OPTIONS')
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

