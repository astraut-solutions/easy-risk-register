import * as math from 'mathjs';
import { RiskData } from '../RiskTranslation/RiskTranslationService';

export interface ScenarioData {
  name: string;
  probability: number;
  impact: number;
  riskScore: number;
  variables: Record<string, number>;
}

export interface SimulationResult {
  scenarioName: string;
  expectedLoss: number;
  probability: number;
  impact: number;
  riskScore: number;
  confidenceInterval: [number, number];
  sensitivityAnalysis: Record<string, number>;
}

export class ScenarioModelingService {
  /**
   * Performs Monte Carlo simulation for risk scenarios
   */
  static runMonteCarloSimulation(
    baseRisk: RiskData,
    iterations: number = 10000,
    varianceFactors: Record<string, number> = { probability: 0.1, impact: 0.15 }
  ): SimulationResult[] {
    const results: SimulationResult[] = [];
    
    for (let i = 0; i < iterations; i++) {
      // Generate random values based on variance factors
      const probability = this.addRandomVariance(baseRisk.probability, varianceFactors.probability);
      const impact = this.addRandomVariance(baseRisk.impact, varianceFactors.impact);
      
      // Ensure values stay within bounds
      const boundedProbability = math.clamp(probability, 0, 1);
      const boundedImpact = math.max(impact, 0);
      
      // Calculate risk score (example formula)
      const riskScore = this.calculateRiskScore(boundedProbability, boundedImpact);
      
      results.push({
        scenarioName: `Simulation ${i + 1}`,
        expectedLoss: boundedProbability * boundedImpact,
        probability: boundedProbability,
        impact: boundedImpact,
        riskScore,
        confidenceInterval: [0, 0], // Placeholder
        sensitivityAnalysis: {}
      });
    }
    
    return results;
  }

  /**
   * Adds random variance to a base value
   */
  static addRandomVariance(baseValue: number, varianceFactor: number): number {
    const variance = (Math.random() - 0.5) * 2 * varianceFactor;
    return baseValue * (1 + variance);
  }

  /**
   * Calculates risk score based on probability and impact
   */
  static calculateRiskScore(probability: number, impact: number): number {
    // Normalize impact to 0-1 scale (assuming max impact of 10M for normalization)
    const normalizedImpact = math.min(impact / 10000000, 1);
    
    // Risk score calculation (custom formula)
    const riskScore = (probability * 0.4 + normalizedImpact * 0.6) * 10;
    
    return math.clamp(riskScore, 1, 10);
  }

  /**
   * Performs what-if analysis by changing specific parameters
   */
  static performWhatIfAnalysis(
    baseRisk: RiskData,
    changes: Array<{ parameter: 'probability' | 'impact', newValue: number, description: string }>
  ): SimulationResult[] {
    const results: SimulationResult[] = [];
    
    for (const change of changes) {
      let newProbability = baseRisk.probability;
      let newImpact = baseRisk.impact;
      
      if (change.parameter === 'probability') {
        newProbability = change.newValue;
      } else if (change.parameter === 'impact') {
        newImpact = change.newValue;
      }
      
      const newRiskScore = this.calculateRiskScore(newProbability, newImpact);
      
      results.push({
        scenarioName: change.description,
        expectedLoss: newProbability * newImpact,
        probability: newProbability,
        impact: newImpact,
        riskScore: newRiskScore,
        confidenceInterval: [0, 0], // Placeholder
        sensitivityAnalysis: {}
      });
    }
    
    return results;
  }

  /**
   * Performs sensitivity analysis to see how changes in parameters affect risk
   */
  static performSensitivityAnalysis(
    baseRisk: RiskData,
    parameters: Array<{ name: string, range: [number, number], steps: number }>
  ): SimulationResult[] {
    const results: SimulationResult[] = [];
    
    for (const param of parameters) {
      const [min, max] = param.range;
      const stepSize = (max - min) / param.steps;
      
      for (let i = 0; i <= param.steps; i++) {
        const value = min + (i * stepSize);
        
        // Apply the parameter change to the appropriate field
        let newProbability = baseRisk.probability;
        let newImpact = baseRisk.impact;
        
        if (param.name === 'probability') {
          newProbability = value;
        } else if (param.name === 'impact') {
          newImpact = value;
        }
        
        const newRiskScore = this.calculateRiskScore(newProbability, newImpact);
        
        results.push({
          scenarioName: `${param.name} = ${value.toFixed(2)}`,
          expectedLoss: newProbability * newImpact,
          probability: newProbability,
          impact: newImpact,
          riskScore: newRiskScore,
          confidenceInterval: [0, 0], // Placeholder
          sensitivityAnalysis: { [param.name]: value }
        });
      }
    }
    
    return results;
  }

  /**
   * Calculates confidence intervals for simulation results
   */
  static calculateConfidenceIntervals(results: SimulationResult[], confidenceLevel: number = 0.95): SimulationResult[] {
    // Sort results by expected loss
    const sortedResults = [...results].sort((a, b) => a.expectedLoss - b.expectedLoss);
    
    const n = sortedResults.length;
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor(alpha / 2 * n);
    const upperIndex = Math.floor((1 - alpha / 2) * n);
    
    return results.map(result => {
      return {
        ...result,
        confidenceInterval: [
          sortedResults[lowerIndex]?.expectedLoss || 0,
          sortedResults[upperIndex]?.expectedLoss || 0
        ]
      };
    });
  }

  /**
   * Calculates key risk metrics from simulation results
   */
  static calculateRiskMetrics(results: SimulationResult[]) {
    const expectedLosses = results.map(r => r.expectedLoss);
    const probabilities = results.map(r => r.probability);
    const impacts = results.map(r => r.impact);
    const riskScores = results.map(r => r.riskScore);
    
    return {
      meanExpectedLoss: math.mean(expectedLosses),
      medianExpectedLoss: math.median(expectedLosses),
      stdDevExpectedLoss: math.std(expectedLosses),
      minExpectedLoss: math.min(expectedLosses),
      maxExpectedLoss: math.max(expectedLosses),
      valueAtRisk: this.calculateValueAtRisk(expectedLosses, 0.05), // 5% VaR
      expectedShortfall: this.calculateExpectedShortfall(expectedLosses, 0.05), // Expected shortfall at 5%
      probabilityMetrics: {
        mean: math.mean(probabilities),
        stdDev: math.std(probabilities),
        min: math.min(probabilities),
        max: math.max(probabilities)
      },
      impactMetrics: {
        mean: math.mean(impacts),
        stdDev: math.std(impacts),
        min: math.min(impacts),
        max: math.max(impacts)
      },
      riskScoreMetrics: {
        mean: math.mean(riskScores),
        stdDev: math.std(riskScores),
        min: math.min(riskScores),
        max: math.max(riskScores)
      }
    };
  }

  /**
   * Calculates Value at Risk (VaR)
   */
  static calculateValueAtRisk(data: number[], percentile: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[index] || 0;
  }

  /**
   * Calculates Expected Shortfall
   */
  static calculateExpectedShortfall(data: number[], percentile: number): number {
    const sorted = [...data].sort((a, b) => a - b);
    const thresholdIndex = Math.floor(sorted.length * percentile);
    const shortfallValues = sorted.slice(0, thresholdIndex);
    
    if (shortfallValues.length === 0) return 0;
    
    return math.mean(shortfallValues);
  }

  /**
   * Creates risk scenarios based on threat intelligence
   */
  static createThreatBasedScenarios(baseRisk: RiskData, threatLevel: 'low' | 'medium' | 'high' | 'critical'): SimulationResult[] {
    let probabilityMultiplier = 1;
    let impactMultiplier = 1;
    
    switch (threatLevel) {
      case 'low':
        probabilityMultiplier = 0.8;
        impactMultiplier = 0.9;
        break;
      case 'medium':
        probabilityMultiplier = 1.0;
        impactMultiplier = 1.0;
        break;
      case 'high':
        probabilityMultiplier = 1.3;
        impactMultiplier = 1.2;
        break;
      case 'critical':
        probabilityMultiplier = 1.6;
        impactMultiplier = 1.5;
        break;
    }
    
    const newProbability = math.clamp(baseRisk.probability * probabilityMultiplier, 0, 1);
    const newImpact = baseRisk.impact * impactMultiplier;
    const newRiskScore = this.calculateRiskScore(newProbability, newImpact);
    
    return [{
      scenarioName: `Threat Level: ${threatLevel.charAt(0).toUpperCase() + threatLevel.slice(1)}`,
      expectedLoss: newProbability * newImpact,
      probability: newProbability,
      impact: newImpact,
      riskScore: newRiskScore,
      confidenceInterval: [0, 0], // Placeholder
      sensitivityAnalysis: { threatLevel }
    }];
  }
}