// src/pages/Dashboard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiskStore } from '../stores/riskStore';
import RiskMatrixVisualization from '../components/risk/RiskMatrixVisualization';
import type { Risk } from '../types';

// Simple SVG-based probability-impact matrix
const RiskMatrix: React.FC<{ risks: Risk[] }> = ({ risks }) => {
  // Group risks by probability and impact
  const matrix = Array(5).fill(null).map(() => Array(5).fill([]) as Risk[][]);
  
  risks.forEach(risk => {
    // Convert probability and impact (1-5) to 0-4 index
    const row = 5 - risk.impact; // Impact on Y-axis (top to bottom: 5 to 1)
    const col = risk.probability - 1; // Probability on X-axis (left to right: 1 to 5)
    
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      matrix[row][col] = [...matrix[row][col], risk];
    }
  });

  // Function to get color based on risk score
  const getRiskColor = (score: number): string => {
    if (score <= 3) return 'bg-green-100 border-green-300'; // Low
    if (score <= 6) return 'bg-yellow-100 border-yellow-300'; // Medium
    return 'bg-red-100 border-red-300'; // High
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Matrix</h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Y-axis labels (Impact) */}
          <div className="flex mb-1">
            <div className="w-12"></div> {/* Empty space for Y-axis labels */}
            <div className="flex-1 grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map(prob => (
                <div key={`prob-header-${prob}`} className="text-center text-xs text-gray-600 py-1">
                  {prob}
                </div>
              ))}
            </div>
          </div>
          
          {/* Matrix with Y-axis labels */}
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((impact, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex">
                <div className="w-12 text-xs text-gray-600 py-2 flex items-center justify-center">
                  {impact}
                </div>
                <div className="flex-1 grid grid-cols-5 gap-1">
                  {matrix[rowIndex].map((risksInCell, colIndex) => (
                    <div 
                      key={`cell-${rowIndex}-${colIndex}`} 
                      className={`h-20 border ${risksInCell.length > 0 ? 'border-gray-300' : 'border-gray-200'} rounded flex flex-wrap p-1`}
                    >
                      {risksInCell.slice(0, 4).map((risk, idx) => (
                        <div 
                          key={`${risk.id}-${idx}`} 
                          className={`w-2 h-2 rounded-full m-0.5 ${getRiskColor(risk.riskScore)}`}
                          title={`${risk.title} (Score: ${risk.riskScore})`}
                        ></div>
                      ))}
                      {risksInCell.length > 4 && (
                        <div className="text-[8px] text-gray-500 self-end">
                          +{risksInCell.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* X-axis labels (Probability) */}
          <div className="flex mt-1">
            <div className="w-12"></div> {/* Empty space for Y-axis labels */}
            <div className="flex-1 grid grid-cols-5 gap-1">
              <div className="text-center text-xs text-gray-600 py-1 col-span-5">
                Probability
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300 mr-2"></div>
          <span>Low Risk (≤3)</span>
          <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300 mr-2 ml-4"></div>
          <span>Medium Risk (4-6)</span>
          <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300 mr-2 ml-4"></div>
          <span>High Risk (≥7)</span>
        </div>
        <div className="mt-1">Impact</div>
      </div>
    </div>
  );
};

type SummaryAccent = 'primary' | 'warning' | 'danger' | 'info';

const summaryAccentStyles: Record<SummaryAccent, { border: string; value: string; iconWrap: string }> = {
  primary: {
    border: 'border-blue-100',
    value: 'text-blue-700',
    iconWrap: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  },
  warning: {
    border: 'border-amber-100',
    value: 'text-amber-600',
    iconWrap: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  },
  danger: {
    border: 'border-rose-100',
    value: 'text-rose-600',
    iconWrap: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
  },
  info: {
    border: 'border-indigo-100',
    value: 'text-indigo-600',
    iconWrap: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100',
  },
};

const RiskSummaryCard: React.FC<{
  title: string;
  value: string | number;
  description: string;
  icon?: React.ReactNode;
  accent?: SummaryAccent;
}> = ({ title, value, description, icon, accent = 'primary' }) => {
  const accentConfig = summaryAccentStyles[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${accentConfig.border}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-90" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className={`mt-3 text-3xl font-semibold leading-tight text-gray-900 ${accentConfig.value}`}>
              {value}
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentConfig.iconWrap}`}>
            {icon || (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M12 6l7 12H5L12 6z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 10v4m0 4h.01" />
              </svg>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const risks = useRiskStore(state => state.risks);

  // Calculate summary metrics
  const totalRisks = risks.length;
  const highRisks = risks.filter(risk => risk.riskScore >= 7).length;
  const mediumRisks = risks.filter(risk => risk.riskScore >= 4 && risk.riskScore <= 6).length;
  const openRisks = risks.filter(risk => risk.status === 'open').length;
  const topCategories = risks.reduce((acc, risk) => {
    acc[risk.category] = (acc[risk.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get the most common category
  let mostCommonCategory = '';
  let mostCommonCount = 0;
  for (const [category, count] of Object.entries(topCategories)) {
    if (count > mostCommonCount) {
      mostCommonCount = count;
      mostCommonCategory = category;
    }
  }

  // No need to define functions here as form is handled in App.tsx
  // The button should navigate to the risk creation page

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage project risks effectively</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-block font-medium shadow-sm transition-colors duration-200 whitespace-nowrap"
        >
          + Create New Risk
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          {
            title: 'Total Risks',
            value: totalRisks,
            description: 'All identified risks in the register',
            accent: 'primary' as SummaryAccent,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.25" strokeWidth={1.6} />
                <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.25" strokeWidth={1.6} />
                <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.25" strokeWidth={1.6} />
                <rect x="14" y="14" width="6.5" height="6.5" rx="1.25" strokeWidth={1.6} />
              </svg>
            ),
          },
          {
            title: 'High Priority',
            value: highRisks,
            description: 'Risks with score 7 or higher',
            accent: 'danger' as SummaryAccent,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.6 18.4 11.2 5.1a1 1 0 011.6 0l7.6 13.3a1 1 0 01-.86 1.5H4.46a1 1 0 01-.86-1.5Z"
                />
                <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" d="M12 10v4m0 4h.01" />
              </svg>
            ),
          },
          {
            title: 'Medium Priority',
            value: mediumRisks,
            description: 'Risks with score 4-6',
            accent: 'warning' as SummaryAccent,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
                <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" d="M8 19v-6" />
                <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" d="M12 19V7" />
                <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" d="M16 19v-4" />
              </svg>
            ),
          },
          {
            title: 'Open Risks',
            value: openRisks,
            description: 'Risks requiring immediate attention',
            accent: 'info' as SummaryAccent,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="7.25" strokeWidth={1.6} />
                <path strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 1.5" />
              </svg>
            ),
          },
        ].map(card => (
          <RiskSummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            accent={card.accent}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Risk Matrix and Additional Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RiskMatrixVisualization risks={risks} />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>High Risk (7-25)</span>
                  <span>{highRisks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: totalRisks ? `${(highRisks / totalRisks) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Medium Risk (4-6)</span>
                  <span>{mediumRisks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: totalRisks ? `${(mediumRisks / totalRisks) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Low Risk (1-3)</span>
                  <span>{totalRisks - highRisks - mediumRisks}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: totalRisks ? `${((totalRisks - highRisks - mediumRisks) / totalRisks) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Category</h3>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-blue-600">{mostCommonCategory || 'None'}</div>
              <div className="text-gray-600 mt-2">
                {mostCommonCount > 0 ? `${mostCommonCount} risks` : 'No risks recorded'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Risks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Risks</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {risks.slice(0, 5).map(risk => (
            <div key={risk.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    risk.riskScore <= 3 ? 'bg-green-100 text-green-800' : 
                    risk.riskScore <= 6 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {risk.riskScore}
                  </span>
                  <span className="text-sm text-gray-500">{risk.category}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {risk.description.substring(0, 100)}{risk.description.length > 100 ? '...' : ''}
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Created: {new Date(risk.creationDate).toLocaleDateString()}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  risk.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  risk.status === 'mitigated' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
          
          {risks.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No risks have been added yet.</p>
            </div>
          )}
        </div>
        
        {risks.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <button
              onClick={() => navigate('/risks')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all risks →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
