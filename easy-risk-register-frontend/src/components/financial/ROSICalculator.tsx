import React, { useState } from 'react';

import { Button, Input } from '../../design-system';

interface ROSICalculatorProps {
  onROSIComputed: (result: { ros: number; roi: number; rosDescription: string; roiDescription: string }) => void;
}

export const ROSICalculator: React.FC<ROSICalculatorProps> = ({ onROSIComputed }) => {
  const [annualLossExpected, setAnnualLossExpected] = useState<string>('0');
  const [annualLossWithControl, setAnnualLossWithControl] = useState<string>('0');
  const [controlCost, setControlCost] = useState<string>('0');
  const [rosiResult, setRosiResult] = useState<{ ros: number; roi: number; rosDescription: string; roiDescription: string } | null>(null);

  const handleCalculate = () => {
    const ales = parseFloat(annualLossExpected);
    const alesc = parseFloat(annualLossWithControl);
    const cost = parseFloat(controlCost);

    if (isNaN(ales) || isNaN(alesc) || isNaN(cost)) {
      alert('Please enter valid numbers for all fields');
      return;
    }

    if (cost <= 0) {
      alert('Control cost must be greater than zero');
      return;
    }

    // Calculate Risk Reduction (ROS)
    const ros = ((ales - alesc) / ales) * 100;
    
    // Calculate Return on Investment (ROI)
    const roi = ((ales - alesc - cost) / cost) * 100;

    const result = {
      ros: parseFloat(ros.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      rosDescription: `Risk reduction of ${ros.toFixed(2)}%`,
      roiDescription: `Return on investment of ${roi.toFixed(2)}%`
    };

    setRosiResult(result);
    onROSIComputed(result);
  };

  const handleReset = () => {
    setAnnualLossExpected('0');
    setAnnualLossWithControl('0');
    setControlCost('0');
    setRosiResult(null);
  };

  return (
    <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text-high">Return on Security Investment (ROSI) Calculator</h3>
        <p className="mt-1 text-sm text-text-low">
          Calculate the return on investment for security controls
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Annual Loss Expected (ALE) without control ($)
          </label>
          <Input
            type="number"
            value={annualLossExpected}
            onChange={(e) => setAnnualLossExpected(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Annual Loss Expected (ALE) with control ($)
          </label>
          <Input
            type="number"
            value={annualLossWithControl}
            onChange={(e) => setAnnualLossWithControl(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Annual Control Cost ($)
          </label>
          <Input
            type="number"
            value={controlCost}
            onChange={(e) => setControlCost(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={handleCalculate} variant="primary">
          Calculate ROSI
        </Button>
        <Button onClick={handleReset} variant="secondary">
          Reset
        </Button>
      </div>

      {rosiResult && (
        <div className="mt-6 p-4 rounded-xl bg-surface-secondary/20 border border-border-faint">
          <h4 className="font-semibold text-text-high mb-3">ROSI Analysis Results</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-blue-50/30 border border-blue-200">
              <h5 className="font-semibold text-blue-800 mb-2">Risk Reduction (ROS)</h5>
              <p className="text-2xl font-bold text-blue-800">{rosiResult.ros}%</p>
              <p className="mt-1 text-sm text-blue-700">{rosiResult.rosDescription}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-green-50/30 border border-green-200">
              <h5 className="font-semibold text-green-800 mb-2">Return on Investment (ROI)</h5>
              <p className="text-2xl font-bold text-green-800">{rosiResult.roi}%</p>
              <p className="mt-1 text-sm text-green-700">{rosiResult.roiDescription}</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-text-medium">
            <p className="mb-2">
              <span className="font-semibold">Risk Reduction (ROS):</span> Measures the percentage reduction in risk achieved by implementing the security control.
            </p>
            <p className="mb-2">
              <span className="font-semibold">Return on Investment (ROI):</span> Calculates the financial return from implementing the security control, considering both risk reduction and implementation cost.
            </p>
            <p>
              <span className="font-semibold">Interpretation:</span> 
              {rosiResult.roi > 0 ? ' Positive ROI indicates the security control is financially beneficial.' : ' Negative ROI suggests the cost of the control may exceed the risk reduction benefits.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};