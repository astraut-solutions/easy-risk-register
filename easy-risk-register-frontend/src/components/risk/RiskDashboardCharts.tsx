import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, Line, getElementAtEvent } from 'react-chartjs-2'

import type { Risk, RiskFilters, RiskSeverity } from '../../types/risk'
import type { RiskScoreSnapshot, TrendDefaultMode } from '../../types/visualization'
import { Button, Select } from '../../design-system'
import { ensureChartJsRegistered } from '../charts/chartjs'
import { buildDashboardChartsReportHtml, openReportWindow } from '../../utils/reports'
import { getRiskSeverity } from '../../utils/riskCalculations'
import { trackEvent } from '../../utils/analytics'

type DrillDownTarget = { filters: Partial<RiskFilters>; label: string }

type ChartTableRow = { label: string; value: number }

const dayKeyUtc = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10)

const severityOrder: RiskSeverity[] = ['high', 'medium', 'low']
const severityLabel: Record<RiskSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const severityColor: Record<RiskSeverity, { bg: string; border: string }> = {
  high: { bg: 'rgba(239, 68, 68, 0.35)', border: 'rgba(239, 68, 68, 0.9)' },
  medium: { bg: 'rgba(245, 158, 11, 0.35)', border: 'rgba(245, 158, 11, 0.9)' },
  low: { bg: 'rgba(34, 197, 94, 0.35)', border: 'rgba(34, 197, 94, 0.9)' },
}

const getRiskSeverityLocal = (riskScore: number): RiskSeverity => getRiskSeverity(riskScore)

const buildExposureSeries = (snapshots: RiskScoreSnapshot[], days: number) => {
  const now = new Date()
  const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + 24 * 60 * 60 * 1000 - 1
  const startUtc = endUtc - (days - 1) * 24 * 60 * 60 * 1000

  const sorted = snapshots.slice().sort((a, b) => a.timestamp - b.timestamp)
  const lastSeenByRisk = new Map<string, number>()
  let pointer = 0

  // Initialize state with snapshots before the window so day 1 reflects "current" at that time.
  while (pointer < sorted.length && sorted[pointer].timestamp < startUtc) {
    const snapshot = sorted[pointer]
    lastSeenByRisk.set(snapshot.riskId, snapshot.riskScore)
    pointer += 1
  }

  const labels: string[] = []
  const values: number[] = []
  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayEnd = startUtc + dayIndex * 24 * 60 * 60 * 1000

    while (pointer < sorted.length && sorted[pointer].timestamp <= dayEnd) {
      const snapshot = sorted[pointer]
      lastSeenByRisk.set(snapshot.riskId, snapshot.riskScore)
      pointer += 1
    }

    const dayLabel = new Date(dayEnd).toISOString().slice(5, 10)
    labels.push(dayLabel)

    if (lastSeenByRisk.size === 0) {
      values.push(0)
      continue
    }

    let sum = 0
    for (const score of lastSeenByRisk.values()) sum += score
    const avg = sum / lastSeenByRisk.size
    values.push(Number(avg.toFixed(2)))
  }

  return { labels, values }
}

export interface RiskDashboardChartsProps {
  risks: Risk[]
  snapshots: RiskScoreSnapshot[]
  filters: RiskFilters
  matrixFilterLabel?: string
  historyEnabled: boolean
  defaultTrendMode: TrendDefaultMode
  onDrillDown: (target: DrillDownTarget) => void
  registerPdfExporter?: (exporter: (() => void) | null) => void
}

export const RiskDashboardCharts = ({
  risks,
  snapshots,
  filters,
  matrixFilterLabel,
  historyEnabled,
  defaultTrendMode,
  onDrillDown,
  registerPdfExporter,
}: RiskDashboardChartsProps) => {
  ensureChartJsRegistered()

  const [trendMode, setTrendMode] = useState<TrendDefaultMode>(defaultTrendMode)
  const [showSeverityTable, setShowSeverityTable] = useState(false)
  const [showCategoryTable, setShowCategoryTable] = useState(false)
  const [showTrendTable, setShowTrendTable] = useState(false)
  const severityChartRef = useRef<any>(null)
  const categoryChartRef = useRef<any>(null)
  const trendChartRef = useRef<any>(null)

  const downloadPng = (opts: { dataUrl: string; filename: string }) => {
    try {
      const link = document.createElement('a')
      link.href = opts.dataUrl
      link.download = opts.filename
      link.click()
    } catch {
      // ignore
    }
  }

  const safeFilename = (value: string) =>
    value
      .replaceAll(/[^a-zA-Z0-9._-]+/g, '_')
      .replaceAll(/_+/g, '_')
      .replaceAll(/^_+|_+$/g, '')

  const timestampSlug = () => new Date().toISOString().replaceAll(':', '-')

  const render1080pPng = (chart: any) => {
    const sourceCanvas = chart?.canvas as HTMLCanvasElement | undefined
    if (!sourceCanvas) return null

    const outCanvas = document.createElement('canvas')
    outCanvas.width = 1920
    outCanvas.height = 1080

    const ctx = outCanvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height)

    const srcWidth = sourceCanvas.width
    const srcHeight = sourceCanvas.height
    if (!srcWidth || !srcHeight) return null

    const scale = Math.min(outCanvas.width / srcWidth, outCanvas.height / srcHeight)
    const drawWidth = srcWidth * scale
    const drawHeight = srcHeight * scale
    const dx = (outCanvas.width - drawWidth) / 2
    const dy = (outCanvas.height - drawHeight) / 2

    ctx.imageSmoothingEnabled = true
    try {
      ctx.imageSmoothingQuality = 'high'
    } catch {
      // ignore: not supported in some environments
    }
    ctx.drawImage(sourceCanvas, dx, dy, drawWidth, drawHeight)

    return outCanvas.toDataURL('image/png')
  }

  const exportChartPng = (key: 'severity' | 'categories' | 'trend') => {
    const chart =
      key === 'severity'
        ? severityChartRef.current
        : key === 'categories'
          ? categoryChartRef.current
          : trendChartRef.current
    if (!chart) return

    const dataUrl = render1080pPng(chart)
    if (!dataUrl) return

    const filename = safeFilename(
      `easy-risk-register__dashboard__${key}__${timestampSlug()}.png`,
    )
    downloadPng({ dataUrl, filename })
    trackEvent('export_png', { kind: 'dashboard_charts', chart: key })
  }

  const severityCounts = useMemo(() => {
    const counts: Record<RiskSeverity, number> = { low: 0, medium: 0, high: 0 }
    for (const risk of risks) counts[getRiskSeverityLocal(risk.riskScore)] += 1
    return counts
  }, [risks])

  const categorySeverityCounts = useMemo(() => {
    const categories = new Map<string, Record<RiskSeverity, number>>()
    for (const risk of risks) {
      const key = risk.category || 'Uncategorised'
      const current = categories.get(key) ?? { low: 0, medium: 0, high: 0 }
      current[getRiskSeverityLocal(risk.riskScore)] += 1
      categories.set(key, current)
    }

    const entries = Array.from(categories.entries())
      .sort((a, b) => {
        const totalA = a[1].high + a[1].medium + a[1].low
        const totalB = b[1].high + b[1].medium + b[1].low
        return totalB - totalA
      })
      .slice(0, 10)

    return {
      labels: entries.map(([label]) => label),
      counts: entries.map(([, counts]) => counts),
    }
  }, [risks])

  const riskIdSet = useMemo(() => new Set(risks.map((risk) => risk.id)), [risks])

  const scopedSnapshots = useMemo(
    () => snapshots.filter((snapshot) => riskIdSet.has(snapshot.riskId)),
    [riskIdSet, snapshots],
  )

  const trendSeries = useMemo(() => {
    if (!historyEnabled) return null
    if (!scopedSnapshots.length) return null
    return buildExposureSeries(scopedSnapshots, 30)
  }, [historyEnabled, scopedSnapshots])

  const trendTableRows: ChartTableRow[] = useMemo(() => {
    if (!trendSeries) return []
    return trendSeries.labels.map((label, index) => ({ label, value: trendSeries.values[index] ?? 0 }))
  }, [trendSeries])

  const recentChangeCounts = useMemo(() => {
    if (!historyEnabled) return null
    if (!scopedSnapshots.length) return null

    const perDay = new Map<string, number>()
    for (const snapshot of scopedSnapshots) {
      const key = dayKeyUtc(snapshot.timestamp)
      perDay.set(key, (perDay.get(key) ?? 0) + 1)
    }

    const days = 30
    const now = new Date()
    const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const labels: string[] = []
    const values: number[] = []
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const dayStart = endUtc - offset * 24 * 60 * 60 * 1000
      const key = new Date(dayStart).toISOString().slice(0, 10)
      labels.push(key.slice(5, 10))
      values.push(perDay.get(key) ?? 0)
    }

    return { labels, values }
  }, [historyEnabled, scopedSnapshots])

  const severityBarData = useMemo(() => {
    const labels = severityOrder.map((severity) => severityLabel[severity])
    const data = severityOrder.map((severity) => severityCounts[severity])
    return {
      labels,
      datasets: [
        {
          label: 'Risks',
          data,
          backgroundColor: severityOrder.map((severity) => severityColor[severity].bg),
          borderColor: severityOrder.map((severity) => severityColor[severity].border),
          borderWidth: 1,
        },
      ],
    }
  }, [severityCounts])

  const severityTableRows: ChartTableRow[] = useMemo(
    () =>
      severityOrder.map((severity) => ({
        label: severityLabel[severity],
        value: severityCounts[severity],
      })),
    [severityCounts],
  )

  const stackedCategoryData = useMemo(() => {
    return {
      labels: categorySeverityCounts.labels,
      datasets: severityOrder.map((severity) => ({
        label: severityLabel[severity],
        data: categorySeverityCounts.counts.map((entry) => entry[severity]),
        backgroundColor: severityColor[severity].bg,
        borderColor: severityColor[severity].border,
        borderWidth: 1,
        stack: 'severity',
      })),
    }
  }, [categorySeverityCounts])

  const categoryTableRows: Array<{ label: string; value: number }> = useMemo(
    () =>
      categorySeverityCounts.labels.map((label, index) => {
        const counts = categorySeverityCounts.counts[index]
        const total = counts ? counts.high + counts.medium + counts.low : 0
        return { label, value: total }
      }),
    [categorySeverityCounts],
  )

  const trendLineData = useMemo(() => {
    if (!historyEnabled) return null
    if (trendMode === 'recent_changes') {
      if (!recentChangeCounts) return null
      return {
        labels: recentChangeCounts.labels,
        datasets: [
          {
            label: 'Score updates',
            data: recentChangeCounts.values,
            borderColor: 'rgba(59, 130, 246, 0.95)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.35,
            fill: true,
          },
        ],
      }
    }

    if (!trendSeries) return null
    return {
      labels: trendSeries.labels,
      datasets: [
        {
          label: 'Average exposure',
          data: trendSeries.values,
          borderColor: 'rgba(59, 130, 246, 0.95)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.35,
          fill: true,
        },
      ],
    }
  }, [historyEnabled, recentChangeCounts, trendMode, trendSeries])

  const drillDownButtons = useMemo(() => {
    return [] as DrillDownTarget[]
  }, [])

  const exportDashboardPdf = useCallback(() => {
    const generatedAtIso = new Date().toISOString()
    const severityPng =
      severityChartRef.current && typeof severityChartRef.current.toBase64Image === 'function'
        ? severityChartRef.current.toBase64Image('image/png', 1)
        : null
    const categoriesPng =
      categoryChartRef.current && typeof categoryChartRef.current.toBase64Image === 'function'
        ? categoryChartRef.current.toBase64Image('image/png', 1)
        : null
    const trendPng =
      trendChartRef.current && typeof trendChartRef.current.toBase64Image === 'function'
        ? trendChartRef.current.toBase64Image('image/png', 1)
        : null

    const html = buildDashboardChartsReportHtml({
      generatedAtIso,
      filters,
      matrixFilterLabel,
      charts: {
        severity: { title: 'Risk distribution by severity', pngDataUrl: severityPng, rows: severityTableRows },
        categories: {
          title: 'Risk distribution by category (stacked)',
          pngDataUrl: categoriesPng,
          rows: categoryTableRows,
        },
        trend: {
          title:
            trendMode === 'recent_changes'
              ? 'Trend: score updates per day (last 30 days)'
              : 'Trend: average score (last 30 days)',
          pngDataUrl: trendPng,
          rows: trendMode === 'overall_exposure' ? trendTableRows : undefined,
          note: !historyEnabled
            ? 'Trend charts are disabled. Enable score history in Settings to capture snapshots.'
            : !trendLineData
              ? 'No snapshots available for the current selection yet.'
              : undefined,
        },
      },
    })

    const opened = openReportWindow(html, 'Dashboard charts report')
    if (!opened) {
      trackEvent('export_print_view_open', { kind: 'dashboard_charts', outcome: 'blocked_popup' })
      // ignore: App already shows a toast for blocked popups in other flows; keep consistent minimal behavior here.
      return
    }
    trackEvent('export_print_view_open', { kind: 'dashboard_charts', outcome: 'success' })
  }, [
    categoryTableRows,
    filters,
    historyEnabled,
    matrixFilterLabel,
    severityTableRows,
    trendLineData,
    trendMode,
    trendTableRows,
  ])

  useEffect(() => {
    registerPdfExporter?.(exportDashboardPdf)
    return () => registerPdfExporter?.(null)
  }, [exportDashboardPdf, registerPdfExporter])

  const renderDataTable = (rows: ChartTableRow[], valueLabel: string) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-border-faint bg-surface-secondary/10 p-4">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.05em] text-text-medium border-b border-border-faint">
            <th className="py-3 px-3 font-medium">Label</th>
            <th className="py-3 px-3 text-right font-medium">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border-faint/50 last:border-0 hover:bg-surface-tertiary/30">
              <td className="py-3 px-3 text-text-high">{row.label}</td>
              <td className="py-3 px-3 text-right font-medium text-text-high">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (!risks.length) {
    return (
      <div className="rr-panel p-8 text-center">
        <p className="text-lg font-semibold text-text-high">No data to chart</p>
        <p className="mt-2 text-sm text-text-low">
          Add a risk or relax filters to see distribution and trend charts.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-semibold text-text-high">Dashboard charts</h3>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={exportDashboardPdf}>
            Export dashboard PDF
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2" aria-label="Quick drill-down">
            {drillDownButtons.map((target) => (
              <Button
                key={target.label}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onDrillDown(target)}
              >
                {target.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <label className="text-sm font-medium text-text-medium whitespace-nowrap">Trend mode:</label>
            <div className="flex-1">
              <Select
                options={[
                  { value: 'overall_exposure', label: 'Overall exposure (average score)' },
                  { value: 'recent_changes', label: 'Recent score changes (count)' },
                ]}
                value={trendMode}
                onChange={(value) => setTrendMode(value as TrendDefaultMode)}
                disabled={!historyEnabled}
                helperText={!historyEnabled ? 'Enable score history in Settings to unlock trends.' : undefined}
              />
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end justify-between gap-4 mb-5">
            <div>
              <h4 className="text-base font-semibold text-text-high">Risk distribution (severity)</h4>
              <p className="mt-1 text-sm text-text-medium">
                High/Medium/Low counts for the current view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowSeverityTable((value) => !value)}
              >
                {showSeverityTable ? 'Hide data table' : 'Show data table'}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => exportChartPng('severity')}>
                Export PNG
              </Button>
            </div>
          </div>

          <div className="mt-2 h-80" aria-label="Severity distribution chart">
            <Bar
              ref={severityChartRef}
              data={severityBarData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    }
                  },
                  x: {
                    grid: {
                      display: false,
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index',
                }
              }}
              onClick={(event) => {
                const chart = severityChartRef.current
                if (!chart) return
                const elements = getElementAtEvent(chart, event)
                const first = elements?.[0]
                if (!first) return
                const index = first.index
                const severity = severityOrder[index]
                if (!severity) return
                onDrillDown({ label: `Show ${severityLabel[severity]} severity`, filters: { severity } })
              }}
            />
          </div>

          {showSeverityTable ? renderDataTable(severityTableRows, 'Count') : null}
        </div>

        <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end justify-between gap-4 mb-5">
            <div>
              <h4 className="text-base font-semibold text-text-high">Risk distribution (top categories)</h4>
              <p className="mt-1 text-sm text-text-medium">
                Top 10 categories, stacked by severity.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCategoryTable((value) => !value)}
              >
                {showCategoryTable ? 'Hide data table' : 'Show data table'}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => exportChartPng('categories')}>
                Export PNG
              </Button>
            </div>
          </div>

          <div className="mt-2 h-80" aria-label="Category distribution chart">
            <Bar
              ref={categoryChartRef}
              data={stackedCategoryData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: {
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: 'circle',
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: {
                      display: false,
                    }
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    }
                  },
                },
                interaction: {
                  intersect: false,
                  mode: 'index',
                }
              }}
              onClick={(event) => {
                const chart = categoryChartRef.current
                if (!chart) return
                const elements = getElementAtEvent(chart, event)
                const first = elements?.[0]
                if (!first) return
                const datasetIndex = first.datasetIndex
                const index = first.index
                const severity = severityOrder[datasetIndex]
                const category = categorySeverityCounts.labels[index]
                if (!severity || !category) return
                onDrillDown({
                  label: `Show ${category} (${severityLabel[severity]})`,
                  filters: { category, severity },
                })
              }}
            />
          </div>

          {showCategoryTable ? renderDataTable(categoryTableRows, 'Count') : null}
        </div>
      </div>

      <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end justify-between gap-4 mb-5">
          <div>
            <h4 className="text-base font-semibold text-text-high">Risk trend (last 30 days)</h4>
            <p className="mt-1 text-sm text-text-medium">
              {trendMode === 'recent_changes'
                ? 'Counts how many score updates were recorded per day.'
                : 'Tracks average score across risks based on stored snapshots.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowTrendTable((value) => !value)}
              disabled={!trendLineData}
            >
              {showTrendTable ? 'Hide data table' : 'Show data table'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => exportChartPng('trend')}
              disabled={!trendLineData}
            >
              Export PNG
            </Button>
          </div>
        </div>

        {!historyEnabled ? (
          <div className="mt-3 rounded-xl border border-border-faint bg-surface-secondary/10 p-4 text-sm text-text-medium">
            Trend charts are disabled. Enable score history in Settings to capture snapshots for trends.
          </div>
        ) : !trendLineData ? (
          <div className="mt-3 rounded-xl border border-border-faint bg-surface-secondary/10 p-4 text-sm text-text-medium">
            No snapshots available for the current selection yet. Update a risk’s likelihood/impact to start capturing trends.
          </div>
        ) : (
          <div className="mt-2 h-80" aria-label="Trend chart">
            <Line
              ref={trendChartRef}
              data={trendLineData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'index',
                }
              }}
            />
          </div>
        )}

        {showTrendTable && trendMode === 'overall_exposure' && trendTableRows.length
          ? renderDataTable(trendTableRows, 'Avg score')
          : null}
      </div>
    </div>
  )
}

export default RiskDashboardCharts
