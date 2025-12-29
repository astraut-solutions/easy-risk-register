import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts'

import type { Risk } from '../../types/risk'
import type { ApiError } from '../../services/apiClient'
import { timeSeriesService, type RiskTrendData } from '../../services/timeSeriesService'
import { Select } from '../../design-system'
import { Card, CardContent, CardHeader, CardTitle } from '../../design-system/components/Card'
import { buildDailyAverageExposureSeries, buildDailyChangeCounts, buildRiskTitleMap, buildTrendChangeEvents } from '../../utils/trends'

interface TrendAnalysisProps {
  risks: Risk[]
  historyEnabled: boolean
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const formatTimestamp = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) return '-'
  return dateTimeFormatter.format(new Date(timestamp))
}

const pickDaysOption = (value: string): 7 | 30 | 90 => (value === '7' ? 7 : value === '90' ? 90 : 30)

const TrendAnalysis = ({ risks, historyEnabled }: TrendAnalysisProps) => {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30)
  const [overallPoints, setOverallPoints] = useState<RiskTrendData[]>([])
  const [overallError, setOverallError] = useState<string | null>(null)
  const [overallLoading, setOverallLoading] = useState(false)
  const [overallTruncated, setOverallTruncated] = useState(false)

  const [selectedRiskId, setSelectedRiskId] = useState<string>('')
  const [riskPoints, setRiskPoints] = useState<RiskTrendData[]>([])
  const [riskError, setRiskError] = useState<string | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)

  const overallChartRef = useRef<HTMLDivElement>(null)
  const dailyChangesChartRef = useRef<HTMLDivElement>(null)
  const riskChartRef = useRef<HTMLDivElement>(null)

  const riskTitleMap = useMemo(() => buildRiskTitleMap(risks), [risks])
  const riskOptions = useMemo(
    () =>
      risks
        .slice()
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((risk) => ({ value: risk.id, label: `${risk.title} (score ${risk.riskScore})` })),
    [risks],
  )

  const visibleRiskIds = useMemo(() => new Set(risks.map((risk) => risk.id)), [risks])
  const scopedOverallPoints = useMemo(
    () => overallPoints.filter((point) => visibleRiskIds.has(point.riskId)),
    [overallPoints, visibleRiskIds],
  )

  useEffect(() => {
    if (!historyEnabled) {
      setOverallPoints([])
      setOverallError(null)
      setOverallLoading(false)
      setOverallTruncated(false)
      return
    }

    let cancelled = false
    setOverallLoading(true)
    setOverallError(null)

    const startDate = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)
    const limit = 5000

    void timeSeriesService
      .query({ startDate, limit })
      .then((points) => {
        if (cancelled) return
        setOverallPoints(points)
        setOverallTruncated(points.length >= limit)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = (error as ApiError)?.message
        setOverallError(message || 'Unable to load trend history')
        setOverallPoints([])
        setOverallTruncated(false)
      })
      .finally(() => {
        if (cancelled) return
        setOverallLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [historyEnabled, rangeDays])

  useEffect(() => {
    if (!historyEnabled) {
      setRiskPoints([])
      setRiskError(null)
      setRiskLoading(false)
      return
    }

    if (!selectedRiskId) {
      setRiskPoints([])
      setRiskError(null)
      setRiskLoading(false)
      return
    }

    let cancelled = false
    setRiskLoading(true)
    setRiskError(null)

    void timeSeriesService
      .query({ riskId: selectedRiskId, startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), limit: 500 })
      .then((points) => {
        if (cancelled) return
        setRiskPoints(points)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = (error as ApiError)?.message
        setRiskError(message || 'Unable to load risk history')
        setRiskPoints([])
      })
      .finally(() => {
        if (cancelled) return
        setRiskLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [historyEnabled, selectedRiskId])

  const exposureSeries = useMemo(() => buildDailyAverageExposureSeries(scopedOverallPoints, rangeDays), [scopedOverallPoints, rangeDays])
  const dailyChangeCounts = useMemo(() => buildDailyChangeCounts(scopedOverallPoints, rangeDays), [scopedOverallPoints, rangeDays])

  const recentChangeEvents = useMemo(() => buildTrendChangeEvents(scopedOverallPoints, { maxEvents: 10 }), [scopedOverallPoints])

  const selectedRiskTitle = useMemo(() => (selectedRiskId ? riskTitleMap.get(selectedRiskId) ?? selectedRiskId : ''), [
    selectedRiskId,
    riskTitleMap,
  ])

  const riskChangeEvents = useMemo(() => buildTrendChangeEvents(riskPoints, { maxEvents: 12 }), [riskPoints])

  useEffect(() => {
    const root = overallChartRef.current
    if (!root) return

    const chart = echarts.init(root)

    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: exposureSeries.labels },
      yAxis: { type: 'value', min: 0, max: 25 },
      series: [
        {
          name: 'Avg score',
          type: 'line',
          data: exposureSeries.averages,
          smooth: true,
          itemStyle: { color: '#ef4444' },
          areaStyle: { opacity: 0.12 },
        },
      ],
      grid: { left: 40, right: 18, top: 18, bottom: 26 },
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [exposureSeries])

  useEffect(() => {
    const root = dailyChangesChartRef.current
    if (!root) return

    const chart = echarts.init(root)

    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dailyChangeCounts.labels },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: 'Changes',
          type: 'bar',
          data: dailyChangeCounts.values,
          itemStyle: { color: '#3b82f6' },
        },
      ],
      grid: { left: 40, right: 18, top: 18, bottom: 26 },
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [dailyChangeCounts])

  useEffect(() => {
    const root = riskChartRef.current
    if (!root) return

    const chart = echarts.init(root)
    const sorted = riskPoints.slice().sort((a, b) => a.timestamp - b.timestamp)
    const labels = sorted.map((point) => new Date(point.timestamp).toISOString().slice(5, 16).replace('T', ' '))
    const scores = sorted.map((point) => point.riskScore)

    const option = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels, axisLabel: { hideOverlap: true } },
      yAxis: { type: 'value', min: 0, max: 25 },
      series: [
        {
          name: 'Score',
          type: 'line',
          data: scores,
          smooth: true,
          itemStyle: { color: '#111827' },
        },
      ],
      grid: { left: 40, right: 18, top: 18, bottom: 26 },
    }

    chart.setOption(option)

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [riskPoints])

  const latestAvgScore = exposureSeries.averages.length ? exposureSeries.averages[exposureSeries.averages.length - 1] : 0
  const latestCoverage = exposureSeries.counts.length ? exposureSeries.counts[exposureSeries.counts.length - 1] : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-text-high">Trends</h2>
          <p className="text-sm text-text-low">Risk score history with a clear “what changed” view.</p>
        </div>

        <div className="w-full sm:w-64">
          <Select
            label="Window"
            labelVisibility="sr-only"
            value={String(rangeDays)}
            onChange={(value) => setRangeDays(pickDaysOption(value))}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
            ]}
          />
        </div>
      </div>

      {!historyEnabled ? (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Score history is disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-low">
              Enable score history in Settings to capture snapshots and unlock trend views.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Overall exposure (average score)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-text-low">
                    Current: <span className="font-semibold text-text-high">{latestAvgScore}</span> across{' '}
                    <span className="font-semibold text-text-high">{latestCoverage}</span> risk{latestCoverage === 1 ? '' : 's'}
                  </p>
                  {overallTruncated ? (
                    <p className="text-xs text-text-low">
                      Results may be truncated. Narrow the time window for complete history.
                    </p>
                  ) : null}
                </div>

                {overallError ? (
                  <p className="mt-3 text-sm text-status-danger">{overallError}</p>
                ) : overallLoading ? (
                  <p className="mt-3 text-sm text-text-low" aria-busy="true">
                    Loading trend history…
                  </p>
                ) : (
                  <div ref={overallChartRef} className="mt-3 h-72 w-full" aria-label="Overall exposure chart" />
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>What changed (daily)</CardTitle>
              </CardHeader>
              <CardContent>
                {overallError ? (
                  <p className="text-sm text-status-danger">{overallError}</p>
                ) : overallLoading ? (
                  <p className="text-sm text-text-low" aria-busy="true">
                    Loading change history…
                  </p>
                ) : (
                  <div ref={dailyChangesChartRef} className="h-72 w-full" aria-label="Daily change count chart" />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Latest changes</CardTitle>
            </CardHeader>
            <CardContent>
              {!recentChangeEvents.length ? (
                <p className="text-sm text-text-low">No snapshots yet. Update likelihood, impact, status, or category to start tracking.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recentChangeEvents.map((event) => (
                    <li key={`${event.riskId}-${event.at}`} className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-high truncate">
                          {riskTitleMap.get(event.riskId) ?? event.riskId}
                        </p>
                        <p className="text-text-low">{event.message}</p>
                      </div>
                      <span className="text-xs text-text-low whitespace-nowrap">{formatTimestamp(event.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Per-risk history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <Select
                    label="Select risk"
                    options={[{ value: '', label: 'Choose a risk…' }, ...riskOptions]}
                    value={selectedRiskId}
                    onChange={(value) => setSelectedRiskId(value)}
                  />
                  {riskError ? <p className="mt-2 text-sm text-status-danger">{riskError}</p> : null}
                  {riskLoading ? (
                    <p className="mt-2 text-sm text-text-low" aria-busy="true">
                      Loading history…
                    </p>
                  ) : null}

                  {selectedRiskId && riskChangeEvents.length ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-text-high">What changed</p>
                      <ul className="mt-2 space-y-2 text-sm">
                        {riskChangeEvents.slice(0, 6).map((event) => (
                          <li key={`${event.riskId}-${event.at}`} className="flex flex-wrap justify-between gap-2">
                            <span className="text-text-low">{event.message}</span>
                            <span className="text-xs text-text-low whitespace-nowrap">{formatTimestamp(event.at)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="lg:col-span-2 space-y-4">
                  {selectedRiskId ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-text-high">{selectedRiskTitle}</p>
                        <div ref={riskChartRef} className="mt-2 h-64 w-full" aria-label="Risk score history chart" />
                      </div>

                      <div className="overflow-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-xs text-text-low">
                            <tr className="border-b border-border-faint">
                              <th className="py-2 pr-4 text-left font-semibold">Date</th>
                              <th className="py-2 pr-4 text-left font-semibold">Score</th>
                              <th className="py-2 pr-4 text-left font-semibold">L</th>
                              <th className="py-2 pr-4 text-left font-semibold">I</th>
                              <th className="py-2 pr-4 text-left font-semibold">Status</th>
                              <th className="py-2 pr-4 text-left font-semibold">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riskPoints
                              .slice()
                              .sort((a, b) => b.timestamp - a.timestamp)
                              .map((point) => (
                                <tr key={point.timestamp} className="border-b border-border-faint">
                                  <td className="py-2 pr-4 whitespace-nowrap text-text-low">{formatTimestamp(point.timestamp)}</td>
                                  <td className="py-2 pr-4 font-semibold text-text-high">{point.riskScore}</td>
                                  <td className="py-2 pr-4 text-text-low">{point.probability}</td>
                                  <td className="py-2 pr-4 text-text-low">{point.impact}</td>
                                  <td className="py-2 pr-4 text-text-low capitalize">{point.status ?? '-'}</td>
                                  <td className="py-2 pr-4 text-text-low">{point.category ?? '-'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {!riskLoading && selectedRiskId && !riskPoints.length ? (
                          <p className="mt-3 text-sm text-text-low">
                            No history for this risk yet. Change likelihood/impact/status/category to start capturing snapshots.
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-text-low">
                      Select a risk to view its score history and changes over time.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default TrendAnalysis
