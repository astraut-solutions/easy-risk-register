import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EstimatedFinancialImpactCalculator } from './EstimatedFinancialImpactCalculator';

describe('EstimatedFinancialImpactCalculator', () => {
  const mockOnImpactCalculated = jest.fn();

  beforeEach(() => {
    mockOnImpactCalculated.mockClear();
  });

  it('renders correctly', () => {
    render(<EstimatedFinancialImpactCalculator onImpactCalculated={mockOnImpactCalculated} />);
    
    expect(screen.getByText('Estimated Financial Impact (EFI) Calculator')).toBeInTheDocument();
    expect(screen.getByText('Calculate the potential financial impact of risks with range-based estimates')).toBeInTheDocument();
    expect(screen.getByText('Lower Bound (USD)')).toBeInTheDocument();
    expect(screen.getByText('Upper Bound (USD)')).toBeInTheDocument();
    expect(screen.getByText('Expected Mean (USD)')).toBeInTheDocument();
  });

  it('allows calculating financial impact', () => {
    render(<EstimatedFinancialImpactCalculator onImpactCalculated={mockOnImpactCalculated} />);
    
    // Fill in the values
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '1000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[1], {
      target: { value: '5000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[2], {
      target: { value: '3000' }
    });
    
    // Click the calculate button
    fireEvent.click(screen.getByText('Calculate EFI'));
    
    // Check that the callback was called
    expect(mockOnImpactCalculated).toHaveBeenCalledWith({
      lowerBound: 1000,
      upperBound: 5000,
      expectedMean: 3000
    });
  });

  it('validates input values', () => {
    render(<EstimatedFinancialImpactCalculator onImpactCalculated={mockOnImpactCalculated} />);
    
    // Fill in invalid values (lower > upper)
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '5000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[1], {
      target: { value: '1000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[2], {
      target: { value: '3000' }
    });
    
    // Mock alert function
    window.alert = jest.fn();
    
    // Click the calculate button
    fireEvent.click(screen.getByText('Calculate EFI'));
    
    // Check that alert was called
    expect(window.alert).toHaveBeenCalledWith('Lower bound must be less than or equal to upper bound');
  });
});