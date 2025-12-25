import React from 'react';
import { Risk } from '../../types/risk';
import { useRiskManagement } from '../../services/riskService';

interface PrioritizedTopActionableInsightsProps {
  risks?: Risk[];
}

export const PrioritizedTopActionableInsights: React.FC<PrioritizedTopActionableInsightsProps> = ({ 
  risks: propRisks 
}) => {
  const { risks: storeRisks } = useRiskManagement();
  const risks = propRisks || storeRisks;

  // Calculate actionable insights based on various factors
  const actionableInsights = risks
    .map(risk => {
      // Calculate an actionability score based on multiple factors
      let actionabilityScore = 0;
      
      // Higher score for higher risk score
      actionabilityScore += risk.riskScore * 2;
      
      // Higher score if financial impact is defined
      if (risk.financialImpact) {
        actionabilityScore += (risk.financialImpact.expectedMean / 100000);
      }
      
      // Higher score if immediate attention is needed
      if (risk.immediateAttention) {
        actionabilityScore += 10;
      }
      
      // Higher score if status is open
      if (risk.status === 'open') {
        actionabilityScore += 5;
      }
      
      // Higher score if due date is approaching or overdue
      if (risk.dueDate) {
        const dueDate = new Date(risk.dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          actionabilityScore += 15; // Approaching deadline
        } else if (daysUntilDue < 0) {
          actionabilityScore += 20; // Overdue
        }
      }
      
      // Higher score if review date is past due
      if (risk.reviewDate) {
        const reviewDate = new Date(risk.reviewDate);
        const now = new Date();
        if (reviewDate < now) {
          actionabilityScore += 8; // Review overdue
        }
      }
      
      // Generate specific insights based on the risk
      const insights = [];
      
      if (risk.riskScore >= 15) {
        insights.push(`High risk score (${risk.riskScore}) requires immediate action`);
      }
      
      if (risk.financialImpact && risk.financialImpact.expectedMean > 100000) {
        insights.push(`High financial impact: ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: risk.financialImpact.currency || 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(risk.financialImpact.expectedMean)}`);
      }
      
      if (risk.status === 'open' && risk.mitigationSteps && risk.mitigationSteps.length === 0) {
        insights.push('No mitigation steps defined - prioritize creating action plan');
      }
      
      if (risk.dueDate) {
        const dueDate = new Date(risk.dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          insights.push(`Due in ${daysUntilDue} days - prioritize completion`);
        } else if (daysUntilDue < 0) {
          insights.push(`Overdue by ${Math.abs(daysUntilDue)} days - immediate action required`);
        }
      }
      
      if (risk.reviewDate) {
        const reviewDate = new Date(risk.reviewDate);
        const now = new Date();
        const daysUntilReview = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilReview <= 0) {
          insights.push(`Review overdue - schedule risk reassessment`);
        } else if (daysUntilReview <= 14) {
          insights.push(`Review due in ${daysUntilReview} days - prepare for reassessment`);
        }
      }
      
      return {
        ...risk,
        actionabilityScore,
        insights
      };
    })
    .filter(item => item.insights.length > 0); // Only include risks with insights

  // Sort by actionability score (highest first)
  const sortedInsights = actionableInsights.sort((a, b) => b.actionabilityScore - a.actionabilityScore);

  return (
    <div className="bg-surface rounded-xl border border-outline p-6">
      <h3 className="text-xl font-semibold text-text-high mb-4">Prioritized Top Actionable Insights</h3>
      <p className="text-text-medium mb-4">
        Top insights prioritized by actionability score and business impact
      </p>
      
      {sortedInsights.length === 0 ? (
        <p className="text-text-low italic">No actionable insights available</p>
      ) : (
        <div className="space-y-4">
          {sortedInsights.slice(0, 10).map((item, index) => (
            <div 
              key={item.id} 
              className={`p-4 rounded-lg border ${
                item.riskScore >= 15 ? 'border-status-danger/30 bg-status-danger/5' : 
                item.riskScore >= 10 ? 'border-status-warning/30 bg-status-warning/5' : 
                'border-outline bg-surface'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">#{index + 1}</span>
                    <h4 className="font-semibold text-text-high">{item.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.riskScore >= 15 ? 'bg-status-danger/20 text-status-danger' :
                      item.riskScore >= 10 ? 'bg-status-warning/20 text-status-warning' :
                      'bg-status-success/20 text-status-success'
                    }`}>
                      Score: {item.actionabilityScore.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-text-medium mt-1">{item.description}</p>
                  
                  <div className="mt-3">
                    <h5 className="font-medium text-text-medium mb-2">Actionable Insights:</h5>
                    <ul className="space-y-1">
                      {item.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-status-success mr-2">•</span>
                          <span className="text-text-high">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {sortedInsights.length > 10 && (
            <div className="text-center pt-4">
              <p className="text-text-medium">
                + {sortedInsights.length - 10} more actionable insights
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};