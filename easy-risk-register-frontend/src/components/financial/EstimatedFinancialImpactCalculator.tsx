import React, { useState, useEffect } from 'react';

import { Button, Input, Select } from '../../design-system';

interface FinancialImpactRange {
  lowerBound: number;
  upperBound: number;
  expectedMean: number;
}

interface EstimatedFinancialImpactCalculatorProps {
  onImpactCalculated: (impact: FinancialImpactRange) => void;
  initialValues?: FinancialImpactRange;
}

export const EstimatedFinancialImpactCalculator: React.FC<EstimatedFinancialImpactCalculatorProps> = ({
  onImpactCalculated,
  initialValues,
}) => {
  const [lowerBound, setLowerBound] = useState<string>(
    initialValues?.lowerBound?.toString() || ''
  );
  const [upperBound, setUpperBound] = useState<string>(
    initialValues?.upperBound?.toString() || ''
  );
  const [expectedMean, setExpectedMean] = useState<string>(
    initialValues?.expectedMean?.toString() || ''
  );
  const [currency, setCurrency] = useState<string>('USD');
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  // Calculate expected mean if lower and upper bounds are provided
  useEffect(() => {
    if (lowerBound && upperBound && !expectedMean) {
      const lower = parseFloat(lowerBound);
      const upper = parseFloat(upperBound);
      if (!isNaN(lower) && !isNaN(upper)) {
        const mean = (lower + upper) / 2;
        setExpectedMean(mean.toFixed(2));
      }
    }
  }, [lowerBound, upperBound, expectedMean]);

  const handleCalculate = () => {
    const lower = parseFloat(lowerBound);
    const upper = parseFloat(upperBound);
    const mean = parseFloat(expectedMean);

    if (isNaN(lower) || isNaN(upper) || isNaN(mean)) {
      alert('Please enter valid numbers for all fields');
      return;
    }

    if (lower > upper) {
      alert('Lower bound must be less than or equal to upper bound');
      return;
    }

    if (mean < lower || mean > upper) {
      alert('Expected mean must be between lower and upper bounds');
      return;
    }

    const impact: FinancialImpactRange = {
      lowerBound: lower,
      upperBound: upper,
      expectedMean: mean,
    };

    onImpactCalculated(impact);
    setIsCalculated(true);
  };

  const handleReset = () => {
    setLowerBound('');
    setUpperBound('');
    setExpectedMean('');
    setCurrency('USD');
    setIsCalculated(false);
  };

  return (
    <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text-high">Estimated Financial Impact (EFI) Calculator</h3>
        <p className="mt-1 text-sm text-text-low">
          Calculate the potential financial impact of risks with range-based estimates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Lower Bound ({currency})
          </label>
          <Input
            type="number"
            value={lowerBound}
            onChange={(e) => setLowerBound(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Upper Bound ({currency})
          </label>
          <Input
            type="number"
            value={upperBound}
            onChange={(e) => setUpperBound(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-medium mb-2">
            Expected Mean ({currency})
          </label>
          <Input
            type="number"
            value={expectedMean}
            onChange={(e) => setExpectedMean(e.target.value)}
            placeholder="0.00"
            min="0"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-text-medium mb-2">
          Currency
        </label>
        <Select
          options={[
            { value: 'USD', label: 'USD ($)' },
            { value: 'EUR', label: 'EUR (€)' },
            { value: 'GBP', label: 'GBP (£)' },
            { value: 'JPY', label: 'JPY (¥)' },
          ]}
          value={currency}
          onChange={setCurrency}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCalculate} variant="primary">
          Calculate EFI
        </Button>
        <Button onClick={handleReset} variant="secondary">
          Reset
        </Button>
      </div>

      {isCalculated && (
        <div className="mt-6 p-4 rounded-xl bg-surface-secondary/20 border border-border-faint">
          <h4 className="font-semibold text-text-high mb-2">Calculated Financial Impact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-status-success/10 border border-status-success/30">
              <p className="text-sm text-text-low">Lower Bound</p>
              <p className="text-lg font-semibold text-status-success">
                {currency} {parseFloat(lowerBound).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
              <p className="text-sm text-text-low">Expected Mean</p>
              <p className="text-lg font-semibold text-status-warning">
                {currency} {parseFloat(expectedMean).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-status-danger/10 border border-status-danger/30">
              <p className="text-sm text-text-low">Upper Bound</p>
              <p className="text-lg font-semibold text-status-danger">
                {currency} {parseFloat(upperBound).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-text-medium">
            <p>
              <span className="font-semibold">Risk Multiplier:</span> The potential financial impact 
              ranges from {currency} {parseFloat(lowerBound).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              to {currency} {parseFloat(upperBound).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, 
              with an expected mean of {currency} {parseFloat(expectedMean).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};