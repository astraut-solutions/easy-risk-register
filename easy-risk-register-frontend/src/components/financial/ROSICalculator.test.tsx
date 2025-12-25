import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ROSICalculator } from './ROSICalculator';

describe('ROSICalculator', () => {
  const mockOnROSIComputed = jest.fn();

  beforeEach(() => {
    mockOnROSIComputed.mockClear();
  });

  it('renders correctly', () => {
    render(<ROSICalculator onROSIComputed={mockOnROSIComputed} />);
    
    expect(screen.getByText('Return on Security Investment (ROSI) Calculator')).toBeInTheDocument();
    expect(screen.getByText('Calculate the return on investment for security controls')).toBeInTheDocument();
    expect(screen.getByText('Annual Loss Expected (ALE) without control ($)')).toBeInTheDocument();
    expect(screen.getByText('Annual Loss Expected (ALE) with control ($)')).toBeInTheDocument();
    expect(screen.getByText('Annual Control Cost ($)')).toBeInTheDocument();
  });

  it('allows calculating ROSI', () => {
    render(<ROSICalculator onROSIComputed={mockOnROSIComputed} />);
    
    // Fill in the values
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '10000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[1], {
      target: { value: '3000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[2], {
      target: { value: '2000' }
    });
    
    // Click the calculate button
    fireEvent.click(screen.getByText('Calculate ROSI'));
    
    // Check that the callback was called with correct values
    // ROS = ((10000 - 3000) / 10000) * 100 = 70%
    // ROI = ((10000 - 3000 - 2000) / 2000) * 100 = 250%
    expect(mockOnROSIComputed).toHaveBeenCalledWith(
      expect.objectContaining({
        ros: 70,
        roi: 250
      })
    );
  });

  it('validates control cost', () => {
    render(<ROSICalculator onROSIComputed={mockOnROSIComputed} />);
    
    // Fill in values with zero cost
    fireEvent.change(screen.getAllByRole('spinbutton')[0], {
      target: { value: '10000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[1], {
      target: { value: '3000' }
    });
    
    fireEvent.change(screen.getAllByRole('spinbutton')[2], {
      target: { value: '0' }
    });
    
    // Mock alert function
    window.alert = jest.fn();
    
    // Click the calculate button
    fireEvent.click(screen.getByText('Calculate ROSI'));
    
    // Check that alert was called
    expect(window.alert).toHaveBeenCalledWith('Control cost must be greater than zero');
  });
});