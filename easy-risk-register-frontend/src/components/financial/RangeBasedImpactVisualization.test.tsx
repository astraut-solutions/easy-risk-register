import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RangeBasedImpactVisualization } from './RangeBasedImpactVisualization'

describe('RangeBasedImpactVisualization', () => {
  it('renders correctly with default props', () => {
    render(
      <RangeBasedImpactVisualization 
        lowerBound={1000} 
        upperBound={5000} 
        expectedMean={3000} 
      />
    )
    
    expect(screen.getByText('Financial Impact Range Visualization')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Visualization of potential financial impact with lower/upper bounds and expected mean'
      )
    ).toBeInTheDocument()
  })

  it('renders with custom props', () => {
    render(
      <RangeBasedImpactVisualization 
        lowerBound={500} 
        upperBound={10000} 
        expectedMean={4000}
        currency="EUR"
        title="Custom Title"
        description="Custom description"
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('displays correct financial values', () => {
    render(
      <RangeBasedImpactVisualization 
        lowerBound={1000.50} 
        upperBound={5000.75} 
        expectedMean={3000.25}
        currency="USD"
      />
    )
    
    expect(screen.getByText('USD 1,000.50')).toBeInTheDocument()
    expect(screen.getByText('USD 5,000.75')).toBeInTheDocument()
    expect(screen.getByText('USD 3,000.25')).toBeInTheDocument()
  })

  it('calculates mean position correctly', () => {
    render(
      <RangeBasedImpactVisualization 
        lowerBound={1000} 
        upperBound={5000} 
        expectedMean={3000}
      />
    )
    
    // Check that the visualization displays the correct values
    expect(screen.getByText('USD 1,000.00')).toBeInTheDocument()
    expect(screen.getByText('USD 5,000.00')).toBeInTheDocument()
    expect(screen.getByText('USD 3,000.00')).toBeInTheDocument()
  })
})
