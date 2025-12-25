import React, { useState } from 'react';
import { EstimatedFinancialImpactCalculator } from './components/financial/EstimatedFinancialImpactCalculator';
import { ROSICalculator } from './components/financial/ROSICalculator';
import { InteractiveCostModeling } from './components/financial/InteractiveCostModeling';
import { FinancialRiskTrend } from './components/financial/FinancialRiskTrend';
import { RangeBasedImpactVisualization } from './components/financial/RangeBasedImpactVisualization';
import { useRiskManagement } from './services/riskService';

const FinancialRiskDemo = () => {
  const [efiResult, setEfiResult] = useState({ lowerBound: 0, upperBound: 0, expectedMean: 0 });
  const [rosiResult, setRosiResult] = useState({ ros: 0, roi: 0, rosDescription: '', roiDescription: '' });
  const [costModel, setCostModel] = useState({ totalCost: 0, items: [] });
  
  const { risks } = useRiskManagement();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Financial Risk Quantification Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <EstimatedFinancialImpactCalculator 
            onImpactCalculated={setEfiResult}
          />
        </div>
        
        <div>
          <ROSICalculator 
            onROSIComputed={setRosiResult}
          />
        </div>
      </div>
      
      <div>
        <InteractiveCostModeling 
          onCostModelUpdated={(total, items) => setCostModel({ totalCost: total, items })}
        />
      </div>
      
      <div>
        <FinancialRiskTrend 
          risks={risks}
        />
      </div>
      
      {efiResult.lowerBound > 0 && efiResult.upperBound > 0 && efiResult.expectedMean > 0 && (
        <div>
          <RangeBasedImpactVisualization 
            lowerBound={efiResult.lowerBound}
            upperBound={efiResult.upperBound}
            expectedMean={efiResult.expectedMean}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialRiskDemo;