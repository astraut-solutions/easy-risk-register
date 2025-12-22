import type { Risk, RiskFilters, RiskSeverity, RiskStats } from '../types/risk'

/** Default risk filters applied to all risk lists */
export const DEFAULT_FILTERS: RiskFilters = {
  search: '',
  category: 'all',
  status: 'all',
  severity: 'all',
}

/**
 * Calculates a risk score based on probability and impact values
 * The risk score is calculated as probability * impact
 * Both values are clamped to the range [1, 5] before calculation
 * @param probability - The probability of the risk occurring (typically 1-5)
 * @param impact - The impact of the risk if it occurs (typically 1-5)
 * @returns Risk score as a number between 1 and 25
 */
export const calculateRiskScore = (probability: number, impact: number) =>
  Math.min(Math.max(probability, 1), 5) * Math.min(Math.max(impact, 1), 5)

/**
 * Determines the severity level based on a risk score
 * @param score - The calculated risk score
 * @returns Risk severity level ('low', 'medium', or 'high')
 *          - 'low' for scores <= 3
 *          - 'medium' for scores 4-6
 *          - 'high' for scores > 6
 */
export const getRiskSeverity = (score: number): RiskSeverity => {
  if (score <= 3) return 'low'
  if (score <= 6) return 'medium'
  return 'high'
}

/**
 * Filters risks based on specified filter criteria
 * @param risks - Array of risks to filter
 * @param filters - Filter criteria including search term, category, status, and severity
 * @returns Filtered array of risks that match all specified criteria
 */
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

/**
 * Computes statistics for a collection of risks
 * @param risks - Array of risks to analyze
 * @returns RiskStats object containing various statistics:
 *          - total number of risks
 *          - count by status (open, mitigated, closed, accepted)
 *          - count by severity (low, medium, high)
 *          - average risk score
 *          - maximum risk score
 *          - timestamp of when stats were computed
 */
export const computeRiskStats = (risks: Risk[]): RiskStats => {
  const stats: RiskStats = {
    total: risks.length,
    byStatus: { open: 0, mitigated: 0, closed: 0, accepted: 0 },
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
