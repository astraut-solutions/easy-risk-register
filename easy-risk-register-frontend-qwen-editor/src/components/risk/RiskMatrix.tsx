// src/components/risk/RiskMatrix.tsx
import React from 'react';
import { Risk } from '../../types/index.ts';
import { getRiskColor } from '../../utils/calculations.ts';

interface RiskMatrixProps {
  risks: Risk[];
  onRiskSelect?: (risk: Risk) => void;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, onRiskSelect }) => {
  // Group risks by probability and impact
  const riskMatrix: { [key: string]: Risk[] } = {};
  
  // Initialize the matrix with empty arrays
  for (let prob = 1; prob <= 5; prob++) {
    for (let imp = 1; imp <= 5; imp++) {
      riskMatrix[`${prob}-${imp}`] = [];
    }
  }
  
  // Populate the matrix with risks
  risks.forEach((risk: Risk) => {
    const key = `${risk.probability}-${risk.impact}`;
    if (riskMatrix[key]) {
      riskMatrix[key].push(risk);
    }
  });

  const getCellColor = (probability: number, impact: number): string => {
    const score = probability * impact;
    if (score <= 3) return 'bg-green-100';
    if (score <= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getCellBorderColor = (probability: number, impact: number): string => {
    const score = probability * impact;
    if (score <= 3) return 'border-green-300';
    if (score <= 6) return 'border-yellow-300';
    return 'border-red-300';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Matrix</h2>
      <p className="text-gray-600 mb-6">Visualize risks based on their probability and impact</p>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          {/* Impact labels */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            <div className="flex-1 flex">
              {[1, 2, 3, 4, 5].map((impact: number) => (
                <div key={`impact-${impact}`} className="flex-1 text-center text-sm font-medium text-gray-700">
                  {impact}
                </div>
              ))}
            </div>
          </div>
          
          {/* Matrix grid */}
          <div className="border border-gray-300 rounded">
            {[5, 4, 3, 2, 1].map((probability: number) => (
              <div key={`row-${probability}`} className="flex border-b border-gray-300 last:border-b-0">
                {/* Probability label */}
                <div className="w-16 flex items-center justify-center text-sm font-medium text-gray-700 border-r border-gray-300 py-3">
                  {probability}
                </div>
                
                {/* Matrix cells */}
                {[1, 2, 3, 4, 5].map((impact: number) => {
                  const cellRisks = riskMatrix[`${probability}-${impact}`] || [];
                  return (
                    <div 
                      key={`cell-${probability}-${impact}`}
                      className={`flex-1 min-h-20 p-2 border-r border-gray-300 last:border-r-0 flex items-center justify-center
                        ${getCellColor(probability, impact)} ${getCellBorderColor(probability, impact)}
                        ${cellRisks.length > 0 ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                      onClick={() => {
                        if (cellRisks.length > 0 && onRiskSelect) {
                          onRiskSelect(cellRisks[0]); // Select the first risk in the cell
                        }
                      }}
                    >
                      {cellRisks.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1">
                          {cellRisks.slice(0, 4).map((risk: Risk) => {
                            const colorClass = getRiskColor(risk.riskScore);
                            let color = '';
                            
                            switch (colorClass) {
                              case 'green': color = 'bg-green-500'; break;
                              case 'yellow': color = 'bg-yellow-500'; break;
                              case 'red': color = 'bg-red-500'; break;
                              default: color = 'bg-gray-500';
                            }
                            
                            return (
                              <div 
                                key={risk.id}
                                className={`${color} w-4 h-4 rounded-full border border-white`}
                                title={`${risk.title} (Score: ${risk.riskScore})`}
                              ></div>
                            );
                          })}
                          {cellRisks.length > 4 && (
                            <div className="text-xs font-bold">+{cellRisks.length - 4}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Axis labels */}
          <div className="flex mt-2">
            <div className="w-16 text-center text-sm font-medium text-gray-700">Probability</div>
            <div className="flex-1 text-center text-sm font-medium text-gray-700">Impact</div>
          </div>
        </div>
      </div>
      
      {/* Risk key */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">Low Risk</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-sm">Medium Risk</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm">High Risk</span>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;