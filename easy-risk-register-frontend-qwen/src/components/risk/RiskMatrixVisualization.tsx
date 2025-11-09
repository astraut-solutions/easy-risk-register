// src/components/risk/RiskMatrixVisualization.tsx
import React from 'react';
import type { Risk } from '../../types';
import { getRiskColor } from '../../services/riskService';

interface RiskMatrixVisualizationProps {
  risks: Risk[];
  title?: string;
  className?: string;
}

const RiskMatrixVisualization: React.FC<RiskMatrixVisualizationProps> = ({ 
  risks, 
  title = 'Risk Matrix',
  className = '' 
}) => {
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
  const getRiskCellColor = (score: number): string => {
    if (score <= 3) return 'bg-green-100 border-green-300'; // Low
    if (score <= 6) return 'bg-yellow-100 border-yellow-300'; // Medium
    return 'bg-red-100 border-red-300'; // High
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
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
                          className={`w-2 h-2 rounded-full m-0.5 ${getRiskCellColor(risk.riskScore)}`}
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

export default RiskMatrixVisualization;