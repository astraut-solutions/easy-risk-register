import natural from 'natural';
import * as math from 'mathjs';

// Types for risk data
export interface RiskData {
  riskId: string;
  riskName: string;
  probability: number; // 0-1
  impact: number; // Financial impact in dollars
  riskScore: number; // 1-10 scale
  threatActor?: string;
  vulnerability?: string;
  affectedAssets?: string[];
  businessUnit?: string;
}

// Business impact levels
export enum ImpactLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export class RiskTranslationService {
  /**
   * Translates technical risk data into business-friendly language
   */
  static translateRiskToBusinessLanguage(risk: RiskData): string {
    const impactLevel = this.getImpactLevel(risk.impact);
    const probabilityLevel = this.getProbabilityLevel(risk.probability);
    const riskLevel = this.getRiskLevel(risk.riskScore);
    
    // Generate natural language description
    let description = `Risk "${risk.riskName}" has been assessed as a ${riskLevel} risk level with ${probabilityLevel} likelihood of occurrence and ${impactLevel} business impact.`;
    
    if (risk.threatActor) {
      description += ` The primary threat actor is ${risk.threatActor}.`;
    }
    
    if (risk.vulnerability) {
      description += ` The main vulnerability exploited is ${risk.vulnerability}.`;
    }
    
    if (risk.businessUnit) {
      description += ` This risk primarily affects the ${risk.businessUnit} business unit.`;
    }
    
    description += ` The estimated financial impact is $${this.formatCurrency(risk.impact)}.`;
    
    // Add business consequence
    const consequence = this.generateBusinessConsequence(risk);
    description += ` ${consequence}`;
    
    return description;
  }

  /**
   * Generates business consequences based on risk data
   */
  static generateBusinessConsequence(risk: RiskData): string {
    const impactLevel = this.getImpactLevel(risk.impact);
    const probabilityLevel = this.getProbabilityLevel(risk.probability);
    
    if (risk.riskScore >= 8) {
      return 'This risk poses a significant threat to business operations and requires immediate attention from leadership.';
    } else if (risk.riskScore >= 6) {
      return 'This risk could impact business operations and should be addressed in the next planning cycle.';
    } else if (risk.riskScore >= 4) {
      return 'This risk presents a moderate concern that should be monitored and addressed as part of routine risk management.';
    } else {
      return 'This risk presents a low concern for business operations but should remain on the risk register for monitoring.';
    }
  }

  /**
   * Translates risk data into executive summary format
   */
  static generateExecutiveSummary(risks: RiskData[]): string {
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(r => r.riskScore >= 8).length;
    const highRisks = risks.filter(r => r.riskScore >= 6 && r.riskScore < 8).length;
    const mediumRisks = risks.filter(r => r.riskScore >= 4 && r.riskScore < 6).length;
    const lowRisks = risks.filter(r => r.riskScore < 4).length;
    
    const totalPotentialImpact = risks.reduce((sum, risk) => sum + risk.impact, 0);
    
    let summary = `Executive Risk Summary: `;
    summary += `There are ${totalRisks} identified risks with a total potential financial impact of $${this.formatCurrency(totalPotentialImpact)}. `;
    summary += `Of these, ${criticalRisks} are classified as critical, ${highRisks} as high, ${mediumRisks} as medium, and ${lowRisks} as low priority. `;
    
    if (criticalRisks > 0) {
      summary += `Critical risks require immediate executive attention and resource allocation. `;
    }
    
    if (highRisks > 0) {
      summary += `High priority risks should be addressed within the next quarter. `;
    }
    
    summary += `The top risk by financial impact is ${this.getTopRiskByImpact(risks)?.riskName || 'N/A'}.`;
    
    return summary;
  }

  /**
   * Gets the top risk by financial impact
   */
  static getTopRiskByImpact(risks: RiskData[]): RiskData | undefined {
    return risks.reduce((max, risk) => risk.impact > max.impact ? risk : max, risks[0]);
  }

  /**
   * Determines impact level based on financial impact
   */
  static getImpactLevel(impact: number): ImpactLevel {
    if (impact >= 1000000) return ImpactLevel.CRITICAL;
    if (impact >= 100000) return ImpactLevel.HIGH;
    if (impact >= 10000) return ImpactLevel.MEDIUM;
    return ImpactLevel.LOW;
  }

  /**
   * Determines probability level
   */
  static getProbabilityLevel(probability: number): string {
    if (probability >= 0.7) return 'High';
    if (probability >= 0.4) return 'Medium';
    if (probability >= 0.1) return 'Low';
    return 'Very Low';
  }

  /**
   * Determines risk level based on score
   */
  static getRiskLevel(score: number): string {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }

  /**
   * Formats currency values
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Generates risk narratives for different stakeholder groups
   */
  static generateStakeholderNarrative(risk: RiskData, stakeholder: 'executive' | 'technical' | 'business'): string {
    switch (stakeholder) {
      case 'executive':
        return this.translateRiskToBusinessLanguage(risk);
      case 'technical':
        return `Risk ID: ${risk.riskId}. Technical assessment shows probability of ${Math.round(risk.probability * 100)}% and impact of ${risk.impact}. Risk score: ${risk.riskScore}/10. Vulnerability: ${risk.vulnerability || 'N/A'}.`;
      case 'business':
        return `Business Impact: ${this.translateRiskToBusinessLanguage(risk)}. Recommended action: ${this.generateRecommendedAction(risk)}.`;
      default:
        return this.translateRiskToBusinessLanguage(risk);
    }
  }

  /**
   * Generates recommended actions based on risk profile
   */
  static generateRecommendedAction(risk: RiskData): string {
    if (risk.riskScore >= 8) {
      return 'Immediate remediation required. Consider implementing compensating controls while developing a permanent solution.';
    } else if (risk.riskScore >= 6) {
      return 'Plan remediation within 30-60 days. Evaluate risk acceptance vs. mitigation cost.';
    } else if (risk.riskScore >= 4) {
      return 'Monitor and plan for remediation within 90 days. Consider risk acceptance if cost is prohibitive.';
    } else {
      return 'Continue monitoring. Reassess annually or when threat landscape changes.';
    }
  }

  /**
   * Calculates expected loss based on probability and impact
   */
  static calculateExpectedLoss(probability: number, impact: number): number {
    return probability * impact;
  }

  /**
   * Generates risk trend narrative
   */
  static generateRiskTrendNarrative(currentRisk: RiskData, previousRisk?: RiskData): string {
    if (!previousRisk) {
      return `Initial risk assessment for "${currentRisk.riskName}". Risk level: ${this.getRiskLevel(currentRisk.riskScore)}.`;
    }

    const riskChange = currentRisk.riskScore - previousRisk.riskScore;
    const impactChange = currentRisk.impact - previousRisk.impact;
    const probabilityChange = currentRisk.probability - previousRisk.probability;

    let narrative = `Risk "${currentRisk.riskName}" has `;
    
    if (riskChange > 0.5) {
      narrative += 'increased significantly ';
    } else if (riskChange > 0.1) {
      narrative += 'increased slightly ';
    } else if (riskChange < -0.5) {
      narrative += 'decreased significantly ';
    } else if (riskChange < -0.1) {
      narrative += 'decreased slightly ';
    } else {
      narrative += 'remained stable ';
    }
    
    narrative += `from ${previousRisk.riskScore.toFixed(1)} to ${currentRisk.riskScore.toFixed(1)} on the risk scale. `;
    
    if (impactChange > 0) {
      narrative += `Financial impact has increased by ${this.formatCurrency(impactChange)} to ${this.formatCurrency(currentRisk.impact)}. `;
    } else if (impactChange < 0) {
      narrative += `Financial impact has decreased by ${this.formatCurrency(Math.abs(impactChange))} to ${this.formatCurrency(currentRisk.impact)}. `;
    }
    
    if (probabilityChange > 0.1) {
      narrative += `Probability of occurrence has increased by ${(probabilityChange * 100).toFixed(1)}%. `;
    } else if (probabilityChange < -0.1) {
      narrative += `Probability of occurrence has decreased by ${(Math.abs(probabilityChange) * 100).toFixed(1)}%. `;
    }
    
    return narrative;
  }
}