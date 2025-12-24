export type TrendDefaultMode = 'overall_exposure' | 'recent_changes'

export type MaturityFrameworkPreset = 'acsc_essential_eight' | 'nist_csf'

export type ScoreHistoryRetention =
  | { mode: 'days'; value: number }
  | { mode: 'count'; value: number }

export interface RiskScoreSnapshot {
  riskId: string
  timestamp: number
  probability: number
  impact: number
  riskScore: number
}

export interface MaturityDomainScore {
  key: string
  name: string
  score: number
  notes?: string
}

export interface MaturityAssessment {
  id: string
  frameworkKey: MaturityFrameworkPreset
  frameworkName: string
  domains: MaturityDomainScore[]
  createdAt: number
  updatedAt: number
}

