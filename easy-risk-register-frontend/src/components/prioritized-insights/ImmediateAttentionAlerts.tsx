import React from 'react';
import { Risk } from '../../types/risk';
import { useRiskManagement } from '../../services/riskService';

interface ImmediateAttentionAlertsProps {
  risks?: Risk[];
}

export const ImmediateAttentionAlerts: React.FC<ImmediateAttentionAlertsProps> = ({ 
  risks: propRisks 
}) => {
  const { risks: storeRisks } = useRiskManagement();
  const risks = propRisks || storeRisks;

  // Filter risks that require immediate attention
  const immediateAttentionRisks = risks.filter(risk => {
    // Criteria for immediate attention:
    // 1. Explicitly marked as immediate attention
    // 2. High risk score (>= 15)
    // 3. Due date is approaching (within 7 days) and status is open
    // 4. Review date is past due
    const now = new Date();
    const dueDate = risk.dueDate ? new Date(risk.dueDate) : null;
    const reviewDate = risk.reviewDate ? new Date(risk.reviewDate) : null;
    
    return risk.immediateAttention || 
           risk.riskScore >= 15 || 
           (risk.status === 'open' && dueDate && dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) ||
           (reviewDate && reviewDate < now);
  });

  return (
    <div className="bg-surface rounded-xl border border-outline p-6">
      <h3 className="text-xl font-semibold text-text-high mb-4">Immediate Attention Alerts</h3>
      <p className="text-text-medium mb-4">
        Risks requiring immediate attention based on severity, due dates, and status
      </p>
      
      {immediateAttentionRisks.length === 0 ? (
        <div className="bg-status-success/10 border border-status-success/30 rounded-lg p-4">
          <p className="text-status-success font-medium">No immediate attention risks detected</p>
          <p className="text-text-medium text-sm mt-1">All risks are within acceptable timeframes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {immediateAttentionRisks.map((risk) => {
            // Determine the reason for immediate attention
            const reasons = [];
            if (risk.immediateAttention) reasons.push('Explicitly marked');
            if (risk.riskScore >= 15) reasons.push('High risk score');
            if (risk.status === 'open' && risk.dueDate) {
              const dueDate = new Date(risk.dueDate);
              const now = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysUntilDue <= 7 && daysUntilDue >= 0) {
                reasons.push(`Due in ${daysUntilDue} days`);
              } else if (daysUntilDue < 0) {
                reasons.push(`Overdue by ${Math.abs(daysUntilDue)} days`);
              }
            }
            if (risk.reviewDate) {
              const reviewDate = new Date(risk.reviewDate);
              const now = new Date();
              if (reviewDate < now) {
                reasons.push('Review overdue');
              }
            }
            
            return (
              <div 
                key={risk.id} 
                className="p-4 rounded-lg border border-status-danger/30 bg-status-danger/5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-text-high">{risk.title}</h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-status-danger/20 text-status-danger">
                        Immediate Attention
                      </span>
                    </div>
                    <p className="text-text-medium mt-1">{risk.e2eeLocked ? 'Encrypted (locked)' : risk.description}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="font-medium text-text-medium">Risk Score:</span>{' '}
                        <span className="text-text-high">{risk.riskScore}</span>
                      </div>
                      <div>
                        <span className="font-medium text-text-medium">Category:</span>{' '}
                        <span className="text-text-high">{risk.category}</span>
                      </div>
                      <div>
                        <span className="font-medium text-text-medium">Owner:</span>{' '}
                        <span className="text-text-high">{risk.owner}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="font-medium text-text-medium">Reasons:</span>{' '}
                      <span className="text-status-danger">{reasons.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {risk.dueDate && (
                      <span className="text-sm text-text-medium">
                        Due: {new Date(risk.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {risk.reviewDate && (
                      <span className="text-sm text-text-medium mt-1">
                        Review: {new Date(risk.reviewDate).toLocaleDateString()}
                      </span>
                    )}
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
