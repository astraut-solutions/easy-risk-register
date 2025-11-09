import type { Risk, RiskFilters, RiskSeverity, RiskStats } from '../types/risk'

export const DEFAULT_FILTERS: RiskFilters = {
  search: '',
  category: 'all',
  status: 'all',
  severity: 'all',
}

export const calculateRiskScore = (probability: number, impact: number) =>
  Math.min(Math.max(probability, 1), 5) * Math.min(Math.max(impact, 1), 5)

export const getRiskSeverity = (score: number): RiskSeverity => {
  if (score <= 5) return 'low'
  if (score <= 12) return 'medium'
  return 'high'
}

export const filterRisks = (risks: Risk[], filters: RiskFilters): Risk[] =>
  risks.filter((risk) => {
    const matchesSearch =
      !filters.search ||
      risk.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      risk.description.toLowerCase().includes(filters.search.toLowerCase())

    const matchesCategory =
      filters.category === 'all' ||
      risk.category.toLowerCase() === filters.category.toLowerCase()

    const matchesStatus =
      filters.status === 'all' || risk.status === filters.status

    const severity = getRiskSeverity(risk.riskScore)
    const matchesSeverity =
      filters.severity === 'all' || severity === filters.severity

    return matchesSearch && matchesCategory && matchesStatus && matchesSeverity
  })

export const computeRiskStats = (risks: Risk[]): RiskStats => {
  const stats: RiskStats = {
    total: risks.length,
    byStatus: { open: 0, mitigated: 0, closed: 0 },
    bySeverity: { low: 0, medium: 0, high: 0 },
    averageScore: 0,
    maxScore: 0,
    updatedAt: new Date().toISOString(),
  }

  if (!risks.length) {
    return stats
  }

  const totalScore = risks.reduce((sum, risk) => {
    stats.byStatus[risk.status] += 1
    const severity = getRiskSeverity(risk.riskScore)
    stats.bySeverity[severity] += 1
    stats.maxScore = Math.max(stats.maxScore, risk.riskScore)
    return sum + risk.riskScore
  }, 0)

  stats.averageScore = Number((totalScore / risks.length).toFixed(2))
  stats.updatedAt = new Date().toISOString()
  return stats
}
