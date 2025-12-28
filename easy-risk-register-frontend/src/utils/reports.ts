import type { Risk, RiskFilters } from '../types/risk'
import { getRiskSeverity } from './riskCalculations'

const REPORT_CHANNEL_NAME = 'easy-risk-register:report'
const REPORT_STORAGE_PREFIX = 'easy-risk-register:report:'

type ReportPayloadMessage =
  | { type: 'report_payload'; id: string; title: string; html: string }
  | { type: 'report_ready'; id: string }

const inMemoryReports = new Map<string, { title: string; html: string; expiresAtMs: number }>()
let reportBridgeInstalled = false

const installReportBridge = () => {
  if (typeof window === 'undefined' || reportBridgeInstalled) return
  reportBridgeInstalled = true

  window.addEventListener('message', (event: MessageEvent) => {
    try {
      if (event.origin !== window.location.origin) return
      const data = event.data as ReportPayloadMessage | undefined
      if (!data || data.type !== 'report_ready') return
      const id = data.id
      if (!id) return

      const now = Date.now()
      for (const [key, value] of inMemoryReports.entries()) {
        if (value.expiresAtMs <= now) inMemoryReports.delete(key)
      }

      const fromMemory = inMemoryReports.get(id)
      const html =
        fromMemory?.html ??
        (() => {
          try {
            return window.localStorage.getItem(`${REPORT_STORAGE_PREFIX}${id}`) ?? ''
          } catch {
            return ''
          }
        })()

      if (!html) return

      ;(event.source as WindowProxy | null)?.postMessage(
        { type: 'report_payload', id, title: fromMemory?.title ?? '', html },
        window.location.origin,
      )
    } catch {
      // ignore
    }
  })
}

const escapeHtml = (input: string) =>
  input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const formatIsoDateTime = (iso: string) => {
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return iso
  return new Date(parsed).toLocaleString()
}

const formatIsoDate = (iso?: string) => {
  if (!iso) return '-'
  const parsed = Date.parse(iso)
  if (Number.isNaN(parsed)) return '-'
  return new Date(parsed).toLocaleDateString()
}

const formatFilters = (filters: RiskFilters) => {
  const entries: Array<{ label: string; value: string }> = []
  if (filters.search?.trim()) entries.push({ label: 'Search', value: filters.search.trim() })
  if (filters.category !== 'all') entries.push({ label: 'Category', value: filters.category })
  if (filters.threatType !== 'all') entries.push({ label: 'Threat type', value: filters.threatType })
  if (filters.status !== 'all') entries.push({ label: 'Status', value: filters.status })
  if (filters.severity !== 'all') entries.push({ label: 'Severity', value: filters.severity })
  if (filters.checklistStatus !== 'all')
    entries.push({ label: 'Checklist status', value: filters.checklistStatus })
  return entries
}

const baseStyles = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 0; color: #0f172a; }
  header { padding: 24px 28px; border-bottom: 1px solid #e2e8f0; }
  main { padding: 22px 28px 36px; }
  h1 { margin: 0; font-size: 20px; letter-spacing: -0.01em; }
  h2 { margin: 18px 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.14em; color: #334155; }
  p, li { font-size: 12px; line-height: 1.55; color: #334155; }
  .meta { margin-top: 8px; display: grid; gap: 6px; font-size: 12px; color: #334155; }
  .pill { display: inline-block; padding: 2px 10px; border-radius: 999px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 11px; color: #334155; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { text-align: left; padding: 10px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #475569; background: #f8fafc; }
  td { font-size: 12px; color: #0f172a; }
  .muted { color: #475569; }
  .severity-low { color: #166534; }
  .severity-medium { color: #92400e; }
  .severity-high { color: #b91c1c; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { border: 1px solid #e2e8f0; background: #ffffff; border-radius: 14px; padding: 12px; }
  .card h3 { margin: 0; font-size: 12px; color: #0f172a; }
  .card p { margin: 6px 0 0; }
  @media print {
    @page { margin: 14mm; }
    header { padding: 0 0 12px; }
    main { padding: 12px 0 0; }
    .no-print { display: none !important; }
  }
`

export type RiskRegisterReportInput = {
  risks: Risk[]
  filters: RiskFilters
  generatedAtIso: string
  matrixFilterLabel?: string
}

export type DashboardChartsReportInput = {
  generatedAtIso: string
  filters: RiskFilters
  matrixFilterLabel?: string
  charts: {
    severity: { title: string; pngDataUrl: string | null; rows?: Array<{ label: string; value: number }> }
    categories: { title: string; pngDataUrl: string | null; rows?: Array<{ label: string; value: number }> }
    trend: { title: string; pngDataUrl: string | null; rows?: Array<{ label: string; value: number }>; note?: string }
  }
}

const formatFiltersBanner = (filters: RiskFilters, matrixFilterLabel?: string) => {
  const entries = formatFilters(filters)
  const hasMatrix = Boolean(matrixFilterLabel?.trim())

  if (!entries.length && !hasMatrix) {
    return `<span class="pill">No filters applied</span>`
  }

  const chips = [
    ...entries.map((entry) => `<span class="pill">${escapeHtml(entry.label)}: ${escapeHtml(entry.value)}</span>`),
    ...(hasMatrix ? [`<span class="pill">Matrix: ${escapeHtml(matrixFilterLabel ?? '')}</span>`] : []),
  ]

  return chips.join(' ')
}

const renderSimpleTable = (rows: Array<{ label: string; value: number }>, valueLabel: string) => {
  if (!rows.length) return ''
  const body = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td style="text-align:right">${escapeHtml(String(row.value))}</td></tr>`,
    )
    .join('')
  return `
    <table>
      <thead>
        <tr><th>Label</th><th style="text-align:right">${escapeHtml(valueLabel)}</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `
}

const renderChartBlock = (chart: { title: string; pngDataUrl: string | null; rows?: Array<{ label: string; value: number }>; note?: string }) => {
  const note = chart.note ? `<p class="muted">${escapeHtml(chart.note)}</p>` : ''
  const image = chart.pngDataUrl
    ? `<img src="${chart.pngDataUrl}" alt="${escapeHtml(chart.title)}" style="width:100%;max-width:920px;border:1px solid #e2e8f0;border-radius:14px" />`
    : `<p class="muted">Chart unavailable.</p>`
  const table = chart.rows ? renderSimpleTable(chart.rows, 'Value') : ''
  return `
    <div class="card">
      <h3>${escapeHtml(chart.title)}</h3>
      ${note}
      <div style="margin-top:10px">${image}</div>
      ${table ? `<div style="margin-top:10px">${table}</div>` : ''}
    </div>
  `
}

export const buildDashboardChartsReportHtml = ({
  generatedAtIso,
  filters,
  matrixFilterLabel,
  charts,
}: DashboardChartsReportInput) => {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Dashboard charts report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <header>
        <h1>Dashboard charts report</h1>
        <div class="meta">
          <div><span class="muted">Generated:</span> ${escapeHtml(formatIsoDateTime(generatedAtIso))}</div>
          <div><span class="muted">Filters:</span> ${formatFiltersBanner(filters, matrixFilterLabel)}</div>
        </div>
      </header>
      <main>
        <h2>Charts</h2>
        ${renderChartBlock(charts.severity)}
        ${renderChartBlock(charts.categories)}
        ${renderChartBlock(charts.trend)}
      </main>
    </body>
  </html>`
}

export type MaturityAssessmentReportInput = {
  generatedAtIso: string
  assessment: {
    frameworkName: string
    createdAt: number
    updatedAt: number
    domains: Array<{ name: string; score: number; notes?: string }>
  }
  presetLabel: string
  pngDataUrl: string | null
  disclaimer: string
}

export const buildMaturityAssessmentReportHtml = ({
  generatedAtIso,
  assessment,
  presetLabel,
  pngDataUrl,
  disclaimer,
}: MaturityAssessmentReportInput) => {
  const rows = assessment.domains
    .map((domain, index) => {
      const notes = domain.notes ? escapeHtml(domain.notes) : '<span class="muted">-</span>'
      return `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(domain.name)}</td>
        <td style="text-align:right">${escapeHtml(String(domain.score))}</td>
        <td>${notes}</td>
      </tr>`
    })
    .join('')

  const image = pngDataUrl
    ? `<img src="${pngDataUrl}" alt="${escapeHtml(assessment.frameworkName)} radar chart" style="width:100%;max-width:920px;border:1px solid #e2e8f0;border-radius:14px" />`
    : `<p class="muted">Chart unavailable.</p>`

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Maturity self-assessment report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <header>
        <h1>Maturity self-assessment report</h1>
        <div class="meta">
          <div><span class="muted">Generated:</span> ${escapeHtml(formatIsoDateTime(generatedAtIso))}</div>
          <div><span class="muted">Preset:</span> ${escapeHtml(presetLabel)}</div>
          <div><span class="muted">Created:</span> ${escapeHtml(formatIsoDateTime(new Date(assessment.createdAt).toISOString()))}</div>
          <div><span class="muted">Updated:</span> ${escapeHtml(formatIsoDateTime(new Date(assessment.updatedAt).toISOString()))}</div>
        </div>
      </header>
      <main>
        <div class="card">
          <h3>Self-assessment only</h3>
          <p>${escapeHtml(disclaimer)}</p>
        </div>

        <h2>Radar</h2>
        <div class="card">
          <h3>${escapeHtml(assessment.frameworkName)}</h3>
          <div style="margin-top:10px">${image}</div>
        </div>

        <h2>Scores</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Domain</th>
              <th style="text-align:right">Score (0–4)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="4" class="muted">No domains found.</td></tr>`}
          </tbody>
        </table>
      </main>
    </body>
  </html>`
}

export const buildRiskRegisterReportHtml = ({
  risks,
  filters,
  generatedAtIso,
  matrixFilterLabel,
}: RiskRegisterReportInput) => {
  const filterEntries = formatFilters(filters)
  const escapedMatrix = matrixFilterLabel ? escapeHtml(matrixFilterLabel) : ''

  const filterPills = [
    ...filterEntries.map(
      (entry) => `<span class="pill">${escapeHtml(entry.label)}: ${escapeHtml(entry.value)}</span>`,
    ),
    ...(matrixFilterLabel ? [`<span class="pill">Matrix: ${escapedMatrix}</span>`] : []),
  ].join(' ')

  const rows = risks
    .map((risk) => {
      const severity = getRiskSeverity(risk.riskScore)
      return `
        <tr>
          <td>
            <div><strong>${escapeHtml(risk.title)}</strong></div>
            <div class="muted">${escapeHtml(risk.description)}</div>
          </td>
          <td>${escapeHtml(risk.category)}</td>
          <td>${escapeHtml(risk.threatType)}</td>
          <td class="severity-${severity}"><strong>${risk.riskScore}</strong><div class="muted">${risk.probability}×${risk.impact}</div></td>
          <td>${escapeHtml(risk.status)}</td>
          <td>${escapeHtml(risk.owner || '-')}</td>
          <td>${formatIsoDate(risk.dueDate)}</td>
          <td>${formatIsoDate(risk.reviewDate)}</td>
        </tr>
      `
    })
    .join('')

  const playbookCards = risks
    .filter((risk) => Boolean(risk.playbook && (risk.playbook.steps?.length ?? 0) > 0))
    .map((risk) => {
      const playbook = risk.playbook!
      const steps = (playbook.steps ?? [])
        .map((step) => {
          const status = step.completedAt ? 'Done' : 'Open'
          const timestamp = step.completedAt ? formatIsoDateTime(step.completedAt) : '-'
          return `<li><strong>${escapeHtml(status)}:</strong> ${escapeHtml(step.description)} <span class="muted">(${escapeHtml(timestamp)})</span></li>`
        })
        .join('')

      return `
        <div class="card">
          <h3>${escapeHtml(risk.title)} — ${escapeHtml(playbook.title)}</h3>
          <ul>
            ${steps || `<li class="muted">No steps.</li>`}
          </ul>
        </div>
      `
    })
    .join('')

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Risk Register Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <header>
        <h1>Risk register report</h1>
        <div class="meta">
          <div><span class="muted">Generated:</span> ${escapeHtml(formatIsoDateTime(generatedAtIso))}</div>
          <div><span class="muted">Items:</span> ${risks.length}</div>
          ${
            filterPills
              ? `<div><span class="muted">Applied filters:</span> ${filterPills}</div>`
              : `<div><span class="muted">Applied filters:</span> <span class="pill">None</span></div>`
          }
        </div>
      </header>
      <main>
        <h2>Severity Legend</h2>
        <div class="grid">
          <div class="card">
            <h3 class="severity-low">Low</h3>
            <p>Score 1-8</p>
          </div>
          <div class="card">
            <h3 class="severity-medium">Medium</h3>
            <p>Score 9-15</p>
          </div>
          <div class="card">
            <h3 class="severity-high">High</h3>
            <p>Score 16-25</p>
          </div>
        </div>

        <h2>Risk Register</h2>
        <table>
          <thead>
            <tr>
              <th>Risk</th>
              <th>Category</th>
              <th>Threat</th>
              <th>Score</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Next Review</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="8" class="muted">No risks in this view.</td></tr>`}
          </tbody>
        </table>

        ${
          playbookCards
            ? `<h2>Incident Response Playbooks</h2><div class="grid">${playbookCards}</div>`
            : ''
        }
      </main>
    </body>
  </html>`
}

export type PrivacyIncidentReportInput = {
  risk: Risk
  generatedAtIso: string
  checklistTemplateId?: string
}

export const buildPrivacyIncidentChecklistReportHtml = ({
  risk,
  generatedAtIso,
  checklistTemplateId = 'checklist_privacy_incident_ndb_v1',
}: PrivacyIncidentReportInput) => {
  const checklist = risk.checklists.find((item) => item.templateId === checklistTemplateId) ?? null
  const items = checklist?.items ?? []
  const completed = items.filter((item) => Boolean(item.completedAt)).length

  const rows = items
    .map((item, index) => {
      const status = item.completedAt ? 'Completed' : 'Open'
      const timestamp = item.completedAt ? formatIsoDateTime(item.completedAt) : '-'
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.description)}</td>
          <td>${escapeHtml(status)}</td>
          <td>${escapeHtml(timestamp)}</td>
        </tr>
      `
    })
    .join('')

  const playbookHtml =
    risk.playbook && (risk.playbook.steps?.length ?? 0) > 0
      ? `
        <h2>Incident Response Playbook</h2>
        <div class="card">
          <h3>${escapeHtml(risk.playbook.title)}</h3>
          <ul>
            ${risk.playbook.steps
              .map((step) => {
                const status = step.completedAt ? 'Done' : 'Open'
                const timestamp = step.completedAt ? formatIsoDateTime(step.completedAt) : '-'
                return `<li><strong>${escapeHtml(status)}:</strong> ${escapeHtml(step.description)} <span class="muted">(${escapeHtml(timestamp)})</span></li>`
              })
              .join('')}
          </ul>
        </div>
      `
      : ''

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Privacy Incident Checklist Report</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <header>
        <h1>Privacy incident / checklist report</h1>
        <div class="meta">
          <div><span class="muted">Generated:</span> ${escapeHtml(formatIsoDateTime(generatedAtIso))}</div>
          <div><span class="muted">Risk:</span> ${escapeHtml(risk.title)}</div>
          <div><span class="muted">Checklist:</span> ${
            checklist ? escapeHtml(checklist.title) : '<span class="pill">Not attached</span>'
          }</div>
          <div><span class="muted">Completion:</span> ${completed}/${items.length}</div>
        </div>
      </header>
      <main>
        <h2>Risk Context</h2>
        <div class="card">
          <h3>Description</h3>
          <p>${escapeHtml(risk.description)}</p>
          <p class="muted">Owner: ${escapeHtml(risk.owner || '-')} · Status: ${escapeHtml(risk.status)}</p>
          <p class="muted">Created: ${escapeHtml(formatIsoDateTime(risk.creationDate))} · Updated: ${escapeHtml(
            formatIsoDateTime(risk.lastModified),
          )}</p>
        </div>

        ${playbookHtml}

        <h2>Checklist Items</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Status</th>
              <th>Completed At</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="4" class="muted">No checklist items found.</td></tr>`}
          </tbody>
        </table>
      </main>
    </body>
  </html>`
}

export const openReportWindow = (html: string, title: string) => {
  if (typeof window === 'undefined') return false
  try {
    installReportBridge()

    const reportId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    const storageKey = `${REPORT_STORAGE_PREFIX}${reportId}`
    try {
      window.localStorage.setItem(storageKey, html)
    } catch {
      // Ignore: we'll attempt BroadcastChannel delivery instead.
    }

    inMemoryReports.set(reportId, {
      title,
      html,
      expiresAtMs: Date.now() + 2 * 60_000,
    })

    const reportUrl = new URL('report.html', window.location.href)
    reportUrl.searchParams.set('rid', reportId)
    reportUrl.searchParams.set('title', title)

    // Avoid noopener/noreferrer here: some environments block inter-window communication.
    // The report page validates origin for message-based payload delivery.
    const reportWindow = window.open(reportUrl.toString(), '_blank')
    if (!reportWindow) {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
      return false
    }

    const sendPayloadMessage = () => {
      try {
        reportWindow.postMessage(
          { type: 'report_payload', id: reportId, title, html },
          window.location.origin,
        )
      } catch {
        // ignore
      }
    }

    // Fast-path: deliver payload directly; retry a few times to avoid a race with listener setup.
    sendPayloadMessage()
    window.setTimeout(sendPayloadMessage, 200)
    window.setTimeout(sendPayloadMessage, 800)

    // Best-effort: also broadcast the payload so the report page can receive it
    // even if storage is blocked/partitioned or the payload is too large.
    if (typeof window.BroadcastChannel === 'function') {
      try {
        const channel = new window.BroadcastChannel(REPORT_CHANNEL_NAME)
        channel.postMessage({ type: 'report_payload', id: reportId, title, html })
        window.setTimeout(() => {
          try { channel.close() } catch { /* ignore */ }
        }, 2_000)
      } catch {
        // ignore
      }
    }

    // Cleanup in case the report page never loads.
    window.setTimeout(() => {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    }, 2 * 60_000)

    return true
  } catch {
    return false
  }
}
