import type { Risk } from '../types/risk'

export interface RiskTrendData {
  riskId: string
  probability: number
  impact: number
  riskScore: number
  timestamp: number
  category?: string
  status?: Risk['status']
}

export interface TimeSeriesQueryOptions {
  riskId?: string
  category?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}

type TimeSeriesFeatureFlags = {
  enabled: boolean
  apiBaseUrl: string
}

const getTimeSeriesFlags = (): TimeSeriesFeatureFlags => ({
  enabled: import.meta.env.VITE_ENABLE_TIMESERIES === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
})

export class TimeSeriesService {
  async writeSnapshot(_risk: Risk): Promise<void> {
    const flags = getTimeSeriesFlags()
    if (!flags.enabled) return

    const body: RiskTrendData = {
      riskId: _risk.id,
      probability: _risk.probability,
      impact: _risk.impact,
      riskScore: _risk.riskScore,
      timestamp: Date.now(),
      category: _risk.category,
      status: _risk.status,
    }

    await fetch(`${flags.apiBaseUrl}/api/timeseries/write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async query(_options: TimeSeriesQueryOptions = {}): Promise<RiskTrendData[]> {
    const flags = getTimeSeriesFlags()
    if (!flags.enabled) return []

    const params = new URLSearchParams()
    if (_options.riskId) params.set('riskId', _options.riskId)
    if (_options.category) params.set('category', _options.category)
    if (_options.startDate) params.set('start', _options.startDate.toISOString())
    if (_options.endDate) params.set('end', _options.endDate.toISOString())
    if (typeof _options.limit === 'number') params.set('limit', String(_options.limit))

    const res = await fetch(`${flags.apiBaseUrl}/api/timeseries/query?${params.toString()}`)
    if (!res.ok) return []

    const data = (await res.json()) as unknown
    if (!Array.isArray(data)) return []

    return data as RiskTrendData[]
  }
}

export const timeSeriesService = new TimeSeriesService()
