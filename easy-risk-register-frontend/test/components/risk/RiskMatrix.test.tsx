import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RiskMatrix } from '../../../src/components/risk/RiskMatrix'

// Mock Badge component
vi.mock('../../../src/design-system', () => ({
  Badge: ({ children, tone }: any) => (
    <span data-testid={`badge-${tone}`}>{children}</span>
  ),
}))

const mockRisks = [
  {
    id: '1',
    title: 'High Risk',
    description: 'High risk description',
    probability: 5,
    impact: 5,
    riskScore: 25,
    category: 'Security',
    status: 'open',
    mitigationPlan: 'High risk plan',
    mitigationSteps: [],
    owner: '',
    riskResponse: 'treat',
    ownerResponse: '',
    securityAdvisorComment: '',
    vendorResponse: '',
    evidence: [],
    creationDate: '2023-01-01T00:00:00.000Z',
    lastModified: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Medium Risk',
    description: 'Medium risk description',
    probability: 3,
    impact: 3,
    riskScore: 9,
    category: 'Operational',
    status: 'mitigated',
    mitigationPlan: 'Medium risk plan',
    mitigationSteps: [],
    owner: '',
    riskResponse: 'treat',
    ownerResponse: '',
    securityAdvisorComment: '',
    vendorResponse: '',
    evidence: [],
    creationDate: '2023-01-01T00:00:00.000Z',
    lastModified: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    title: 'Low Risk',
    description: 'Low risk description',
    probability: 1,
    impact: 2,
    riskScore: 2,
    category: 'Compliance',
    status: 'closed',
    mitigationPlan: 'Low risk plan',
    mitigationSteps: [],
    owner: '',
    riskResponse: 'treat',
    ownerResponse: '',
    securityAdvisorComment: '',
    vendorResponse: '',
    evidence: [],
    creationDate: '2023-01-01T00:00:00.000Z',
    lastModified: '2023-01-01T00:00:00.000Z',
  },
]

describe('RiskMatrix', () => {
  it('renders the risk matrix with correct headers', () => {
    render(<RiskMatrix risks={[]} />)

    expect(screen.getByText('Risk matrix')).toBeInTheDocument()
    expect(screen.getByText('Interactive visualization of risks by likelihood and impact')).toBeInTheDocument()

    // Check impact headers
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Impact ${i}`)).toBeInTheDocument()
    }

    // Check likelihood headers
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Likelihood ${i}`)).toBeInTheDocument()
    }
  })

  it('shows color-coded badges for risk levels', () => {
    render(<RiskMatrix risks={[]} />)

    expect(screen.getByTestId('badge-danger')).toHaveTextContent('High')
    expect(screen.getByTestId('badge-warning')).toHaveTextContent('Medium')
    expect(screen.getByTestId('badge-success')).toHaveTextContent('Low')
  })

  it('renders empty matrix cells when no risks are provided', () => {
    render(<RiskMatrix risks={[]} />)

    // There should be 25 cells (5x5 matrix)
    const cells = screen.getAllByRole('gridcell')
    const buttons = cells.filter(cell => cell.tagName === 'BUTTON')

    expect(buttons).toHaveLength(25)

    // All cells should show '-' (no risks) and 'none' severity
    buttons.forEach(button => {
      expect(button).toHaveTextContent('-')
      expect(button).toHaveTextContent('none')
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('renders risk counts in matrix cells', () => {
    render(<RiskMatrix risks={mockRisks} />)

    // Find cells that should contain risks
    const highRiskCell = screen.getByLabelText(/Risk cell: Likelihood 5, Impact 5/i)
    expect(highRiskCell).toHaveTextContent('1') // 1 high risk
    expect(highRiskCell).toHaveTextContent('high')

    const mediumRiskCell = screen.getByLabelText(/Risk cell: Likelihood 3, Impact 3/i)
    expect(mediumRiskCell).toHaveTextContent('1') // 1 medium risk
    expect(mediumRiskCell).toHaveTextContent('medium')

    const lowRiskCell = screen.getByLabelText(/Risk cell: Likelihood 1, Impact 2/i)
    expect(lowRiskCell).toHaveTextContent('1') // 1 low risk
    expect(lowRiskCell).toHaveTextContent('low')
  })

  it('combines multiple risks in the same cell', () => {
    const risksWithSameProbabilityImpact = [
      {
        id: '1',
        title: 'Risk 1',
        description: 'Risk 1 description',
        probability: 4,
        impact: 4,
        riskScore: 16,
        category: 'Security',
        status: 'open',
        mitigationPlan: 'Plan 1',
        mitigationSteps: [],
        owner: '',
        riskResponse: 'treat',
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        evidence: [],
        creationDate: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        title: 'Risk 2',
        description: 'Risk 2 description',
        probability: 4,
        impact: 4,
        riskScore: 16,
        category: 'Security',
        status: 'open',
        mitigationPlan: 'Plan 2',
        mitigationSteps: [],
        owner: '',
        riskResponse: 'treat',
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        evidence: [],
        creationDate: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
      },
    ]

    render(<RiskMatrix risks={risksWithSameProbabilityImpact} />)

    const cell = screen.getByLabelText(/Risk cell: Likelihood 4, Impact 4/i)
    expect(cell).toHaveTextContent('2') // 2 risks in the same cell
    expect(cell).toHaveTextContent('high') // highest severity for the cell
  })

  it('calls onSelect when a cell with risks is clicked', () => {
    const mockOnSelect = vi.fn()
    render(<RiskMatrix risks={mockRisks} onSelect={mockOnSelect} />)

    const highRiskCell = screen.getByLabelText(/Risk cell: Likelihood 5, Impact 5/i)
    fireEvent.click(highRiskCell)

    expect(mockOnSelect).toHaveBeenCalledWith({
      probability: 5,
      impact: 5,
      severity: 'high',
      riskIds: ['1'],
    })
  })

  it('does not call onSelect when a cell without risks is clicked', () => {
    const mockOnSelect = vi.fn()
    render(<RiskMatrix risks={[]} onSelect={mockOnSelect} />)

    const emptyCell = screen.getByLabelText(/Risk cell: Likelihood 1, Impact 1, 0 risk\(s\), no severity/i)
    fireEvent.click(emptyCell)

    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('has correct accessibility attributes', () => {
    render(<RiskMatrix risks={mockRisks} />)

    const matrixGrid = screen.getByRole('grid')
    expect(matrixGrid).toBeInTheDocument()
    expect(matrixGrid).toHaveAttribute('aria-label', 'Risk matrix grid showing risk distribution by likelihood and impact')

    const titleLabel = screen.getByText('Risk matrix')
    expect(matrixGrid).toHaveAttribute('aria-labelledby', 'risk-matrix-title')
    expect(titleLabel).toHaveAttribute('id', 'risk-matrix-title')

    // Check that cells have proper aria labels
    const highRiskCell = screen.getByLabelText(/Risk cell: Likelihood 5, Impact 5, 1 risk\(s\), high severity/i)
    expect(highRiskCell).toBeInTheDocument()
  })

  it('supports arrow-key navigation between cells', () => {
    render(<RiskMatrix risks={[]} />)

    const start = screen.getByLabelText(/Risk cell: Likelihood 5, Impact 1/i)
    start.focus()
    expect(document.activeElement).toBe(start)

    fireEvent.keyDown(start, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByLabelText(/Risk cell: Likelihood 5, Impact 2/i))

    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByLabelText(/Risk cell: Likelihood 4, Impact 2/i))

    fireEvent.keyDown(document.activeElement as Element, { key: 'Home' })
    expect(document.activeElement).toBe(screen.getByLabelText(/Risk cell: Likelihood 4, Impact 1/i))
  })

  it('shows instructions text', () => {
    render(<RiskMatrix risks={[]} />)

    expect(
      screen.getByText('Use Arrow keys to move between cells. Press Enter to drill down to the filtered list for a populated cell.')
    ).toBeInTheDocument()
  })
})
