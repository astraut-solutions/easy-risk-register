import type { Risk } from '../types/risk';

/**
 * Advanced risk scoring system based on industry best practices
 * Implements a SAFE Score-like system with multiple risk factors
 */

export interface RiskFactorWeights {
  probability: number;
  impact: number;
  assetValue: number;
  threatLevel: number;
  vulnerability: number;
  controls: number;
  businessContext: number;
}

export interface AdvancedRiskScore {
  baseScore: number; // Standard probability * impact
  adjustedScore: number; // With additional factors
  confidence: number; // Confidence in the score (0-1)
  factors: RiskFactorWeights;
  subScores: {
    likelihood: number;
    consequence: number;
    exposure: number;
  };
}

export interface ScenarioRiskScore {
  scenario: string;
  score: number;
  description: string;
}

export interface RiskPostureMetrics {
  overallRiskScore: number;
  riskTrend: 'increasing' | 'decreasing' | 'stable';
  riskVelocity: number; // Rate of risk change
  riskExposure: number; // Current exposure level
  riskCapacity: number; // Organization's risk tolerance
  riskGap: number; // Difference between exposure and capacity
}

// Default weights for the advanced risk scoring
export const DEFAULT_RISK_FACTOR_WEIGHTS: RiskFactorWeights = {
  probability: 0.3,
  impact: 0.3,
  assetValue: 0.1,
  threatLevel: 0.1,
  vulnerability: 0.1,
  controls: 0.05,
  businessContext: 0.05,
};

/**
 * Calculates an advanced risk score based on multiple factors
 * @param risk - The risk object to score
 * @param weights - Optional custom weights for different factors
 * @returns Advanced risk score with detailed breakdown
 */
export const calculateAdvancedRiskScore = (
  risk: Risk,
  weights: RiskFactorWeights = DEFAULT_RISK_FACTOR_WEIGHTS
): AdvancedRiskScore => {
  // Normalize inputs to 0-1 scale
  const normalizedProbability = Math.min(Math.max(risk.probability, 1), 5) / 5;
  const normalizedImpact = Math.min(Math.max(risk.impact, 1), 5) / 5;
  
  // Base score is probability * impact (standard approach)
  const baseScore = risk.probability * risk.impact;
  
  // Calculate sub-scores
  const likelihoodScore = normalizedProbability * 10; // Scale to 0-10
  const consequenceScore = normalizedImpact * 10; // Scale to 0-10
  
  // Calculate exposure based on additional factors
  // These would typically come from additional risk assessment data
  const assetValueFactor = 0.5; // Placeholder - would come from asset valuation
  const threatLevelFactor = 0.5; // Placeholder - would come from threat intelligence
  const vulnerabilityFactor = 0.5; // Placeholder - would come from vulnerability assessments
  const controlFactor = 0.5; // Placeholder - would come from control effectiveness
  const businessContextFactor = 0.5; // Placeholder - would come from business context
  
  // Weighted calculation
  const weightedProbability = normalizedProbability * weights.probability * 10;
  const weightedImpact = normalizedImpact * weights.impact * 10;
  const weightedAssetValue = assetValueFactor * weights.assetValue * 10;
  const weightedThreatLevel = threatLevelFactor * weights.threatLevel * 10;
  const weightedVulnerability = vulnerabilityFactor * weights.vulnerability * 10;
  const weightedControls = (1 - controlFactor) * weights.controls * 10; // Inverse: better controls = lower risk
  const weightedBusinessContext = businessContextFactor * weights.businessContext * 10;
  
  const adjustedScore = 
    weightedProbability + 
    weightedImpact + 
    weightedAssetValue + 
    weightedThreatLevel + 
    weightedVulnerability + 
    weightedControls + 
    weightedBusinessContext;
  
  // Confidence calculation (simplified)
  // In a real system, this would be based on data quality, expert assessment, etc.
  const confidence = 0.8; // Placeholder confidence value
  
  return {
    baseScore,
    adjustedScore: Math.min(Math.max(adjustedScore, 1), 25), // Clamp to 1-25 range
    confidence,
    factors: weights,
    subScores: {
      likelihood: likelihoodScore,
      consequence: consequenceScore,
      exposure: adjustedScore - (weightedProbability + weightedImpact), // Additional exposure beyond base
    }
  };
};

/**
 * Calculates breach likelihood probability based on threat and vulnerability factors
 * @param threatLevel - Threat level (1-5)
 * @param vulnerabilityLevel - Vulnerability level (1-5)
 * @param controlsEffectiveness - Controls effectiveness (1-5, where 5 is highly effective)
 * @returns Breach likelihood as a probability (0-1)
 */
export const calculateBreachLikelihood = (
  threatLevel: number = 3,
  vulnerabilityLevel: number = 3,
  controlsEffectiveness: number = 3
): number => {
  // Normalize inputs
  const normalizedThreat = Math.min(Math.max(threatLevel, 1), 5) / 5;
  const normalizedVulnerability = Math.min(Math.max(vulnerabilityLevel, 1), 5) / 5;
  const normalizedControls = Math.min(Math.max(controlsEffectiveness, 1), 5) / 5;
  
  // Calculate base likelihood
  const baseLikelihood = normalizedThreat * normalizedVulnerability;
  
  // Apply controls mitigation (inverse relationship)
  const controlsFactor = 1 - (normalizedControls * 0.7); // Controls can reduce likelihood by up to 70%
  
  const finalLikelihood = baseLikelihood * controlsFactor;
  
  // Ensure the result is between 0 and 1
  return Math.min(Math.max(finalLikelihood, 0), 1);
};

/**
 * Calculates risk scores for specific scenarios
 * @param risk - Base risk object
 * @param scenarioWeights - Custom weights for specific scenarios
 * @returns Array of scenario-based risk scores
 */
export const calculateScenarioScores = (
  risk: Risk,
  _scenarioWeights?: Partial<Record<string, RiskFactorWeights>>
): ScenarioRiskScore[] => {
  const scenarios: ScenarioRiskScore[] = [
    {
      scenario: 'ransomware',
      score: calculateAdvancedRiskScore(risk, {
        ...DEFAULT_RISK_FACTOR_WEIGHTS,
        threatLevel: 0.2, // Higher weight for threat in ransomware scenario
        vulnerability: 0.15, // Higher weight for vulnerability in ransomware scenario
        controls: 0.1, // Higher weight for controls in ransomware scenario
      }).adjustedScore,
      description: 'Ransomware attack scenario with enhanced threat modeling'
    },
    {
      scenario: 'data-compromise',
      score: calculateAdvancedRiskScore(risk, {
        ...DEFAULT_RISK_FACTOR_WEIGHTS,
        impact: 0.35, // Higher weight for impact in data compromise
        assetValue: 0.15, // Higher weight for asset value in data compromise
        controls: 0.1, // Higher weight for controls in data compromise
      }).adjustedScore,
      description: 'Data compromise scenario focusing on information assets'
    },
    {
      scenario: 'insider-threat',
      score: calculateAdvancedRiskScore(risk, {
        ...DEFAULT_RISK_FACTOR_WEIGHTS,
        probability: 0.25, // Higher weight for probability in insider threat
        vulnerability: 0.2, // Higher weight for vulnerability in insider threat
        controls: 0.15, // Higher weight for controls in insider threat
      }).adjustedScore,
      description: 'Insider threat scenario with different probability factors'
    },
    {
      scenario: 'supply-chain',
      score: calculateAdvancedRiskScore(risk, {
        ...DEFAULT_RISK_FACTOR_WEIGHTS,
        threatLevel: 0.15, // Higher weight for threat in supply chain
        vulnerability: 0.2, // Higher weight for vulnerability in supply chain
        businessContext: 0.15, // Higher weight for business context in supply chain
      }).adjustedScore,
      description: 'Supply chain risk scenario with business context emphasis'
    }
  ];
  
  return scenarios;
};

/**
 * Calculates real-time risk posture metrics
 * @param risks - Array of all risks in the system
 * @param historicalScores - Historical risk scores for trend analysis
 * @returns Risk posture metrics
 */
export const calculateRiskPosture = (
  risks: Risk[],
  historicalScores?: { timestamp: number; score: number }[]
): RiskPostureMetrics => {
  if (risks.length === 0) {
    return {
      overallRiskScore: 0,
      riskTrend: 'stable',
      riskVelocity: 0,
      riskExposure: 0,
      riskCapacity: 10, // Default risk capacity
      riskGap: -10,
    };
  }
  
  // Calculate current overall risk score (average of all risk scores)
  const totalRiskScore = risks.reduce((sum, risk) => sum + risk.riskScore, 0);
  const averageRiskScore = totalRiskScore / risks.length;
  
  // Calculate risk exposure (sum of all risk scores)
  const riskExposure = risks.reduce((sum, risk) => sum + risk.riskScore, 0);
  
  // Determine risk trend if historical data is available
  let riskTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let riskVelocity = 0;
  
  if (historicalScores && historicalScores.length > 1) {
    // Calculate the trend based on the most recent scores
    const recentScores = [...historicalScores].sort((a, b) => a.timestamp - b.timestamp);
    if (recentScores.length >= 2) {
      const firstScore = recentScores[0].score;
      const lastScore = recentScores[recentScores.length - 1].score;
      riskVelocity = lastScore - firstScore;
      
      if (riskVelocity > 0.5) {
        riskTrend = 'increasing';
      } else if (riskVelocity < -0.5) {
        riskTrend = 'decreasing';
      }
    }
  }
  
  // Placeholder risk capacity (in a real system, this would come from business parameters)
  const riskCapacity = 15; // This would be set based on organizational risk appetite
  
  // Calculate risk gap (difference between exposure and capacity)
  const riskGap = riskExposure - riskCapacity;
  
  return {
    overallRiskScore: averageRiskScore,
    riskTrend,
    riskVelocity,
    riskExposure,
    riskCapacity,
    riskGap,
  };
};

/**
 * Calculates a dynamic SAFE-like score with time-based adjustments
 * @param risk - The risk to score
 * @param timeFactor - Factor representing how risk changes over time
 * @returns Dynamic risk score
 */
export const calculateDynamicSafeScore = (
  risk: Risk,
  timeFactor: number = 1.0 // 1.0 = no time adjustment, >1.0 = increased risk over time
): number => {
  // Base score is probability * impact
  const baseScore = risk.probability * risk.impact;
  
  // Apply time factor to account for changing conditions
  // This could represent increasing threat landscape, aging controls, etc.
  const timeAdjustedScore = baseScore * timeFactor;
  
  // Apply additional factors that might change over time
  // For example, business impact might increase as data/asset value grows
  const businessValueGrowthFactor = 1.05; // 5% annual growth in asset value
  const adjustedScore = timeAdjustedScore * businessValueGrowthFactor;
  
  // Ensure score is within reasonable bounds (1-25)
  return Math.min(Math.max(adjustedScore, 1), 25);
};
