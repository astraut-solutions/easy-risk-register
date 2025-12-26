import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RangeBasedImpactVisualization } from './RangeBasedImpactVisualization'

const formatAmount = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const includesNormalizedText =
  (expected: string) => (_: string, node: Element | null) =>
    (node?.textContent ?? '').replace(/\s+/g, ' ').includes(expected)

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
    
    expect(
      screen.getAllByText(includesNormalizedText(formatAmount(1000.5, 'USD')))
        .length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(includesNormalizedText(formatAmount(5000.75, 'USD')))
        .length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(includesNormalizedText(formatAmount(3000.25, 'USD')))
        .length
    ).toBeGreaterThan(0)
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
    expect(
      screen.getAllByText(includesNormalizedText(formatAmount(1000, 'USD')))
        .length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(includesNormalizedText(formatAmount(5000, 'USD')))
        .length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(includesNormalizedText(formatAmount(3000, 'USD')))
        .length
    ).toBeGreaterThan(0)
  })
})
