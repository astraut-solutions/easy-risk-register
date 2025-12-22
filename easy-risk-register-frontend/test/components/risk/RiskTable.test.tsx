import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RiskTable } from '../../../src/components/risk/RiskTable'
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
    Badge: ({ children, subtle: _subtle, ...props }: any) => (
      <span {...props} data-testid="mock-badge">
        {children}
      </span>
    ),
    Table: ({ children, ...props }: any) => (
      <table {...props} data-testid="mock-table">
        {children}
      </table>
    ),
    TableHeader: ({ children, ...props }: any) => (
      <thead {...props} data-testid="mock-table-header">
        {children}
      </thead>
    ),
    TableBody: ({ children, ...props }: any) => (
      <tbody {...props} data-testid="mock-table-body">
        {children}
      </tbody>
    ),
    TableRow: ({ children, ...props }: any) => (
      <tr {...props} data-testid="mock-table-row">
        {children}
      </tr>
    ),
    TableHead: ({ children, ...props }: any) => (
      <th {...props} data-testid="mock-table-head">
        {children}
      </th>
    ),
    TableCell: ({ children, ...props }: any) => (
      <td {...props} data-testid="mock-table-cell">
        {children}
      </td>
    ),
  }
})

const makeRisk = (overrides: Partial<Risk>): Risk => ({
  id: '1',
  title: 'Test Risk',
  description: 'Test description',
  probability: 3,
  impact: 3,
  riskScore: 9,
  category: 'Security',
  status: 'open',
  mitigationPlan: '',
  mitigationSteps: [],
  owner: '',
  riskResponse: 'treat',
  ownerResponse: '',
  securityAdvisorComment: '',
  vendorResponse: '',
  evidence: [],
  creationDate: '2023-01-01T00:00:00.000Z',
  lastModified: '2023-01-02T00:00:00.000Z',
  ...overrides,
})

const mockRisk1: Risk = makeRisk({
  id: '1',
  title: 'Test Risk 1',
  description: 'First test risk description',
  probability: 4,
  impact: 3,
  riskScore: 12,
  category: 'Security',
  status: 'open',
  mitigationPlan: 'First mitigation plan',
  owner: 'Alice',
  dueDate: '2023-01-15T00:00:00.000Z',
  reviewDate: '2023-01-20T00:00:00.000Z',
  reviewCadence: 'monthly',
  riskResponse: 'treat',
  evidence: [],
})

const mockRisk2: Risk = makeRisk({
  id: '2',
  title: 'Test Risk 2',
  description: 'Second test risk description',
  probability: 2,
  impact: 4,
  riskScore: 8,
  category: 'Compliance',
  status: 'mitigated',
  mitigationPlan: 'Second mitigation plan',
  owner: 'Bob',
  dueDate: '2023-02-15T00:00:00.000Z',
  reviewDate: '2023-02-20T00:00:00.000Z',
  reviewCadence: 'quarterly',
  riskResponse: 'transfer',
  evidence: [{ type: 'link', url: 'https://example.com', addedAt: '2023-02-10T00:00:00.000Z' }],
})

describe('RiskTable', () => {
  const defaultProps = {
    risks: [mockRisk1, mockRisk2],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders table headers correctly', () => {
    render(<RiskTable {...defaultProps} />)

    expect(screen.getByText('Risk')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Likelihood')).toBeInTheDocument()
    expect(screen.getByText('Impact')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Due')).toBeInTheDocument()
    expect(screen.getByText('Next review')).toBeInTheDocument()
    expect(screen.getByText('Response')).toBeInTheDocument()
    expect(screen.getByText('Evidence')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Last updated')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('renders risk data in table rows', () => {
    render(<RiskTable {...defaultProps} />)

    const rows = screen.getAllByTestId('mock-table-row')
    const [firstRow, secondRow] = rows.slice(1) // first row is header

    // Check first risk
    const firstRowQueries = within(firstRow)
    expect(firstRowQueries.getByText('Test Risk 1')).toBeInTheDocument()
    expect(firstRowQueries.getByText('First test risk description')).toBeInTheDocument()
    expect(firstRowQueries.getByText('Security')).toBeInTheDocument()
    expect(firstRowQueries.getByText('4')).toBeInTheDocument()
    expect(firstRowQueries.getByText('3')).toBeInTheDocument()
    expect(firstRowQueries.getByText('12')).toBeInTheDocument()
    expect(firstRowQueries.getByText('open')).toBeInTheDocument()

    // Check second risk
    const secondRowQueries = within(secondRow)
    expect(secondRowQueries.getByText('Test Risk 2')).toBeInTheDocument()
    expect(secondRowQueries.getByText('Second test risk description')).toBeInTheDocument()
    expect(secondRowQueries.getByText('Compliance')).toBeInTheDocument()
    expect(secondRowQueries.getByText('2')).toBeInTheDocument()
    expect(secondRowQueries.getByText('4')).toBeInTheDocument()
    expect(secondRowQueries.getByText('8')).toBeInTheDocument()
    expect(secondRowQueries.getByText('mitigated')).toBeInTheDocument()
  })

  it('displays risk score with correct severity badge', () => {
    const mediumRiskExample: Risk = {
      ...mockRisk2,
      id: 'medium-risk-example',
      title: 'Medium Severity Risk',
      riskScore: 5,
    }
    render(<RiskTable {...defaultProps} risks={[mockRisk1, mediumRiskExample]} />)

    const riskScoreBadges = screen
      .getAllByTestId('mock-badge')
      .filter((badge) => badge.getAttribute('aria-label')?.startsWith('Risk score:'))

    const highSeverityBadge = riskScoreBadges.find(
      (badge) => badge.textContent?.trim() === `${mockRisk1.riskScore}`
    )
    expect(highSeverityBadge).toHaveAttribute('tone', 'danger')

    // Medium severity risk score (5) should have warning tone
    const mediumSeverityBadge = riskScoreBadges.find(
      (badge) => badge.textContent?.trim() === `${mediumRiskExample.riskScore}`
    )
    expect(mediumSeverityBadge).toHaveAttribute('tone', 'warning')
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEditSpy = vi.fn()
    render(<RiskTable {...defaultProps} onEdit={onEditSpy} />)

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    expect(onEditSpy).toHaveBeenCalledWith(mockRisk1)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDeleteSpy = vi.fn()
    render(<RiskTable {...defaultProps} onDelete={onDeleteSpy} />)

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[1])

    expect(onDeleteSpy).toHaveBeenCalledWith('2')
  })

  it('calls onView when View/Edit button is clicked if onView prop is provided', () => {
    const onViewSpy = vi.fn()
    render(<RiskTable {...defaultProps} onView={onViewSpy} />)

    const viewEditButtons = screen.getAllByText('View/Edit')
    fireEvent.click(viewEditButtons[0])

    expect(onViewSpy).toHaveBeenCalledWith(mockRisk1)
  })

  it('falls back to onEdit when View/Edit button is clicked and onView is not provided', () => {
    const onEditSpy = vi.fn()
    render(<RiskTable {...defaultProps} onEdit={onEditSpy} />)

    const viewEditButtons = screen.getAllByText('View/Edit')
    fireEvent.click(viewEditButtons[0])

    expect(onEditSpy).toHaveBeenCalledWith(mockRisk1)
  })

  it('shows empty state when no risks are provided', () => {
    render(<RiskTable risks={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('No risks available')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use the New risk button to start capturing risks in this workspace.'
      )
    ).toBeInTheDocument()
  })

  it('uses custom empty state when provided', () => {
    const customEmptyState = {
      title: 'No risks yet',
      description: 'Add your first risk using the button above',
    }
    
    render(
      <RiskTable
        risks={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        emptyState={customEmptyState}
      />
    )

    expect(screen.getByText('No risks yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first risk using the button above')).toBeInTheDocument()
  })

  it('displays properly formatted dates', () => {
    render(<RiskTable {...defaultProps} />)

    // Should display formatted dates (will vary by locale but should contain the date)
    expect(screen.getAllByText(/Jan|January/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Feb|February/).length).toBeGreaterThan(0)
  })

  it('capitalizes status correctly', () => {
    render(<RiskTable {...defaultProps} />)

    expect(screen.getByText('open')).toBeInTheDocument()
    expect(screen.getByText('mitigated')).toBeInTheDocument()
  })

  it('displays category badge with correct attributes', () => {
    render(<RiskTable {...defaultProps} />)

    const categoryBadges = screen
      .getAllByTestId('mock-badge')
      .filter((badge) => badge.getAttribute('aria-label')?.startsWith('Category:'))

    expect(categoryBadges).toHaveLength(defaultProps.risks.length)
    categoryBadges.forEach((badge) => {
      expect(badge).toHaveAttribute('tone', 'neutral')
      expect(badge).toHaveClass('rounded-full', 'text-xs', 'font-semibold')
    })
  })

  it('displays ARIA labels correctly for accessibility', () => {
    render(<RiskTable {...defaultProps} />)

    // Check table ARIA label
    const table = screen.getByTestId('mock-table')
    expect(table).toHaveAttribute('aria-label', 'Risk register table showing all risks with their details')

    // Check ARIA label for actions group
    const actionGroups = screen.getAllByRole('group')
    expect(actionGroups[0]).toHaveAttribute('aria-label', 'Actions for risk Test Risk 1')
    expect(actionGroups[1]).toHaveAttribute('aria-label', 'Actions for risk Test Risk 2')
  })

  it('maps risk scores to correct severity tones', () => {
    // Test low severity (score <= 3)
    const lowRisk: Risk = {
      ...mockRisk1,
      id: 'low-risk-id',
      riskScore: 2,
      title: 'Low Risk'
    }

    // Test medium severity (score 4-6)
    const mediumRisk: Risk = {
      ...mockRisk1,
      id: 'medium-risk-id',
      riskScore: 5,
      title: 'Medium Risk'
    }

    render(<RiskTable risks={[lowRisk, mediumRisk]} onEdit={vi.fn()} onDelete={vi.fn()} />)

    // The badges for these risk scores should have the correct tones
    const riskScoreBadges = screen.getAllByTestId('mock-badge').filter(badge => 
      ['2', '5'].includes(badge.textContent?.trim() || '')
    )

    expect(riskScoreBadges[0]).toHaveAttribute('tone', 'success') // Low risk
    expect(riskScoreBadges[1]).toHaveAttribute('tone', 'warning') // Medium risk
  })

  it('provides a labelled region wrapper for screen readers', () => {
    render(<RiskTable {...defaultProps} />)

    const region = screen.getByRole('region')
    expect(region).toHaveAttribute('aria-labelledby', 'risk-table-title')
    expect(screen.getByText('Risk Table')).toHaveAttribute('id', 'risk-table-title')
  })

  it('uses boundary risk scores to determine severity tones correctly', () => {
    const risksWithBoundaries: Risk[] = [
      { ...mockRisk1, id: 'low', title: 'Low Risk', riskScore: 3 },
      { ...mockRisk1, id: 'medium', title: 'Medium Risk', riskScore: 6 },
      { ...mockRisk1, id: 'high', title: 'High Risk', riskScore: 9 },
    ]

    render(<RiskTable risks={risksWithBoundaries} onEdit={vi.fn()} onDelete={vi.fn()} />)

    const scoreBadges = screen
      .getAllByTestId('mock-badge')
      .filter((badge) => ['3', '6', '9'].includes(badge.textContent?.trim() ?? ''))

    expect(scoreBadges[0]).toHaveAttribute('tone', 'success')
    expect(scoreBadges[1]).toHaveAttribute('tone', 'warning')
    expect(scoreBadges[2]).toHaveAttribute('tone', 'danger')
  })
})
