import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrioritizedActionableInsightsDashboard } from './PrioritizedActionableInsightsDashboard'
import { ToastProvider } from '../feedback/ToastProvider'

describe('PrioritizedActionableInsightsDashboard', () => {
  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <PrioritizedActionableInsightsDashboard />
      </ToastProvider>,
    )
    expect(screen.getByText('Immediate Attention Alerts')).toBeInTheDocument()
    expect(
      screen.getByText('Risk Prioritization by Financial Impact')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Prioritized Top Actionable Insights')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Actionable Recommendations Engine')
    ).toBeInTheDocument()
  })

  it('applies custom className when provided', () => {
    render(
      <ToastProvider>
        <PrioritizedActionableInsightsDashboard className="custom-class" />
      </ToastProvider>,
    )
    const container = screen.getByTestId('prioritized-insights-container')
    expect(container).toHaveClass('custom-class')
  })
})
