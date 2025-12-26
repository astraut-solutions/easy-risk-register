import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FinancialRiskTrend } from './FinancialRiskTrend'
import type { Risk } from '../../types/risk'

describe('FinancialRiskTrend', () => {
  const mockRisks: Risk[] = [
    {
      id: '1',
      title: 'Test Risk 1',
      description: 'Test description',
      probability: 3,
      impact: 4,
      riskScore: 12,
      category: 'Security',
      threatType: 'phishing',
      status: 'open',
      mitigationPlan: 'Test plan',
      owner: 'Test Owner',
      checklistStatus: 'not_started',
      creationDate: '2023-01-01T00:00:00.000Z',
      lastModified: '2023-01-01T00:00:00.000Z',
      evidence: [],
      mitigationSteps: [],
      checklists: [],
    },
    {
      id: '2',
      title: 'Test Risk 2',
      description: 'Test description 2',
      probability: 2,
      impact: 3,
      riskScore: 6,
      category: 'Compliance',
      threatType: 'vulnerability',
      status: 'open',
      mitigationPlan: 'Test plan 2',
      owner: 'Test Owner 2',
      checklistStatus: 'not_started',
      creationDate: '2023-01-01T00:00:00.000Z',
      lastModified: '2023-01-01T00:00:00.000Z',
      evidence: [],
      mitigationSteps: [],
      checklists: [],
    }
  ]

  it('renders correctly', () => {
    render(<FinancialRiskTrend risks={mockRisks} />)
    
    expect(screen.getByText('Financial Risk Trend Visualization')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Track potential financial impact over time with mitigation investments'
      )
    ).toBeInTheDocument()
  })

  it('renders with custom currency', () => {
    render(<FinancialRiskTrend risks={mockRisks} currency="EUR" />)
    
    expect(screen.getByText('Financial Risk Trend Visualization')).toBeInTheDocument()
  })

  it('renders with empty risks array', () => {
    render(<FinancialRiskTrend risks={[]} />)
    
    expect(screen.getByText('Financial Risk Trend Visualization')).toBeInTheDocument()
  })
})
