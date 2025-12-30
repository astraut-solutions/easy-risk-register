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

    const idParam = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
    const riskId = normalizeUuid(idParam)
    if (!riskId) return res.status(400).json({ error: 'Invalid risk id' })

    const { supabase, workspaceId } = ctx

    switch (req.method) {
      case 'POST': {
        const body = await readJsonBody(req, { maxBytes: 64 * 1024 })
        if (!body || typeof body !== 'object') {
          return res.status(400).json({ error: 'Expected JSON body' })
        }

        const playbookId = normalizeUuid(body.playbookId ?? body.playbook_id)
        if (!playbookId) return res.status(400).json({ error: '`playbookId` is required' })

        const description = normalizeText(body.description, { maxLen: 2000 })
        if (!description) return res.status(400).json({ error: '`description` is required' })

        const section = body.section === undefined ? 'other' : normalizeSection(body.section)
        if (!section) return res.status(400).json({ error: 'Invalid section' })

        let position = body.position !== undefined ? clampInt(body.position, { min: 1, max: 5000, fallback: NaN }) : null
        if (body.position !== undefined && !Number.isFinite(position)) {
          return res.status(400).json({ error: 'Invalid position' })
        }

        if (position === null) {
          const { data: last, error: lastError } = await supabase
            .from('risk_playbook_steps')
            .select('position')
            .eq('workspace_id', workspaceId)
            .eq('risk_id', riskId)
            .eq('playbook_id', playbookId)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (lastError) {
            logApiWarn('supabase_query_failed', { requestId, workspaceId, riskId, playbookId, message: lastError.message })
            const apiError = supabaseErrorToApiError(lastError, { action: 'query' })
            return sendApiError(req, res, apiError)
          }

          position = Number(last?.position ?? 0) + 1
        }

        const { data, error } = await supabase
          .from('risk_playbook_steps')
          .insert({
            workspace_id: workspaceId,
            risk_id: riskId,
            playbook_id: playbookId,
            position,
            section,
            description,
          })
          .select('id, playbook_id, position, section, description, created_at, completed_at, completed_by')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_insert_failed', { requestId, workspaceId, riskId, playbookId, message: error.message })
          const apiError = supabaseErrorToApiError(error, { action: 'insert' })
          return sendApiError(req, res, apiError)
        }
        if (!data) {
          return sendApiError(req, res, {
            status: 502,
            code: 'SUPABASE_ERROR',
            message: 'Supabase insert failed: missing row',
            retryable: false,
          })
        }

        return res.status(201).json({
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

      default:
        res.setHeader('allow', 'POST,OPTIONS')
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

