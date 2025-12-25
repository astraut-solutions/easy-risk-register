import React, { useState } from 'react';
import { Risk, RiskMitigationStep } from '../../types/risk';
import { useRiskManagement } from '../../services/riskService';

interface ActionableRecommendationsEngineProps {
  risks?: Risk[];
}

export const ActionableRecommendationsEngine: React.FC<ActionableRecommendationsEngineProps> = ({ 
  risks: propRisks 
}) => {
  const { risks: storeRisks, actions } = useRiskManagement();
  const risks = propRisks || storeRisks;

  // Generate recommendations based on risk characteristics
  const generateRecommendations = (risk: Risk): string[] => {
    const recommendations: string[] = [];
    
    // Based on risk category
    switch (risk.category.toLowerCase()) {
      case 'security':
        recommendations.push('Implement multi-factor authentication', 'Conduct penetration testing', 'Review access controls');
        break;
      case 'compliance':
        recommendations.push('Perform compliance audit', 'Update policies and procedures', 'Schedule staff training');
        break;
      case 'operational':
        recommendations.push('Create backup procedures', 'Document operational processes', 'Establish monitoring');
        break;
      case 'financial':
        recommendations.push('Implement financial controls', 'Establish budget monitoring', 'Review financial processes');
        break;
      default:
        recommendations.push('Review risk management procedures', 'Update mitigation plan', 'Assign risk owner');
    }
    
    // Based on risk score
    if (risk.riskScore >= 15) {
      recommendations.push('Escalate to senior management', 'Implement immediate controls', 'Increase monitoring frequency');
    } else if (risk.riskScore >= 10) {
      recommendations.push('Schedule risk review', 'Update mitigation steps', 'Monitor closely');
    }
    
    // Based on threat type
    switch (risk.threatType) {
      case 'phishing':
        recommendations.push('Implement security awareness training', 'Deploy email filtering', 'Conduct phishing simulations');
        break;
      case 'ransomware':
        recommendations.push('Implement backup strategy', 'Deploy endpoint protection', 'Conduct incident response drills');
        break;
      case 'data_breach':
        recommendations.push('Implement data loss prevention', 'Encrypt sensitive data', 'Establish data access logs');
        break;
      case 'vulnerability':
        recommendations.push('Patch management process', 'Vulnerability scanning', 'Security configuration review');
        break;
    }
    
    // Based on status
    if (risk.status === 'open') {
      recommendations.push('Define clear mitigation steps', 'Assign responsible parties', 'Set target completion dates');
    } else if (risk.status === 'accepted') {
      recommendations.push('Document acceptance rationale', 'Schedule periodic review', 'Monitor for changes');
    }
    
    // Add recommendations for risks with due dates approaching
    if (risk.dueDate) {
      const dueDate = new Date(risk.dueDate);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        recommendations.push(`Urgent: Complete by ${dueDate.toLocaleDateString()}`, 'Prioritize resources for this risk');
      } else if (daysUntilDue < 0) {
        recommendations.push(`Overdue: Action required immediately`, 'Escalate to management for missed deadline');
      }
    }
    
    return recommendations;
  };

  // Function to add a recommendation as a mitigation step
  const addRecommendationAsMitigationStep = (riskId: string, recommendation: string) => {
    const newStep: RiskMitigationStep = {
      id: `step-${Date.now()}`,
      description: recommendation,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    
    const existingRisk = risks.find(r => r.id === riskId);
    if (existingRisk) {
      const updatedSteps = [...(existingRisk.mitigationSteps || []), newStep];
      actions.updateRisk(riskId, { mitigationSteps: updatedSteps });
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-outline p-6">
      <h3 className="text-xl font-semibold text-text-high mb-4">Actionable Recommendations Engine</h3>
      <p className="text-text-medium mb-4">
        AI-powered recommendations for risk mitigation based on risk characteristics
      </p>
      
      {risks.length === 0 ? (
        <p className="text-text-low italic">No risks to generate recommendations for</p>
      ) : (
        <div className="space-y-6">
          {risks.map((risk) => {
            const recommendations = generateRecommendations(risk);
            
            return (
              <div 
                key={risk.id} 
                className="border border-outline rounded-lg p-4 bg-surface"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-text-high">{risk.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    risk.riskScore >= 15 ? 'bg-status-danger/20 text-status-danger' :
                    risk.riskScore >= 10 ? 'bg-status-warning/20 text-status-warning' :
                    'bg-status-success/20 text-status-success'
                  }`}>
                    Score: {risk.riskScore}
                  </span>
                </div>
                
                <div className="mt-2">
                  <h5 className="font-medium text-text-medium mb-2">Recommended Actions:</h5>
                  <ul className="space-y-2">
                    {recommendations.slice(0, 5).map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-status-success mr-2">•</span>
                        <span className="flex-1 text-text-high">{rec}</span>
                        <button 
                          onClick={() => addRecommendationAsMitigationStep(risk.id, rec)}
                          className="ml-2 text-sm bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                        >
                          Add to Plan
                        </button>
                      </li>
                    ))}
                  </ul>
                  {recommendations.length > 5 && (
                    <p className="text-text-low text-sm mt-2">
                      + {recommendations.length - 5} more recommendations
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};