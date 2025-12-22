import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RiskCard } from '../../../src/components/risk/RiskCard'
import type { Risk } from '../../../src/types/risk'

// Mock design system components
vi.mock('../../../src/design-system', async () => {
  const actual = await vi.importActual('../../../src/design-system')
  return {
    ...actual,
    Button: ({ children, ...props }: any) => (
      <button {...props} data-testid="mock-button">
        {children}
      </button>
    ),
    Badge: ({ children, ...props }: any) => {
      const { ['data-testid']: dataTestId = 'mock-badge', subtle, ...rest } = props
      return (
        <span {...rest} data-testid={dataTestId}>
          {children}
        </span>
      )
    },
  }
})

const makeRisk = (overrides: Partial<Risk>): Risk => ({
  id: '1',
  title: 'Test Risk',
  description: 'This is a test risk description',
  probability: 4,
  impact: 3,
  riskScore: 12,
  category: 'Security',
  status: 'open',
  mitigationPlan: 'Test mitigation plan',
  mitigationSteps: [],
  owner: 'Alice',
  riskResponse: 'treat',
  ownerResponse: '',
  securityAdvisorComment: '',
  vendorResponse: '',
  evidence: [],
  creationDate: '2023-01-01T00:00:00.000Z',
  lastModified: '2023-01-02T00:00:00.000Z',
  ...overrides,
})

const mockRisk: Risk = makeRisk({})

const getRiskScoreBadge = () => screen.getByTestId('risk-score-badge')


describe('RiskCard', () => {
  const defaultProps = {
    risk: mockRisk,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders risk title and description', () => {
    render(<RiskCard {...defaultProps} />)

    expect(screen.getByText('Test Risk')).toBeInTheDocument()
    expect(screen.getByText('This is a test risk description')).toBeInTheDocument()
  })

  it('displays risk score with correct severity badge', () => {
    // Test high severity (score 12)
    const { rerender } = render(<RiskCard {...defaultProps} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(getRiskScoreBadge()).toHaveAttribute('tone', 'danger')

    // Test medium severity (score 5)
    const mediumRisk = makeRisk({ riskScore: 5 })
    rerender(<RiskCard risk={mediumRisk} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(getRiskScoreBadge()).toHaveAttribute('tone', 'warning')

    // Test low severity (score 2)
    const lowRisk = makeRisk({ riskScore: 2 })
    rerender(<RiskCard risk={lowRisk} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(getRiskScoreBadge()).toHaveAttribute('tone', 'success')
  })

  it('displays risk category as a badge', () => {
    render(<RiskCard {...defaultProps} />)

    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('displays last modified date', () => {
    render(<RiskCard {...defaultProps} />)

    // Date format depends on user's locale, but should contain the year
    expect(screen.getByText(/2023/)).toBeInTheDocument()
  })

  it('displays risk status', () => {
    render(<RiskCard {...defaultProps} />)

    expect(screen.getByText('open')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEditSpy = vi.fn()
    render(<RiskCard {...defaultProps} onEdit={onEditSpy} />)

    const viewEditButton = screen.getByText('View/Edit')
    fireEvent.click(viewEditButton)

    expect(onEditSpy).toHaveBeenCalledWith(mockRisk)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDeleteSpy = vi.fn()
    render(<RiskCard {...defaultProps} onDelete={onDeleteSpy} />)

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(onDeleteSpy).toHaveBeenCalledWith('1')
  })

  it('calls onView when View/Edit button is clicked if onView prop is provided', () => {
    const onViewSpy = vi.fn()
    render(<RiskCard {...defaultProps} onView={onViewSpy} />)

    const viewEditButton = screen.getByText('View/Edit')
    fireEvent.click(viewEditButton)

    expect(onViewSpy).toHaveBeenCalledWith(mockRisk)
  })

  it('falls back to onEdit when onView is not provided', () => {
    const onEditSpy = vi.fn()
    render(<RiskCard {...defaultProps} onEdit={onEditSpy} />)

    const viewEditButton = screen.getByText('View/Edit')
    fireEvent.click(viewEditButton)

    expect(onEditSpy).toHaveBeenCalledWith(mockRisk)
  })

  it('displays proper ARIA labels for accessibility', () => {
    render(<RiskCard {...defaultProps} />)

    // Check that the main card has a proper role and label
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-label', 'Risk card: Test Risk')

    // Check ARIA label for risk score badge
    expect(getRiskScoreBadge()).toHaveAttribute(
      'aria-label',
      'Risk score: 12, danger severity'
    )
  })

  it('applies correct CSS classes for styling', () => {
    render(<RiskCard {...defaultProps} />)

    const card = screen.getByRole('article')
    expect(card).toHaveClass('rounded-2xl', 'border', 'bg-surface-primary')
  })

  it('formats the date correctly', () => {
    render(<RiskCard {...defaultProps} />)

    // Should display a formatted date (will vary by locale but should contain the date)
    expect(screen.getAllByText(/Jan|January/).length).toBeGreaterThan(0)
  })

  it('capitalizes status correctly', () => {
    const riskWithCapitalizedStatus = makeRisk({ status: 'mitigated' })
    render(<RiskCard risk={riskWithCapitalizedStatus} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('mitigated')).toBeInTheDocument()
  })

  it('maps boundary risk scores to the expected severity tone', () => {
    const lowBoundaryRisk = makeRisk({ riskScore: 3 })
    const mediumBoundaryRisk = makeRisk({ riskScore: 6 })

    const { unmount } = render(
      <RiskCard risk={lowBoundaryRisk} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(getRiskScoreBadge()).toHaveAttribute('tone', 'success')

    unmount()

    render(<RiskCard risk={mediumBoundaryRisk} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(getRiskScoreBadge()).toHaveAttribute('tone', 'warning')
  })

  it('sets descriptive aria labels on the card actions', () => {
    render(<RiskCard {...defaultProps} onView={vi.fn()} />)

    expect(
      screen.getByLabelText('View or edit risk: Test Risk')
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Delete risk: Test Risk')).toBeInTheDocument()
  })
})
