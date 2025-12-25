import * as math from 'mathjs';
import { RiskData } from '../RiskTranslation/RiskTranslationService';

export interface SecurityInvestment {
  id: string;
  name: string;
  cost: number; // Annual cost of the investment
  effectiveness: number; // Reduction in risk probability (0-1)
  implementationTime: number; // In months
  lifecycle: number; // In years
}

export interface ROICalculation {
  investment: SecurityInvestment;
  riskReduction: number; // Amount of risk reduced
  costAvoidance: number; // Expected cost avoided due to risk reduction
  netBenefit: number; // Net financial benefit
  roi: number; // Return on investment as a percentage
  paybackPeriod: number; // In years
  breakevenTime: number; // In years
}

export interface RiskMitigationResult {
  originalRisk: RiskData;
  mitigatedRisk: RiskData;
  investment: SecurityInvestment;
  roi: ROICalculation;
}

export class ROIMeasurementService {
  /**
   * Calculates ROI for a security investment
   */
  static calculateROIForInvestment(
    risk: RiskData, 
    investment: SecurityInvestment
  ): ROICalculation {
    // Calculate original expected loss
    const originalExpectedLoss = risk.probability * risk.impact;
    
    // Calculate new probability after investment
    const newProbability = risk.probability * (1 - investment.effectiveness);
    
    // Create new risk data with reduced probability
    const newRisk: RiskData = {
      ...risk,
      probability: newProbability
    };
    
    // Calculate new expected loss
    const newExpectedLoss = newRisk.probability * newRisk.impact;
    
    // Calculate risk reduction
    const riskReduction = originalExpectedLoss - newExpectedLoss;
    
    // Calculate annual cost avoidance
    const annualCostAvoidance = riskReduction;
    
    // Calculate total cost of investment over lifecycle
    const totalInvestmentCost = investment.cost * investment.lifecycle;
    
    // Calculate net benefit
    const netBenefit = (annualCostAvoidance * investment.lifecycle) - totalInvestmentCost;
    
    // Calculate ROI as percentage
    const roi = (netBenefit / totalInvestmentCost) * 100;
    
    // Calculate payback period
    const annualNetBenefit = annualCostAvoidance - investment.cost;
    const paybackPeriod = annualNetBenefit > 0 ? totalInvestmentCost / (annualNetBenefit * investment.lifecycle) : Infinity;
    
    // Calculate breakeven time
    const breakevenTime = annualNetBenefit > 0 ? investment.cost / annualNetBenefit : Infinity;
    
    return {
      investment,
      riskReduction,
      costAvoidance: annualCostAvoidance,
      netBenefit,
      roi,
      paybackPeriod,
      breakevenTime
    };
  }

  /**
   * Calculates ROIs for multiple security investments
   */
  static calculateROIsForInvestments(
    risk: RiskData, 
    investments: SecurityInvestment[]
  ): ROICalculation[] {
    return investments.map(investment => 
      this.calculateROIForInvestment(risk, investment)
    );
  }

  /**
   * Finds the optimal security investment based on ROI
   */
  static findOptimalInvestment(
    risk: RiskData,
    investments: SecurityInvestment[]
  ): ROICalculation | null {
    const rois = this.calculateROIsForInvestments(risk, investments);
    
    // Filter out negative ROI investments
    const positiveROIs = rois.filter(roi => roi.roi > 0);
    
    if (positiveROIs.length === 0) {
      return null;
    }
    
    // Find the investment with the highest ROI
    return positiveROIs.reduce((max, current) => 
      current.roi > max.roi ? current : max
    );
  }

  /**
   * Calculates the combined effect of multiple security investments
   */
  static calculateCombinedROIFromMultipleInvestments(
    risk: RiskData,
    investments: SecurityInvestment[]
  ): ROICalculation {
    // Calculate cumulative effectiveness
    let cumulativeEffectiveness = 0;
    for (const investment of investments) {
      // Apply effectiveness sequentially
      cumulativeEffectiveness = cumulativeEffectiveness + (investment.effectiveness * (1 - cumulativeEffectiveness));
    }
    
    // Create a combined investment object
    const combinedInvestment: SecurityInvestment = {
      id: 'combined',
      name: 'Combined Investments',
      cost: investments.reduce((sum, inv) => sum + inv.cost, 0),
      effectiveness: cumulativeEffectiveness,
      implementationTime: Math.max(...investments.map(inv => inv.implementationTime)),
      lifecycle: Math.min(...investments.map(inv => inv.lifecycle))
    };
    
    return this.calculateROIForInvestment(risk, combinedInvestment);
  }

  /**
   * Generates a risk mitigation plan with ROI analysis
   */
  static generateRiskMitigationPlan(
    risk: RiskData,
    investments: SecurityInvestment[]
  ): RiskMitigationResult[] {
    return investments.map(investment => {
      const roi = this.calculateROIForInvestment(risk, investment);
      
      // Calculate the new risk after applying the investment
      const newProbability = risk.probability * (1 - investment.effectiveness);
      const mitigatedRisk: RiskData = {
        ...risk,
        probability: newProbability,
        riskScore: this.calculateNewRiskScore(risk, newProbability)
      };
      
      return {
        originalRisk: risk,
        mitigatedRisk,
        investment,
        roi
      };
    });
  }

  /**
   * Calculates the new risk score after probability reduction
   */
  static calculateNewRiskScore(originalRisk: RiskData, newProbability: number): number {
    // This is a simplified calculation - in practice, you might have a more complex risk scoring model
    const normalizedImpact = Math.min(originalRisk.impact / 10000000, 1); // Normalize impact to 0-1 scale
    const newRiskScore = (newProbability * 0.4 + normalizedImpact * 0.6) * 10;
    return math.clamp(newRiskScore, 1, 10);
  }

  /**
   * Performs cost-benefit analysis for security investments
   */
  static performCostBenefitAnalysis(
    risk: RiskData,
    investments: SecurityInvestment[]
  ): Array<{ investment: SecurityInvestment, cost: number, benefit: number, net: number, ratio: number }> {
    return investments.map(investment => {
      const originalExpectedLoss = risk.probability * risk.impact;
      const newProbability = risk.probability * (1 - investment.effectiveness);
      const newExpectedLoss = newProbability * risk.impact;
      const benefit = originalExpectedLoss - newExpectedLoss;
      
      // Annual benefit over lifecycle
      const totalBenefit = benefit * investment.lifecycle;
      const totalCost = investment.cost * investment.lifecycle;
      const net = totalBenefit - totalCost;
      const ratio = totalBenefit / totalCost;
      
      return {
        investment,
        cost: totalCost,
        benefit: totalBenefit,
        net,
        ratio
      };
    });
  }

  /**
   * Generates an investment recommendation based on multiple criteria
   */
  static generateInvestmentRecommendation(
    risk: RiskData,
    investments: SecurityInvestment[],
    criteria: 'roi' | 'payback' | 'risk_reduction' = 'roi'
  ): SecurityInvestment | null {
    const rois = this.calculateROIsForInvestments(risk, investments);
    
    if (rois.length === 0) return null;
    
    switch (criteria) {
      case 'roi':
        return rois.reduce((best, current) => 
          current.roi > best.roi ? current.investment : best.investment
        );
      case 'payback':
        return rois.reduce((best, current) => 
          current.paybackPeriod < best.paybackPeriod ? current.investment : best.investment
        );
      case 'risk_reduction':
        return rois.reduce((best, current) => 
          current.riskReduction > best.riskReduction ? current.investment : best.investment
        );
      default:
        return rois[0].investment;
    }
  }

  /**
   * Calculates the required investment effectiveness to achieve a target risk score
   */
  static calculateRequiredEffectivenessForTarget(
    risk: RiskData,
    targetRiskScore: number
  ): { requiredEffectiveness: number, requiredInvestmentCost: number } {
    // Binary search to find the required effectiveness
    let low = 0;
    let high = 1;
    let requiredEffectiveness = 0;
    
    for (let i = 0; i < 20; i++) { // 20 iterations for precision
      const mid = (low + high) / 2;
      const newProbability = risk.probability * (1 - mid);
      const newRiskScore = this.calculateNewRiskScore(risk, newProbability);
      
      if (newRiskScore <= targetRiskScore) {
        requiredEffectiveness = mid;
        high = mid;
      } else {
        low = mid;
      }
    }
    
    // Estimate required investment cost based on effectiveness
    // This is a simplified model - in practice, you might have more complex cost-effectiveness relationships
    const estimatedCost = risk.impact * requiredEffectiveness * 0.1; // 10% of risk impact per effectiveness point
    
    return {
      requiredEffectiveness,
      requiredInvestmentCost: estimatedCost
    };
  }
}