import type { Risk } from '../types/risk'
import { apiFetch } from './apiClient'
import { useAuthStore } from '../stores/authStore'

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

export class TimeSeriesService {
  async writeSnapshot(_risk: Risk): Promise<void> {
    // Deprecated: snapshots are captured server-side on risk create/update.
    void _risk
  }

  async query(_options: TimeSeriesQueryOptions = {}): Promise<RiskTrendData[]> {
    if (!useAuthStore.getState().accessToken) return []

    const params = new URLSearchParams()
    if (_options.riskId) params.set('riskId', _options.riskId)
    if (_options.category) params.set('category', _options.category)
    if (_options.startDate) params.set('start', _options.startDate.toISOString())
    if (_options.endDate) params.set('end', _options.endDate.toISOString())
    if (typeof _options.limit === 'number') params.set('limit', String(_options.limit))

    const res = await apiFetch(`/api/timeseries/query?${params.toString()}`, { method: 'GET' })
    if (!res.ok) return []

    const data = (await res.json()) as unknown
    if (!Array.isArray(data)) return []

    return data as RiskTrendData[]
  }
}

export const timeSeriesService = new TimeSeriesService()
