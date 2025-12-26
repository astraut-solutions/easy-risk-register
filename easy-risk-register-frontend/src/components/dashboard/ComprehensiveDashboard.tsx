import React, { useState } from 'react';
import ExecutiveDashboard from './ExecutiveOverviewDashboard';
import RiskScenarioView from './RiskScenarioView';
import FinancialImpactCharts from './FinancialImpactCharts';
import ActionCenter from './ActionCenter';
import TrendAnalysis from './TrendAnalysis';
import type { Risk } from '../../types/risk';
import type { RiskScoreSnapshot, TrendDefaultMode } from '../../types/visualization';

interface RiskFilters {
  // Define the filters interface based on the existing application
  [key: string]: any;
}

interface ComprehensiveDashboardProps {
  risks: Risk[];
  snapshots: RiskScoreSnapshot[];
  filters?: RiskFilters;
  matrixFilterLabel?: string;
  historyEnabled?: boolean;
  defaultTrendMode?: TrendDefaultMode;
  onDrillDown?: (target: { filters: Partial<RiskFilters>; label: string }) => void;
}

const ComprehensiveDashboard: React.FC<ComprehensiveDashboardProps> = ({
  risks,
  snapshots,
  onDrillDown = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('executive');

  const tabs = [
    { id: 'executive', label: 'Executive Dashboard' },
    { id: 'scenarios', label: 'Risk Scenarios' },
    { id: 'financial', label: 'Financial Impact' },
    { id: 'actions', label: 'Action Center' },
    { id: 'trends', label: 'Trend Analysis' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveDashboard
          risks={risks}
          snapshots={snapshots}
          onDrillDown={onDrillDown}
        />;
      case 'scenarios':
        return <RiskScenarioView risks={risks} />;
      case 'financial':
        return <FinancialImpactCharts risks={risks} />;
      case 'actions':
        return <ActionCenter risks={risks} />;
      case 'trends':
        return <TrendAnalysis risks={risks} snapshots={snapshots} />;
      default:
        return <ExecutiveDashboard
          risks={risks}
          snapshots={snapshots}
          onDrillDown={onDrillDown}
        />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;
