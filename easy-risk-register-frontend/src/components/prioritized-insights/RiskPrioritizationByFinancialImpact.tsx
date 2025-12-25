import React from 'react';
import { Risk } from '../../types/risk';
import { useRiskManagement } from '../../services/riskService';

interface RiskPrioritizationByFinancialImpactProps {
  risks?: Risk[];
}

export const RiskPrioritizationByFinancialImpact: React.FC<RiskPrioritizationByFinancialImpactProps> = ({ 
  risks: propRisks 
}) => {
  const { risks: storeRisks } = useRiskManagement();
  const risks = propRisks || storeRisks;

  // Calculate financial impact priority for each risk
  const risksWithPriority = risks.map(risk => {
    // Calculate priority based on financial impact and risk score
    const financialImpact = risk.financialImpact;
    let priorityScore = risk.riskScore; // Base priority on risk score
    
    if (financialImpact) {
      // Weight financial impact higher - use expected mean as primary factor
      const financialWeight = financialImpact.expectedMean / 1000000; // Normalize to millions
      priorityScore = risk.riskScore * (1 + financialWeight);
    }
    
    return {
      ...risk,
      calculatedPriority: priorityScore
    };
  });

  // Sort by calculated priority (highest first)
  const sortedRisks = [...risksWithPriority].sort((a, b) => b.calculatedPriority - a.calculatedPriority);

  return (
    <div className="bg-surface rounded-xl border border-outline p-6">
      <h3 className="text-xl font-semibold text-text-high mb-4">Risk Prioritization by Financial Impact</h3>
      <p className="text-text-medium mb-4">
        Risks ranked by potential financial impact combined with risk score
      </p>
      
      {sortedRisks.length === 0 ? (
        <p className="text-text-low italic">No risks to display</p>
      ) : (
        <div className="space-y-3">
          {sortedRisks.map((risk, index) => {
            const financialImpact = risk.financialImpact;
            const formattedFinancialImpact = financialImpact 
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: financialImpact.currency || 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(financialImpact.expectedMean)
              : 'Not specified';
            
            return (
              <div 
                key={risk.id} 
                className={`p-4 rounded-lg border ${
                  risk.riskScore >= 15 ? 'border-status-danger/30 bg-status-danger/5' : 
                  risk.riskScore >= 10 ? 'border-status-warning/30 bg-status-warning/5' : 
                  'border-outline bg-surface'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-lg">#{index + 1}</span>
                      <h4 className="font-semibold text-text-high">{risk.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        risk.riskScore >= 15 ? 'bg-status-danger/20 text-status-danger' :
                        risk.riskScore >= 10 ? 'bg-status-warning/20 text-status-warning' :
                        'bg-status-success/20 text-status-success'
                      }`}>
                        Priority: {risk.calculatedPriority.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-text-medium mt-1">{risk.description}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium text-text-medium">Risk Score:</span>{' '}
                        <span className="text-text-high">{risk.riskScore}</span>
                      </div>
                      <div>
                        <span className="font-medium text-text-medium">Financial Impact:</span>{' '}
                        <span className="text-text-high">{formattedFinancialImpact}</span>
                      </div>
                      <div>
                        <span className="font-medium text-text-medium">Category:</span>{' '}
                        <span className="text-text-high">{risk.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};