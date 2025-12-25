import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrioritizedActionableInsightsDashboard } from './PrioritizedActionableInsightsDashboard';

describe('PrioritizedActionableInsightsDashboard', () => {
  it('renders without crashing', () => {
    render(<PrioritizedActionableInsightsDashboard />);
    expect(screen.getByText('Immediate Attention Alerts')).toBeInTheDocument();
    expect(screen.getByText('Risk Prioritization by Financial Impact')).toBeInTheDocument();
    expect(screen.getByText('Prioritized Top Actionable Insights')).toBeInTheDocument();
    expect(screen.getByText('Actionable Recommendations Engine')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<PrioritizedActionableInsightsDashboard className="custom-class" />);
    const container = screen.getByTestId('prioritized-insights-container');
    expect(container).toHaveClass('custom-class');
  });
});