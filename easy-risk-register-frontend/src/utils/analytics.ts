export type AnalyticsEventName =
  | 'session_start'
  | 'analytics_enabled'
  | 'view_change'
  | 'auth_modal_open'
  | 'auth_sign_in_success'
  | 'auth_sign_up_success'
  | 'auth_sign_out'
  | 'risk_created'
  | 'risk_updated'
  | 'risk_deleted'
  | 'risk_modal_open'
  | 'risk_modal_submit'
  | 'risk_modal_abandon'
  | 'risk_modal_validation_error'
  | 'risk_modal_save_draft'
  | 'risk_template_apply'
  | 'export_csv'
  | 'import_csv_open'
  | 'import_csv_parsed'
  | 'import_csv_submit'
  | 'import_csv_result'
  | 'export_pdf_download'
  | 'export_print_view_open'
  | 'export_png'

export type AnalyticsEvent = {
  name: AnalyticsEventName
  at: string
  sessionId?: string
  props?: Record<string, unknown>
}

const STORAGE_KEY = 'easy-risk-register:analytics-events'
const ENABLE_KEY = 'easy-risk-register:analytics-enabled'
const SESSION_ID_KEY = 'easy-risk-register:analytics-session-id'
const SESSION_STARTED_AT_KEY = 'easy-risk-register:analytics-session-started-at'

const nowIso = () => new Date().toISOString()

const generateSessionId = () => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as Crypto).randomUUID()
    }
  } catch {
    // ignore
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const getSessionStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    return window.sessionStorage
  } catch {
    return null
  }
}

const ensureAnalyticsSession = (): {
  sessionId: string
  sessionStartedAt: string
  isNewSession: boolean
} => {
  const store = getSessionStorage()

  const read = (key: string) => {
    try {
      return store?.getItem(key) ?? null
    } catch {
      return null
    }
  }

  const write = (key: string, value: string) => {
    try {
      store?.setItem(key, value)
    } catch {
      // ignore
    }
  }

  const existingSessionId = read(SESSION_ID_KEY)
  const existingStartedAt = read(SESSION_STARTED_AT_KEY)
  if (existingSessionId && existingStartedAt) {
    return { sessionId: existingSessionId, sessionStartedAt: existingStartedAt, isNewSession: false }
  }

  const sessionId = existingSessionId || generateSessionId()
  const sessionStartedAt = existingStartedAt || nowIso()

  write(SESSION_ID_KEY, sessionId)
  write(SESSION_STARTED_AT_KEY, sessionStartedAt)

  return { sessionId, sessionStartedAt, isNewSession: true }
}

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

  const { sessionId, sessionStartedAt, isNewSession } = ensureAnalyticsSession()
  const safeProps = props ? sanitizeAnalyticsProps(props) : undefined

  const events = readEvents()
  if (isNewSession) {
    events.push({ name: 'session_start', at: sessionStartedAt, sessionId })
  }

  events.push({
    name,
    at: nowIso(),
    sessionId,
    ...(safeProps ? { props: safeProps } : {}),
  })
  writeEvents(events)

  try {
    // Keep this quiet by default; enabled only via localStorage flag.
    console.debug('[analytics]', name, safeProps ?? {})
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

const SENSITIVE_KEY_RE =
  /(passphrase|password|secret|token|authorization|email|encryptedfields|description|mitigationplan|body|title)/i

const sanitizeAnalyticsValue = (value: unknown, depth: number): unknown => {
  if (depth <= 0) return '[redacted]'

  if (typeof value === 'string') {
    if (value.length > 200) return '[redacted]'
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value

  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeAnalyticsValue(item, depth - 1))

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_RE.test(key)) {
        out[key] = '[redacted]'
        continue
      }
      out[key] = sanitizeAnalyticsValue(child, depth - 1)
    }
    return out
  }

  return String(value)
}

export const sanitizeAnalyticsProps = (props: Record<string, unknown>): Record<string, unknown> => {
  return sanitizeAnalyticsValue(props, 4) as Record<string, unknown>
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
  const sessionCount = events.filter((event) => event.name === 'session_start').length
  const createdRisks = events.filter((event) => event.name === 'risk_created')
  const updatedRisks = events.filter((event) => event.name === 'risk_updated')
  const deletedRisks = events.filter((event) => event.name === 'risk_deleted')
  const exportCsv = events.filter((event) => event.name === 'export_csv')
  const exportPdf = events.filter((event) => event.name === 'export_pdf_download')
  const exportPng = events.filter((event) => event.name === 'export_png')
  const templateApplies = events.filter((event) => event.name === 'risk_template_apply')

  const sessionsWithCreatedRisk = new Set(
    createdRisks.map((event) => String(event.sessionId ?? '')).filter(Boolean),
  )

  const sessionStartById = new Map<string, string>()
  const firstRiskById = new Map<string, string>()
  for (const event of events) {
    const sessionId = typeof event.sessionId === 'string' ? event.sessionId : ''
    if (!sessionId) continue

    if (event.name === 'session_start') {
      const existing = sessionStartById.get(sessionId)
      if (!existing || event.at < existing) sessionStartById.set(sessionId, event.at)
    }

    if (event.name === 'risk_created') {
      const existing = firstRiskById.get(sessionId)
      if (!existing || event.at < existing) firstRiskById.set(sessionId, event.at)
    }
  }

  const timeToFirstRiskMs = Array.from(firstRiskById.entries())
    .map(([sessionId, createdAt]) => {
      const startedAt = sessionStartById.get(sessionId)
      if (!startedAt) return null
      const startMs = Date.parse(startedAt)
      const createdMs = Date.parse(createdAt)
      if (!Number.isFinite(startMs) || !Number.isFinite(createdMs)) return null
      const delta = createdMs - startMs
      return delta >= 0 ? delta : null
    })
    .filter((value): value is number => typeof value === 'number')

  const createdFromTemplate = createdRisks.filter((event) => Boolean(event.props?.fromTemplate)).length

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
    sessions: sessionCount,
    sessionsWithCreatedRisk: sessionsWithCreatedRisk.size,
    firstSessionCompletionRate:
      sessionCount > 0 ? Math.round((sessionsWithCreatedRisk.size / sessionCount) * 1000) / 10 : null,
    createdRisks: createdRisks.length,
    updatedRisks: updatedRisks.length,
    deletedRisks: deletedRisks.length,
    templateApplies: templateApplies.length,
    templateAdoptionRate:
      createdRisks.length > 0 ? Math.round((createdFromTemplate / createdRisks.length) * 1000) / 10 : null,
    exportsCsv: exportCsv.length,
    exportsPdf: exportPdf.length,
    exportsPng: exportPng.length,
    submits: submits.length,
    abandons: abandons.length,
    medianTimeToCreateMs: median(submits),
    medianTimeToAbandonMs: median(abandons),
    medianTimeToFirstRiskMs: median(timeToFirstRiskMs),
    medianValidationErrorsPerAttempt: median(validationErrors),
  }
}

