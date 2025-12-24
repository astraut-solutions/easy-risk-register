import type { Risk } from '../types/risk'

export type ReminderFrequency = 'daily' | 'weekly' | 'monthly'

export const getFrequencyMs = (frequency: ReminderFrequency) => {
  switch (frequency) {
    case 'daily':
      return 1000 * 60 * 60 * 24
    case 'monthly':
      return 1000 * 60 * 60 * 24 * 30
    case 'weekly':
    default:
      return 1000 * 60 * 60 * 24 * 7
  }
}

const parseIsoToMs = (value?: string) => {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  return parsed
}

export type ReminderSummary = {
  overdue: number
  dueSoon: number
  earliestDueMs: number | null
}

export const computeReminderSummary = (risks: Risk[], nowMs: number): ReminderSummary => {
  const startOfToday = new Date(nowMs)
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()
  const soonMs = todayMs + 1000 * 60 * 60 * 24 * 7

  let overdue = 0
  let dueSoon = 0
  let earliestDueMs: number | null = null

  const isActionable = (risk: Risk) => risk.status === 'open' || risk.status === 'accepted'

  for (const risk of risks) {
    if (!isActionable(risk)) continue

    const dueMs = Math.min(
      ...[parseIsoToMs(risk.dueDate), parseIsoToMs(risk.reviewDate)]
        .filter((value): value is number => value !== null),
    )
    if (!Number.isFinite(dueMs)) continue

    if (earliestDueMs === null || dueMs < earliestDueMs) earliestDueMs = dueMs
    if (dueMs < todayMs) overdue += 1
    else if (dueMs <= soonMs) dueSoon += 1
  }

  return { overdue, dueSoon, earliestDueMs }
}
