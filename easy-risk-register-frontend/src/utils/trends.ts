import type { Risk } from '../types/risk'
import type { RiskTrendData } from '../services/timeSeriesService'

export type TrendChangeEvent = {
  riskId: string
  at: number
  message: string
  scoreDelta: number
}

const dayKeyUtc = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10)

export function buildDailyAverageExposureSeries(points: RiskTrendData[], days: number) {
  const now = new Date()
  const endUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + 24 * 60 * 60 * 1000 - 1
  const startUtc = endUtc - (days - 1) * 24 * 60 * 60 * 1000

  const sorted = points.slice().sort((a, b) => a.timestamp - b.timestamp)
  const lastSeenByRisk = new Map<string, number>()
  let pointer = 0

  while (pointer < sorted.length && sorted[pointer].timestamp < startUtc) {
    const snapshot = sorted[pointer]
    lastSeenByRisk.set(snapshot.riskId, snapshot.riskScore)
    pointer += 1
  }

  const labels: string[] = []
  const averages: number[] = []
  const counts: number[] = []

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayEnd = startUtc + dayIndex * 24 * 60 * 60 * 1000

    while (pointer < sorted.length && sorted[pointer].timestamp <= dayEnd) {
      const snapshot = sorted[pointer]
      lastSeenByRisk.set(snapshot.riskId, snapshot.riskScore)
      pointer += 1
    }

    labels.push(new Date(dayEnd).toISOString().slice(5, 10))
    counts.push(lastSeenByRisk.size)

    if (lastSeenByRisk.size === 0) {
      averages.push(0)
      continue
    }

    let sum = 0
    for (const score of lastSeenByRisk.values()) sum += score
    const avg = sum / lastSeenByRisk.size
    averages.push(Number(avg.toFixed(2)))
  }

  return { labels, averages, counts }
}

function describeSnapshotDelta(prev: RiskTrendData | null, next: RiskTrendData): { message: string; scoreDelta: number } {
  if (!prev) {
    return { message: `Initial score ${next.riskScore} (L${next.probability} × I${next.impact})`, scoreDelta: 0 }
  }

  const parts: string[] = []
  const scoreDelta = next.riskScore - prev.riskScore

  if (prev.riskScore !== next.riskScore) {
    const arrow = scoreDelta > 0 ? '↑' : '↓'
    parts.push(`Score ${prev.riskScore} → ${next.riskScore} (${arrow}${Math.abs(scoreDelta)})`)
  }

  if (prev.probability !== next.probability || prev.impact !== next.impact) {
    parts.push(`L${prev.probability}×I${prev.impact} → L${next.probability}×I${next.impact}`)
  }

  if (prev.status !== next.status) {
    parts.push(`Status ${prev.status} → ${next.status}`)
  }

  if (prev.category !== next.category) {
    parts.push(`Category ${prev.category ?? '—'} → ${next.category ?? '—'}`)
  }

  if (!parts.length) {
    return { message: 'No change detected', scoreDelta: 0 }
  }

  return { message: parts.join(' · '), scoreDelta }
}

export function buildTrendChangeEvents(points: RiskTrendData[], { maxEvents = 10 } = {}): TrendChangeEvent[] {
  const byRisk = new Map<string, RiskTrendData[]>()
  for (const point of points) {
    const list = byRisk.get(point.riskId) ?? []
    list.push(point)
    byRisk.set(point.riskId, list)
  }

  const events: TrendChangeEvent[] = []
  for (const [riskId, list] of byRisk.entries()) {
    const sorted = list.slice().sort((a, b) => a.timestamp - b.timestamp)
    for (let i = 0; i < sorted.length; i += 1) {
      const prev = i > 0 ? sorted[i - 1] : null
      const next = sorted[i]
      const { message, scoreDelta } = describeSnapshotDelta(prev, next)
      if (prev && message === 'No change detected') continue
      events.push({ riskId, at: next.timestamp, message, scoreDelta })
    }
  }

  return events.sort((a, b) => b.at - a.at).slice(0, maxEvents)
}

export function buildRiskTitleMap(risks: Risk[]) {
  const map = new Map<string, string>()
  for (const risk of risks) map.set(risk.id, risk.title)
  return map
}

export function buildDailyChangeCounts(points: RiskTrendData[], days: number) {
  const perDay = new Map<string, number>()
  for (const point of points) {
    const key = dayKeyUtc(point.timestamp)
    perDay.set(key, (perDay.get(key) ?? 0) + 1)
  }

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
}

