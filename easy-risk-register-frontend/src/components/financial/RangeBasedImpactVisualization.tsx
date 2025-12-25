import React from 'react';

interface RangeBasedImpactVisualizationProps {
  lowerBound: number;
  upperBound: number;
  expectedMean: number;
  currency?: string;
  title?: string;
  description?: string;
}

export const RangeBasedImpactVisualization: React.FC<RangeBasedImpactVisualizationProps> = ({
  lowerBound,
  upperBound,
  expectedMean,
  currency = 'USD',
  title = 'Financial Impact Range Visualization',
  description = 'Visualization of potential financial impact with lower/upper bounds and expected mean'
}) => {
  // Calculate the range and position of mean within the range
  const range = upperBound - lowerBound;
  const meanPosition = range > 0 ? ((expectedMean - lowerBound) / range) * 100 : 50;

  return (
    <div className="rr-panel p-6 rounded-xl shadow-sm border border-border-faint">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-text-high">{title}</h3>
        <p className="mt-1 text-sm text-text-low">{description}</p>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-surface-secondary/10 border border-border-faint">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-status-success">
              {currency} {lowerBound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-status-warning">
              {currency} {expectedMean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium text-status-danger">
              {currency} {upperBound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="relative pt-4">
            <div className="absolute left-0 top-6 w-full h-4 bg-gradient-to-r from-status-success/30 via-status-warning/30 to-status-danger/30 rounded-full"></div>
            
            {/* Lower bound marker */}
            <div 
              className="absolute top-3 w-0.5 h-6 bg-status-success"
              style={{ left: '0%' }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-status-success whitespace-nowrap">
                Min
              </div>
            </div>
            
            {/* Upper bound marker */}
            <div 
              className="absolute top-3 w-0.5 h-6 bg-status-danger"
              style={{ left: '100%' }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-status-danger whitespace-nowrap">
                Max
              </div>
            </div>
            
            {/* Expected mean marker */}
            <div 
              className="absolute top-3 w-1 h-8 bg-status-warning border-2 border-status-warning rounded-full"
              style={{ left: `${meanPosition}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-status-warning whitespace-nowrap">
                Mean
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30 text-center">
            <p className="text-sm text-text-low">Lower Bound</p>
            <p className="text-xl font-bold text-status-success">
              {currency} {lowerBound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-text-low">Best case scenario</p>
          </div>
          
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30 text-center">
            <p className="text-sm text-text-low">Expected Mean</p>
            <p className="text-xl font-bold text-status-warning">
              {currency} {expectedMean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-text-low">Most likely outcome</p>
          </div>
          
          <div className="p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 text-center">
            <p className="text-sm text-text-low">Upper Bound</p>
            <p className="text-xl font-bold text-status-danger">
              {currency} {upperBound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-text-low">Worst case scenario</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-surface-secondary/10 border border-border-faint">
          <h4 className="font-semibold text-text-high mb-2">Risk Analysis</h4>
          <div className="space-y-2 text-sm text-text-medium">
            <div className="flex justify-between">
              <span>Potential Impact Range:</span>
              <span className="font-medium">
                {currency} {lowerBound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - 
                {currency} {upperBound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Expected Value:</span>
              <span className="font-medium">
                {currency} {expectedMean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confidence Interval:</span>
              <span className="font-medium">
                {(meanPosition / 100 * 100).toFixed(1)}% of range
              </span>
            </div>
            <div className="flex justify-between">
              <span>Risk Variance:</span>
              <span className="font-medium">
                {currency} {(upperBound - lowerBound).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};