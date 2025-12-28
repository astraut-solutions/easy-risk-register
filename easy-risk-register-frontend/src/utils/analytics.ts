export type AnalyticsEventName =
  | 'risk_modal_open'
  | 'risk_modal_submit'
  | 'risk_modal_abandon'
  | 'risk_modal_validation_error'
  | 'risk_modal_save_draft'
  | 'risk_template_apply'

export type AnalyticsEvent = {
  name: AnalyticsEventName
  at: string
  props?: Record<string, unknown>
}

const STORAGE_KEY = 'easy-risk-register:analytics-events'
const ENABLE_KEY = 'easy-risk-register:analytics-enabled'

const nowIso = () => new Date().toISOString()

const safeParse = (raw: string | null): AnalyticsEvent[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is AnalyticsEvent => {
      if (!entry || typeof entry !== 'object') return false
      const maybe = entry as AnalyticsEvent
      return typeof maybe.name === 'string' && typeof maybe.at === 'string'
    })
  } catch {
    return []
  }
}

const readEvents = (): AnalyticsEvent[] => {
  if (typeof window === 'undefined') return []
  try {
    return safeParse(window.localStorage?.getItem(STORAGE_KEY) ?? null)
  } catch {
    return []
  }
}

const writeEvents = (events: AnalyticsEvent[]) => {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(events.slice(-500)))
  } catch {
    // ignore
  }
}

export const isAnalyticsEnabled = () => {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage?.getItem(ENABLE_KEY) === '1'
  } catch {
    return false
  }
}

export const setAnalyticsEnabled = (enabled: boolean) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(ENABLE_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}

export const trackEvent = (name: AnalyticsEventName, props?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  if (!isAnalyticsEnabled()) return

  const events = readEvents()
  events.push({ name, at: nowIso(), ...(props ? { props } : {}) })
  writeEvents(events)

  try {
    // Keep this quiet by default; enabled only via localStorage flag.
    console.debug('[analytics]', name, props ?? {})
  } catch {
    // ignore
  }
}

export const getAnalyticsEvents = (): AnalyticsEvent[] => readEvents()

export const clearAnalyticsEvents = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

const median = (values: number[]) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid]!
  return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
}

export const getAnalyticsSummary = () => {
  const events = readEvents()
  const submits = events
    .filter((event) => event.name === 'risk_modal_submit')
    .map((event) => Number(event.props?.durationMs))
    .filter((value) => Number.isFinite(value) && value >= 0)

  const abandons = events
    .filter((event) => event.name === 'risk_modal_abandon')
    .map((event) => Number(event.props?.durationMs))
    .filter((value) => Number.isFinite(value) && value >= 0)

  const validationErrors = events
    .filter((event) => event.name === 'risk_modal_validation_error')
    .map((event) => Number(event.props?.errorCount))
    .filter((value) => Number.isFinite(value) && value >= 0)

  return {
    totalEvents: events.length,
    submits: submits.length,
    abandons: abandons.length,
    medianTimeToCreateMs: median(submits),
    medianTimeToAbandonMs: median(abandons),
    medianValidationErrorsPerAttempt: median(validationErrors),
  }
}

