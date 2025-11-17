import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskSummaryCards } from './RiskSummaryCards'
import type { RiskStats } from '../../types/risk'

// Provide a static mock for framer-motion to avoid animation side effects in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => (
        <div data-motion-component="div" {...props}>
          {children}
        </div>
      ),
    },
  }
})

const statCardMock = vi.fn(({ label, value, description, accent }: any) => (
  <div data-testid={`stat-card-${label}`} data-accent={accent}>
    <span>{label}</span>
    <strong>{value}</strong>
    <p>{description}</p>
  </div>
))

vi.mock('../../design-system', async () => {
  const actual = await vi.importActual('../../design-system')
  return {
    ...actual,
    StatCard: (props: any) => statCardMock(props),
  }
})

const sampleStats: RiskStats = {
  total: 42,
  byStatus: {
    open: 18,
    mitigated: 20,
    closed: 4,
  },
  bySeverity: {
    high: 5,
    medium: 12,
    low: 25,
  },
  averageScore: 4.25,
  maxScore: 12,
  updatedAt: '2024-05-01T12:30:00.000Z',
}

describe('RiskSummaryCards', () => {
  afterEach(() => {
    statCardMock.mockClear()
  })

  it('renders a stat card for each summary metric', () => {
    render(<RiskSummaryCards stats={sampleStats} />)

    expect(screen.getByTestId('stat-card-Total Risks')).toHaveTextContent('42')
    expect(screen.getByTestId('stat-card-High Severity')).toHaveTextContent('5')
    expect(screen.getByTestId('stat-card-Open vs Mitigated')).toHaveTextContent('18/20')
    expect(screen.getByTestId('stat-card-Average Score')).toHaveTextContent('4.3')
  })

  it('maps card accent props to design-system accents', () => {
    render(<RiskSummaryCards stats={sampleStats} />)

    expect(statCardMock).toHaveBeenCalledTimes(4)
    const accents = statCardMock.mock.calls.map((call) => call[0].accent)
    expect(accents).toEqual(['brand', 'danger', 'warning', 'success'])
  })

  it('displays severity badges and last updated text', () => {
    render(<RiskSummaryCards stats={sampleStats} />)

    expect(screen.getByText('High: 5')).toBeInTheDocument()
    expect(screen.getByText('Medium: 12')).toBeInTheDocument()
    expect(screen.getByText('Low: 25')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('Updated') && content.includes('2024'))
    ).toBeInTheDocument()
  })
})
