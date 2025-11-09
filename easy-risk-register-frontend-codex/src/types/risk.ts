export type RiskStatus = 'open' | 'mitigated' | 'closed'

export type RiskSeverity = 'low' | 'medium' | 'high'

export interface Risk {
  id: string
  title: string
  description: string
  probability: number // 1-5
  impact: number // 1-5
  riskScore: number
  category: string
  status: RiskStatus
  mitigationPlan: string
  creationDate: string // ISO
  lastModified: string // ISO
}

export interface RiskInput {
  title: string
  description: string
  probability: number
  impact: number
  category: string
  status?: RiskStatus
  mitigationPlan?: string
}

export interface RiskFilters {
  search: string
  category: string
  status: RiskStatus | 'all'
  severity: RiskSeverity | 'all'
}

export interface RiskStats {
  total: number
  byStatus: Record<RiskStatus, number>
  bySeverity: Record<RiskSeverity, number>
  averageScore: number
  maxScore: number
  updatedAt: string
}

export interface RiskSnapshot {
  filters: RiskFilters
  risks: Risk[]
  stats: RiskStats
}
