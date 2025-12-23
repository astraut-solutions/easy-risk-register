import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskList } from '../../../src/components/risk/RiskList'

// Mock RiskCard component
vi.mock('../../../src/components/risk/RiskCard', () => ({
  RiskCard: ({ risk, onEdit, onDelete, onView }: any) => (
    <div data-testid={`risk-card-${risk.id}`}>
      <span>{risk.title}</span>
      <button onClick={() => onEdit(risk)} data-testid={`edit-${risk.id}`}>Edit</button>
      <button onClick={() => onDelete(risk.id)} data-testid={`delete-${risk.id}`}>Delete</button>
    </div>
  )
}))

const mockRisks = [
  {
    id: '1',
    title: 'Test Risk 1',
    description: 'Test Description 1',
    probability: 3,
    impact: 4,
    riskScore: 12,
    category: 'Security',
    status: 'open',
    mitigationPlan: 'Test mitigation plan',
    creationDate: '2023-01-01T00:00:00.000Z',
    lastModified: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Test Risk 2',
    description: 'Test Description 2',
    probability: 2,
    impact: 3,
    riskScore: 6,
    category: 'Operational',
    status: 'mitigated',
    mitigationPlan: 'Another mitigation plan',
    creationDate: '2023-01-01T00:00:00.000Z',
    lastModified: '2023-01-01T00:00:00.000Z',
  },
]

describe('RiskList', () => {
  const defaultProps = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onView: vi.fn(),
  }

  it('renders empty state when no risks are provided', () => {
    render(<RiskList {...defaultProps} risks={[]} />)

    expect(screen.getByText('No risks yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Use the form on the left to add your first risk and start tracking mitigation plans.'
      )
    ).toBeInTheDocument()
  })

  it('renders custom empty state when provided', () => {
    const customEmptyState = {
      title: 'Custom Title',
      description: 'Custom description',
    }
    
    render(
      <RiskList
        {...defaultProps}
        risks={[]}
        emptyState={customEmptyState}
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
  })

  it('renders risk cards for each risk', () => {
    render(<RiskList {...defaultProps} risks={mockRisks} />)

    expect(screen.getByTestId('risk-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('risk-card-2')).toBeInTheDocument()
    expect(screen.getByText('Test Risk 1')).toBeInTheDocument()
    expect(screen.getByText('Test Risk 2')).toBeInTheDocument()
  })

  it('passes correct props to RiskCard components', () => {
    const mockOnEdit = vi.fn()
    const mockOnDelete = vi.fn()
    const mockOnView = vi.fn()

    render(
      <RiskList
        risks={mockRisks}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    )

    // Check that RiskCard components have the expected buttons
    expect(screen.getByTestId('edit-1')).toBeInTheDocument()
    expect(screen.getByTestId('delete-1')).toBeInTheDocument()
    expect(screen.getByTestId('edit-2')).toBeInTheDocument()
    expect(screen.getByTestId('delete-2')).toBeInTheDocument()
  })

  it('renders Edit button even when onView is not provided', () => {
    render(<RiskList risks={mockRisks} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByTestId('edit-1')).toBeInTheDocument()
    expect(screen.getByTestId('edit-2')).toBeInTheDocument()
  })

  it('renders correct number of cards based on risk count', () => {
    const threeRisks = [
      ...mockRisks,
      {
        id: '3',
        title: 'Test Risk 3',
        description: 'Test Description 3',
        probability: 1,
        impact: 2,
        riskScore: 2,
        category: 'Compliance',
        status: 'closed',
        mitigationPlan: 'Third mitigation plan',
        creationDate: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
      },
    ]

    render(<RiskList {...defaultProps} risks={threeRisks} />)

    expect(screen.getByTestId('risk-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('risk-card-2')).toBeInTheDocument()
    expect(screen.getByTestId('risk-card-3')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(6) // 3 risks * 2 buttons each
  })

  it('applies correct grid classes for responsive layout', () => {
    render(<RiskList {...defaultProps} risks={mockRisks} />)

    const gridContainer = screen.getByTestId('risk-card-1').closest('div.grid')
    expect(gridContainer).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'xl:grid-cols-3',
      '2xl:grid-cols-4'
    )
  })

  it('passes correct risk data to each RiskCard', () => {
    render(<RiskList {...defaultProps} risks={mockRisks} />)

    expect(screen.getByText('Test Risk 1')).toBeInTheDocument()
    expect(screen.getByText('Test Risk 2')).toBeInTheDocument()
  })
})
