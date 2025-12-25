import { RiskData } from '../RiskTranslation/RiskTranslationService';
import { SimulationResult } from '../RiskTranslation/ScenarioModelingService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  recipients: string[];
  tags: string[];
}

export interface CommunicationOptions {
  subject: string;
  body: string;
  recipients: string[];
  attachments?: File[];
  cc?: string[];
  bcc?: string[];
}

export interface CommunicationHistory {
  id: string;
  timestamp: Date;
  subject: string;
  recipients: string[];
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
}

export class ExecutiveCommunicationService {
  private static communicationHistory: CommunicationHistory[] = [];

  /**
   * Generates pre-defined email templates for risk communication
   */
  static generateRiskTemplates(riskData: RiskData): EmailTemplate[] {
    return [
      {
        id: 'executive-summary',
        name: 'Executive Summary',
        subject: `Risk Alert: ${riskData.riskName} - Action Required`,
        body: this.generateExecutiveSummaryEmail(riskData),
        recipients: ['executive@company.com'],
        tags: ['executive', 'urgent']
      },
      {
        id: 'technical-details',
        name: 'Technical Details',
        subject: `Technical Risk Assessment: ${riskData.riskName}`,
        body: this.generateTechnicalEmail(riskData),
        recipients: ['security-team@company.com'],
        tags: ['technical', 'detailed']
      },
      {
        id: 'business-impact',
        name: 'Business Impact',
        subject: `Business Impact Analysis: ${riskData.riskName}`,
        body: this.generateBusinessImpactEmail(riskData),
        recipients: ['business-ops@company.com'],
        tags: ['business', 'impact']
      },
      {
        id: 'mitigation-plan',
        name: 'Mitigation Plan',
        subject: `Mitigation Plan: ${riskData.riskName}`,
        body: this.generateMitigationEmail(riskData),
        recipients: ['risk-team@company.com'],
        tags: ['mitigation', 'action']
      }
    ];
  }

  /**
   * Generates an executive summary email
   */
  static generateExecutiveSummaryEmail(riskData: RiskData): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #d32f2f;">URGENT: Risk Alert - ${riskData.riskName}</h2>
          
          <p>Dear Executive Team,</p>
          
          <p>We are writing to inform you of a critical risk identified in our cybersecurity posture:</p>
          
          <h3>Risk Overview</h3>
          <ul>
            <li><strong>Risk:</strong> ${riskData.riskName}</li>
            <li><strong>Probability:</strong> ${(riskData.probability * 100).toFixed(1)}%</li>
            <li><strong>Financial Impact:</strong> $${riskData.impact.toLocaleString()}</li>
            <li><strong>Risk Score:</strong> ${riskData.riskScore.toFixed(1)}/10</li>
          </ul>
          
          <h3>Business Impact</h3>
          <p>${riskData.businessUnit ? `This risk primarily affects the ${riskData.businessUnit} business unit.` : 'This risk affects multiple business units.'}</p>
          
          <h3>Recommended Action</h3>
          <p>Given the risk score of ${riskData.riskScore.toFixed(1)}, immediate action is required. We recommend prioritizing resources to address this risk within the next 30 days.</p>
          
          <p>For detailed technical information and mitigation strategies, please refer to the attached risk assessment document.</p>
          
          <p>Best regards,<br/>Risk Management Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generates a technical email
   */
  static generateTechnicalEmail(riskData: RiskData): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #1976d2;">Technical Risk Assessment - ${riskData.riskName}</h2>
          
          <p>Hi Security Team,</p>
          
          <p>Technical details for risk assessment:</p>
          
          <h3>Technical Details</h3>
          <ul>
            <li><strong>Risk ID:</strong> ${riskData.riskId}</li>
            <li><strong>Risk Name:</strong> ${riskData.riskName}</li>
            <li><strong>Threat Actor:</strong> ${riskData.threatActor || 'N/A'}</li>
            <li><strong>Vulnerability:</strong> ${riskData.vulnerability || 'N/A'}</li>
            <li><strong>Probability:</strong> ${(riskData.probability * 100).toFixed(1)}%</li>
            <li><strong>Impact:</strong> $${riskData.impact.toLocaleString()}</li>
            <li><strong>Risk Score:</strong> ${riskData.riskScore.toFixed(1)}/10</li>
          </ul>
          
          <h3>Affected Assets</h3>
          <ul>
            ${riskData.affectedAssets?.map(asset => `<li>${asset}</li>`).join('') || '<li>No specific assets identified</li>'}
          </ul>
          
          <h3>Next Steps</h3>
          <p>Review the technical details and assess potential remediation strategies. Coordinate with the risk team for further guidance.</p>
          
          <p>Best regards,<br/>Risk Management Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generates a business impact email
   */
  static generateBusinessImpactEmail(riskData: RiskData): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #388e3c;">Business Impact Analysis - ${riskData.riskName}</h2>
          
          <p>Hello Business Operations Team,</p>
          
          <p>Analysis of potential business impact for identified risk:</p>
          
          <h3>Business Impact Summary</h3>
          <ul>
            <li><strong>Risk:</strong> ${riskData.riskName}</li>
            <li><strong>Estimated Financial Impact:</strong> $${riskData.impact.toLocaleString()}</li>
            <li><strong>Probability:</strong> ${(riskData.probability * 100).toFixed(1)}%</li>
            <li><strong>Expected Loss:</strong> $${(riskData.probability * riskData.impact).toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
            <li><strong>Business Unit:</strong> ${riskData.businessUnit || 'Multiple Units'}</li>
          </ul>
          
          <h3>Operational Impact</h3>
          <p>This risk could potentially affect operational efficiency, customer satisfaction, and regulatory compliance. The estimated financial impact of $${riskData.impact.toLocaleString()} could significantly impact quarterly results if realized.</p>
          
          <h3>Strategic Considerations</h3>
          <p>Consider this risk in the context of strategic planning and budget allocation for the next quarter. This risk should be prioritized in the risk register.</p>
          
          <p>Best regards,<br/>Risk Management Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Generates a mitigation plan email
   */
  static generateMitigationEmail(riskData: RiskData): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #7b1fa2;">Mitigation Plan - ${riskData.riskName}</h2>
          
          <p>Hi Risk Management Team,</p>
          
          <p>Mitigation strategies for the identified risk:</p>
          
          <h3>Risk Details</h3>
          <ul>
            <li><strong>Risk:</strong> ${riskData.riskName}</li>
            <li><strong>Current Risk Score:</strong> ${riskData.riskScore.toFixed(1)}/10</li>
            <li><strong>Probability:</strong> ${(riskData.probability * 100).toFixed(1)}%</li>
            <li><strong>Impact:</strong> $${riskData.impact.toLocaleString()}</li>
          </ul>
          
          <h3>Mitigation Strategies</h3>
          <p>Based on the risk assessment, we recommend the following mitigation strategies:</p>
          
          <ol>
            <li>Implement compensating controls to reduce probability</li>
            <li>Deploy additional monitoring for early detection</li>
            <li>Develop incident response procedures</li>
            <li>Consider risk transfer options (insurance)</li>
            <li>Plan for remediation within 30-60 days</li>
          </ol>
          
          <h3>Cost-Benefit Analysis</h3>
          <p>The cost of implementing these controls should be weighed against the potential $${riskData.impact.toLocaleString()} impact. A detailed cost analysis will follow.</p>
          
          <p>Best regards,<br/>Risk Management Team</p>
        </body>
      </html>
    `;
  }

  /**
   * Simulates sending an email (in a real implementation, this would connect to an email service)
   */
  static async sendEmail(options: CommunicationOptions): Promise<boolean> {
    // In a real implementation, this would use emailjs to send the email
    // For now, we'll simulate the process
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Add to communication history
        const historyItem: CommunicationHistory = {
          id: `comm-${Date.now()}`,
          timestamp: new Date(),
          subject: options.subject,
          recipients: options.recipients,
          status: 'sent'
        };
        
        this.communicationHistory.push(historyItem);
        resolve(true);
      }, 1000); // Simulate network delay
    });
  }

  /**
   * Generates a shareable risk summary for various platforms
   */
  static generateShareableSummary(riskData: RiskData, platform: 'email' | 'slack' | 'teams' | 'linkedin'): string {
    switch (platform) {
      case 'email':
        return this.generateExecutiveSummaryEmail(riskData);
      case 'slack':
        return this.generateSlackMessage(riskData);
      case 'teams':
        return this.generateTeamsMessage(riskData);
      case 'linkedin':
        return this.generateLinkedInPost(riskData);
      default:
        return this.generateExecutiveSummaryEmail(riskData);
    }
  }

  /**
   * Generates a Slack message format
   */
  static generateSlackMessage(riskData: RiskData): string {
    return `🚨 *CRITICAL RISK ALERT* 🚨\n\n*${riskData.riskName}*\nProbability: ${(riskData.probability * 100).toFixed(1)}%\nImpact: $${riskData.impact.toLocaleString()}\nRisk Score: ${riskData.riskScore.toFixed(1)}/10\n\nImmediate attention required from leadership.`;
  }

  /**
   * Generates a Teams message format
   */
  static generateTeamsMessage(riskData: RiskData): string {
    return `**CRITICAL RISK ALERT**\n\n**${riskData.riskName}**\n- Probability: ${(riskData.probability * 100).toFixed(1)}%\n- Impact: $${riskData.impact.toLocaleString()}\n- Risk Score: ${riskData.riskScore.toFixed(1)}/10\n\nPlease review and take necessary action.`;
  }

  /**
   * Generates a LinkedIn post format
   */
  static generateLinkedInPost(riskData: RiskData): string {
    return `📊 Cybersecurity Risk Update: ${riskData.riskName}\n\nOur risk assessment shows a ${(riskData.probability * 100).toFixed(1)}% probability with a potential $${riskData.impact.toLocaleString()} impact. This represents a risk score of ${riskData.riskScore.toFixed(1)}/10.\n\nOrganizations must prioritize cybersecurity risk management to protect against evolving threats. #Cybersecurity #RiskManagement #InfoSec`;
  }

  /**
   * Gets communication history
   */
  static getCommunicationHistory(): CommunicationHistory[] {
    return [...this.communicationHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generates a comprehensive communication plan for a risk
   */
  static generateCommunicationPlan(riskData: RiskData, simulationResults?: SimulationResult[]): { templates: EmailTemplate[], recommendations: string[] } {
    const templates = this.generateRiskTemplates(riskData);
    const recommendations = this.generateCommunicationRecommendations(riskData, simulationResults);
    
    return { templates, recommendations };
  }

  /**
   * Generates communication recommendations based on risk data
   */
  static generateCommunicationRecommendations(riskData: RiskData, simulationResults?: SimulationResult[]): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations based on risk level
    if (riskData.riskScore >= 8) {
      recommendations.push('Send immediate notification to C-level executives');
      recommendations.push('Alert technical teams for immediate remediation planning');
      recommendations.push('Notify business stakeholders of potential impact');
    } else if (riskData.riskScore >= 6) {
      recommendations.push('Notify relevant department heads');
      recommendations.push('Inform technical teams for planning purposes');
      recommendations.push('Update risk register and stakeholders');
    } else {
      recommendations.push('Document in risk register for ongoing monitoring');
      recommendations.push('Include in monthly risk reports');
    }
    
    // Add recommendations based on simulation results
    if (simulationResults && simulationResults.length > 0) {
      const highImpactScenarios = simulationResults.filter(r => r.expectedLoss > riskData.impact * 1.5);
      if (highImpactScenarios.length > 0) {
        recommendations.push('Consider additional communication for high-impact scenarios identified in simulation');
      }
    }
    
    // Add recommendations based on impact
    if (riskData.impact > 1000000) {
      recommendations.push('Consider board-level notification for financial risks over $1M');
      recommendations.push('Engage legal counsel for potential regulatory implications');
    }
    
    return recommendations;
  }
}