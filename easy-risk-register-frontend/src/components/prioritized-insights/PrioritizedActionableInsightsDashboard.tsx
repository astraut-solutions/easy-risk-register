import React from 'react';
import { RiskPrioritizationByFinancialImpact } from './RiskPrioritizationByFinancialImpact';
import { ImmediateAttentionAlerts } from './ImmediateAttentionAlerts';
import { ActionableRecommendationsEngine } from './ActionableRecommendationsEngine';
import { PrioritizedTopActionableInsights } from './PrioritizedTopActionableInsights';

interface PrioritizedActionableInsightsDashboardProps {
  className?: string;
}

export const PrioritizedActionableInsightsDashboard: React.FC<PrioritizedActionableInsightsDashboardProps> = ({
  className = ''
}) => {
  return (
    <div data-testid="prioritized-insights-container" className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <ImmediateAttentionAlerts />
        </div>
        <div>
          <RiskPrioritizationByFinancialImpact />
        </div>
        <div>
          <PrioritizedTopActionableInsights />
        </div>
      </div>
      <div>
        <ActionableRecommendationsEngine />
      </div>
    </div>
  );
};