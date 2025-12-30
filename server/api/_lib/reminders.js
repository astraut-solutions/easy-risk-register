const { supabaseErrorToApiError } = require('./apiErrors')

function clampInt(value, { min, max, fallback }) {
  const num = Number.parseInt(String(value), 10)
  if (!Number.isFinite(num)) return fallback
  if (num < min) return min
  if (num > max) return max
  return num
}

async function getWorkspaceReminderSettings({ supabase, workspaceId }) {
  const { data, error } = await supabase
    .from('workspace_reminder_settings')
    .select('reminders_enabled, review_interval_days, due_soon_days, max_due_items')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error) {
    return { error: supabaseErrorToApiError(error, { action: 'query' }) }
  }

  const remindersEnabled = Boolean(data?.reminders_enabled)
  const reviewIntervalDays = clampInt(data?.review_interval_days ?? 30, { min: 1, max: 365, fallback: 30 })
  const dueSoonDays = clampInt(data?.due_soon_days ?? 7, { min: 0, max: 30, fallback: 7 })
  const maxDueItems = clampInt(data?.max_due_items ?? 20, { min: 1, max: 200, fallback: 20 })

  return { settings: { remindersEnabled, reviewIntervalDays, dueSoonDays, maxDueItems } }
}

function parseTimestampToDate(value) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date
}

function addDays(date, days) {
  const ms = Number(days) * 24 * 60 * 60 * 1000
  return new Date(date.getTime() + ms)
}

function diffDaysCeil(a, b) {
  const ms = a.getTime() - b.getTime()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

function computeRiskDueAt(risk, { workspaceReviewIntervalDays }) {
  const explicitNextReviewAt = parseTimestampToDate(risk.next_review_at)
  if (explicitNextReviewAt) return { dueAt: explicitNextReviewAt, source: 'next_review_at' }

  const intervalDays = clampInt(risk.review_interval_days ?? workspaceReviewIntervalDays, {
    min: 1,
    max: 365,
    fallback: workspaceReviewIntervalDays,
  })

  const base =
    parseTimestampToDate(risk.last_reviewed_at) ||
    parseTimestampToDate(risk.updated_at) ||
    parseTimestampToDate(risk.created_at)

  if (!base) return { dueAt: null, source: null }
  return { dueAt: addDays(base, intervalDays), source: risk.review_interval_days ? 'review_interval_days' : 'workspace_default' }
}

module.exports = {
  getWorkspaceReminderSettings,
  computeRiskDueAt,
  diffDaysCeil,
  parseTimestampToDate,
}

