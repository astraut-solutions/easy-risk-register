import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractiveCostModeling } from './InteractiveCostModeling';

describe('InteractiveCostModeling', () => {
  const mockOnCostModelUpdated = jest.fn();

  beforeEach(() => {
    mockOnCostModelUpdated.mockClear();
  });

  it('renders correctly', () => {
    render(<InteractiveCostModeling onCostModelUpdated={mockOnCostModelUpdated} />);
    
    expect(screen.getByText('Interactive Cost Modeling')).toBeInTheDocument();
    expect(screen.getByText('Model and track costs associated with risk mitigation and security investments')).toBeInTheDocument();
    expect(screen.getByText('Cost Item Name')).toBeInTheDocument();
    expect(screen.getByText('Cost ($)')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('allows adding a cost item', () => {
    render(<InteractiveCostModeling onCostModelUpdated={mockOnCostModelUpdated} />);
    
    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText('e.g., Firewall upgrade'), {
      target: { value: 'Test Cost Item' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1000' }
    });
    
    // Click the add button
    fireEvent.click(screen.getByText('Add Cost Item'));
    
    // Check that the callback was called
    expect(mockOnCostModelUpdated).toHaveBeenCalledWith(1000, expect.arrayContaining([
      expect.objectContaining({
        name: 'Test Cost Item',
        cost: 1000
      })
    ]));
  });

  it('validates cost input', () => {
    render(<InteractiveCostModeling onCostModelUpdated={mockOnCostModelUpdated} />);
    
    // Fill in the form with invalid cost
    fireEvent.change(screen.getByPlaceholderText('e.g., Firewall upgrade'), {
      target: { value: 'Test Cost Item' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '-100' }
    });
    
    // Mock alert function
    window.alert = jest.fn();
    
    // Click the add button
    fireEvent.click(screen.getByText('Add Cost Item'));
    
    // Check that alert was called
    expect(window.alert).toHaveBeenCalledWith('Please enter a valid cost greater than zero');
  });

  it('allows removing a cost item', () => {
    const initialItems = [{
      id: 'test-id',
      name: 'Test Item',
      cost: 1000,
      category: 'security',
      description: 'Test description'
    }];
    
    const { rerender } = render(
      <InteractiveCostModeling onCostModelUpdated={mockOnCostModelUpdated} />
    );
    
    // Add an item first
    fireEvent.change(screen.getByPlaceholderText('e.g., Firewall upgrade'), {
      target: { value: 'Test Item' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('0.00'), {
      target: { value: '1000' }
    });
    
    fireEvent.click(screen.getByText('Add Cost Item'));
    
    // Verify item was added
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    
    // Click remove button
    fireEvent.click(screen.getByText('Remove'));
    
    // Check that the callback was called with empty array
    expect(mockOnCostModelUpdated).toHaveBeenCalledWith(0, []);
  });
});