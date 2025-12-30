const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('./_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('./_lib/apiErrors')
const { readJsonBody } = require('./_lib/body')

function parseOptionalBoolean(value) {
  if (value === undefined) return { value: undefined }
  if (typeof value === 'boolean') return { value }
  return { error: 'Expected boolean' }
}

function parseOptionalIsoTimestampOrNull(value) {
  if (value === undefined) return { value: undefined }
  if (value === null) return { value: null }
  if (typeof value !== 'string') return { error: 'Expected ISO timestamp string or null' }

  const trimmed = value.trim()
  if (!trimmed) return { error: 'Expected ISO timestamp string or null' }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return { error: 'Invalid timestamp' }
  return { value: date.toISOString() }
}

function mapSettingsRow(row) {
  return {
    tooltipsEnabled: Boolean(row.tooltips_enabled),
    onboardingDismissed: Boolean(row.onboarding_dismissed),
    remindersEnabled: Boolean(row.reminders_enabled),
    remindersSnoozedUntil: row.reminders_snoozed_until ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

async function ensureSettingsRow({ supabase, workspaceId, requestId }) {
  const { error } = await supabase.rpc('ensure_workspace_user_settings', { p_workspace_id: workspaceId })
  if (error) {
    logApiWarn('supabase_rpc_failed', { requestId, workspaceId, message: error.message })
    return { error: supabaseErrorToApiError(error, { action: 'rpc' }) }
  }
  return { error: null }
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

    const { supabase, workspaceId, user } = ctx

    switch (req.method) {
      case 'GET': {
        const ensured = await ensureSettingsRow({ supabase, workspaceId, requestId })
        if (ensured.error) return sendApiError(req, res, ensured.error)

        const { data, error } = await supabase
          .from('workspace_user_settings')
          .select('tooltips_enabled, onboarding_dismissed, reminders_enabled, reminders_snoozed_until, updated_at')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: error.message })
          return sendApiError(req, res, supabaseErrorToApiError(error, { action: 'query' }))
        }

        if (!data) {
          return sendApiError(req, res, { status: 404, code: 'NOT_FOUND', message: 'Settings not found' })
        }

        return res.status(200).json(mapSettingsRow(data))
      }

      case 'PATCH': {
        const body = await readJsonBody(req, { maxBytes: 64 * 1024 })
        if (!body || typeof body !== 'object') {
          return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: 'Expected JSON body' })
        }

        const tooltipsEnabled = parseOptionalBoolean(body.tooltipsEnabled)
        if (tooltipsEnabled.error) {
          return sendApiError(req, res, {
            status: 400,
            code: 'BAD_REQUEST',
            message: 'Invalid tooltipsEnabled',
            details: { field: 'tooltipsEnabled' },
          })
        }

        const onboardingDismissed = parseOptionalBoolean(body.onboardingDismissed)
        if (onboardingDismissed.error) {
          return sendApiError(req, res, {
            status: 400,
            code: 'BAD_REQUEST',
            message: 'Invalid onboardingDismissed',
            details: { field: 'onboardingDismissed' },
          })
        }

        const remindersEnabled = parseOptionalBoolean(body.remindersEnabled)
        if (remindersEnabled.error) {
          return sendApiError(req, res, {
            status: 400,
            code: 'BAD_REQUEST',
            message: 'Invalid remindersEnabled',
            details: { field: 'remindersEnabled' },
          })
        }

        const remindersSnoozedUntil = parseOptionalIsoTimestampOrNull(body.remindersSnoozedUntil)
        if (remindersSnoozedUntil.error) {
          return sendApiError(req, res, {
            status: 400,
            code: 'BAD_REQUEST',
            message: 'Invalid remindersSnoozedUntil',
            details: { field: 'remindersSnoozedUntil' },
          })
        }

        const updates = {}
        if (tooltipsEnabled.value !== undefined) updates.tooltips_enabled = tooltipsEnabled.value
        if (onboardingDismissed.value !== undefined) updates.onboarding_dismissed = onboardingDismissed.value
        if (remindersEnabled.value !== undefined) updates.reminders_enabled = remindersEnabled.value
        if (remindersSnoozedUntil.value !== undefined) updates.reminders_snoozed_until = remindersSnoozedUntil.value

        if (Object.keys(updates).length === 0) {
          return sendApiError(req, res, { status: 400, code: 'BAD_REQUEST', message: 'No updates provided' })
        }

        const ensured = await ensureSettingsRow({ supabase, workspaceId, requestId })
        if (ensured.error) return sendApiError(req, res, ensured.error)

        const { data, error } = await supabase
          .from('workspace_user_settings')
          .update(updates)
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .select('tooltips_enabled, onboarding_dismissed, reminders_enabled, reminders_snoozed_until, updated_at')
          .maybeSingle()

        if (error) {
          logApiWarn('supabase_update_failed', { requestId, workspaceId, message: error.message })
          return sendApiError(req, res, supabaseErrorToApiError(error, { action: 'update' }))
        }

        if (!data) {
          return sendApiError(req, res, { status: 404, code: 'NOT_FOUND', message: 'Settings not found' })
        }

        return res.status(200).json(mapSettingsRow(data))
      }

      default:
        res.setHeader('allow', 'GET,PATCH,OPTIONS')
        return sendApiError(req, res, { status: 405, code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' })
    }
  } catch (error) {
    logApiError({ requestId, method: req.method, path: req.url, error })
    return sendApiError(req, res, unexpectedErrorToApiError(error))
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
