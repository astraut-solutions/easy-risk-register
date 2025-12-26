import type { Risk, RiskFilters, RiskSeverity, RiskStats } from '../types/risk'

/** Default risk filters applied to all risk lists */
export const DEFAULT_FILTERS: RiskFilters = {
  search: '',
  category: 'all',
  threatType: 'all',
  status: 'all',
  severity: 'all',
  checklistStatus: 'all',
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
 * Calculates a detailed risk score with additional factors (async version)
 * This version can handle more complex calculations using Web Workers if available
 */
export const calculateRiskScoreAsync = async (probability: number, impact: number, exposure?: number) => {
  return new Promise<{ score: number; level: string; details: any }>((resolve) => {
    // Simulate async processing with setTimeout
    setTimeout(() => {
      const baseRisk = probability * impact;
      const adjustedRisk = baseRisk * (exposure || 1);

      // Additional factors could be considered
      const timeFactor = 1; // Placeholder for time-based factors
      const assetValueFactor = 1; // Placeholder for asset value factors

      const finalRiskScore = (adjustedRisk * timeFactor * assetValueFactor) / 100;

      resolve({
        score: finalRiskScore,
        level: getRiskLevel(finalRiskScore),
        details: {
          baseRisk,
          adjustedRisk,
          timeFactor,
          assetValueFactor
        }
      });
    }, 0);
  });
};

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
 * Determines the risk level based on a risk score (extended version)
 * @param score - The calculated risk score
 * @returns Risk level ('Minimal', 'Low', 'Medium', 'High', 'Critical')
 */
export const getRiskLevel = (score: number): string => {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Minimal';
}

/**
 * Filters risks based on specified filter criteria
 * @param risks - Array of risks to filter
 * @param filters - Filter criteria including search term, category, status, and severity
 * @returns Filtered array of risks that match all specified criteria
 */
export const filterRisks = (risks: Risk[], filters: RiskFilters): Risk[] =>
  risks.filter((risk) => {
    const normalizedSearch = filters.search.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      risk.title.toLowerCase().includes(normalizedSearch) ||
      risk.description.toLowerCase().includes(normalizedSearch)

    const matchesCategory =
      filters.category === 'all' ||
      risk.category.toLowerCase() === filters.category.toLowerCase()

    const matchesThreatType =
      filters.threatType === 'all' || risk.threatType === filters.threatType

    const matchesStatus =
      filters.status === 'all' || risk.status === filters.status

    const severity = getRiskSeverity(risk.riskScore)
    const matchesSeverity =
      filters.severity === 'all' || severity === filters.severity

    const matchesChecklistStatus =
      filters.checklistStatus === 'all' || risk.checklistStatus === filters.checklistStatus

    return (
      matchesSearch &&
      matchesCategory &&
      matchesThreatType &&
      matchesStatus &&
      matchesSeverity &&
      matchesChecklistStatus
    )
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

/**
 * Asynchronously computes risk statistics with potential for heavy computation
 * Uses Web Workers if available for processing large datasets
 */
export const computeRiskStatsAsync = async (risks: Risk[]): Promise<RiskStats> => {
  return new Promise((resolve) => {
    // For large datasets, we could use Web Workers here
    // For now, we'll use setTimeout to simulate async processing
    setTimeout(() => {
      const stats: RiskStats = {
        total: risks.length,
        byStatus: { open: 0, mitigated: 0, closed: 0, accepted: 0 },
        bySeverity: { low: 0, medium: 0, high: 0 },
        averageScore: 0,
        maxScore: 0,
        updatedAt: new Date().toISOString(),
      }

      if (!risks.length) {
        resolve(stats);
        return;
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
      resolve(stats);
    }, 0);
  });
};

/**
 * Processes large datasets asynchronously using Web Workers when available
 * Falls back to synchronous processing if Web Workers are not supported
 */
export const processLargeDatasetAsync = async (dataset: Risk[]): Promise<any> => {
  return new Promise((resolve) => {
    // Check if Web Workers are supported and use them for heavy processing
    if (typeof Worker !== 'undefined') {
      // In a real implementation, we would create and use a Web Worker
      // For now, we'll simulate the async processing
      setTimeout(() => {
        const result = processLargeDatasetSync(dataset);
        resolve(result);
      }, 0);
    } else {
      // Fallback to synchronous processing
      const result = processLargeDatasetSync(dataset);
      resolve(result);
    }
  });
};

/**
 * Synchronous processing of large datasets (fallback implementation)
 */
const processLargeDatasetSync = (dataset: Risk[]): any => {
  const processed = dataset.map(risk => {
    return {
      ...risk,
      processedAt: Date.now(),
      calculatedScore: calculateSimpleScore(risk)
    };
  });

  const sorted = processed.sort((a, b) => b.calculatedScore - a.calculatedScore);

  return {
    processedCount: processed.length,
    sortedResults: sorted,
    summary: {
      highestScore: Math.max(...processed.map(p => p.calculatedScore)),
      lowestScore: Math.min(...processed.map(p => p.calculatedScore)),
      averageScore: processed.reduce((sum, p) => sum + p.calculatedScore, 0) / processed.length
    }
  };
};

/**
 * Helper function for simple score calculation
 */
const calculateSimpleScore = (risk: Risk): number => {
  return calculateRiskScore(risk.probability || 0, risk.impact || 0)
}
