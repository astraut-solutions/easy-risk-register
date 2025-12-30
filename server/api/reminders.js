const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { logApiError, logApiRequest, logApiResponse, logApiWarn } = require('./_lib/logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('./_lib/apiErrors')
const { getWorkspaceRiskThresholds, severityFromScore } = require('./_lib/riskScoring')
const { computeRiskDueAt, diffDaysCeil, getWorkspaceReminderSettings, parseTimestampToDate } = require('./_lib/reminders')

async function ensureUserSettingsRow({ supabase, workspaceId, requestId }) {
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
        const ensured = await ensureUserSettingsRow({ supabase, workspaceId, requestId })
        if (ensured.error) return sendApiError(req, res, ensured.error)

        const workspaceSettingsResult = await getWorkspaceReminderSettings({ supabase, workspaceId })
        if (workspaceSettingsResult.error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: workspaceSettingsResult.error.message })
          return sendApiError(req, res, workspaceSettingsResult.error)
        }

        const workspaceSettings = workspaceSettingsResult.settings

        const { data: userSettings, error: userSettingsError } = await supabase
          .from('workspace_user_settings')
          .select('reminders_enabled, reminders_snoozed_until')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (userSettingsError) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: userSettingsError.message })
          return sendApiError(req, res, supabaseErrorToApiError(userSettingsError, { action: 'query' }))
        }

        const remindersEnabled = workspaceSettings.remindersEnabled && Boolean(userSettings?.reminders_enabled)
        const snoozedUntil = userSettings?.reminders_snoozed_until ?? null

        const now = new Date()
        const snoozedUntilDate = parseTimestampToDate(snoozedUntil)
        const snoozedActive = snoozedUntilDate ? snoozedUntilDate.getTime() > now.getTime() : false

        if (!remindersEnabled || snoozedActive) {
          return res.status(200).json({
            remindersEnabled,
            snoozedUntil,
            workspace: workspaceSettings,
            items: [],
            counts: { due: 0, dueSoon: 0 },
          })
        }

        const thresholdsResult = await getWorkspaceRiskThresholds({ supabase, workspaceId })
        if (thresholdsResult.error) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: thresholdsResult.error.message })
          return sendApiError(req, res, thresholdsResult.error)
        }

        const { data: risks, error: risksError } = await supabase
          .from('risks')
          .select(
            'id, title, status, risk_score, next_review_at, last_reviewed_at, review_interval_days, created_at, updated_at',
          )
          .eq('workspace_id', workspaceId)
          .neq('status', 'closed')
          .range(0, 4999)

        if (risksError) {
          logApiWarn('supabase_query_failed', { requestId, workspaceId, message: risksError.message })
          return sendApiError(req, res, supabaseErrorToApiError(risksError, { action: 'query' }))
        }

        const dueSoonCutoff = new Date(now.getTime() + workspaceSettings.dueSoonDays * 24 * 60 * 60 * 1000)
        const thresholds = thresholdsResult.thresholds

        const dueItems = []
        const dueSoonItems = []

        for (const risk of risks || []) {
          const { dueAt } = computeRiskDueAt(risk, { workspaceReviewIntervalDays: workspaceSettings.reviewIntervalDays })
          if (!dueAt) continue

          if (dueAt.getTime() <= now.getTime()) {
            const daysOverdue = diffDaysCeil(now, dueAt)
            dueItems.push({
              kind: 'due',
              riskId: risk.id,
              title: risk.title,
              status: risk.status,
              riskScore: Number(risk.risk_score),
              severity: severityFromScore(Number(risk.risk_score), thresholds),
              dueAt: dueAt.toISOString(),
              daysOverdue: Math.max(0, daysOverdue),
            })
          } else if (dueAt.getTime() <= dueSoonCutoff.getTime()) {
            const daysUntilDue = diffDaysCeil(dueAt, now)
            dueSoonItems.push({
              kind: 'due_soon',
              riskId: risk.id,
              title: risk.title,
              status: risk.status,
              riskScore: Number(risk.risk_score),
              severity: severityFromScore(Number(risk.risk_score), thresholds),
              dueAt: dueAt.toISOString(),
              daysUntilDue: Math.max(0, daysUntilDue),
            })
          }
        }

        dueItems.sort((a, b) => {
          const due = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
          if (due !== 0) return due
          return Number(b.riskScore) - Number(a.riskScore)
        })

        dueSoonItems.sort((a, b) => {
          const due = new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
          if (due !== 0) return due
          return Number(b.riskScore) - Number(a.riskScore)
        })

        const combined = [...dueItems, ...dueSoonItems].slice(0, workspaceSettings.maxDueItems)

        return res.status(200).json({
          remindersEnabled,
          snoozedUntil,
          workspace: workspaceSettings,
          items: combined,
          counts: { due: dueItems.length, dueSoon: dueSoonItems.length },
          truncated: (risks || []).length >= 5000,
        })
      }

      default:
        res.setHeader('allow', 'GET,OPTIONS')
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

