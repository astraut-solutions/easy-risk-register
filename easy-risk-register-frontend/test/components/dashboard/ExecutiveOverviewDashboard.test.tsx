import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ExecutiveOverviewDashboard from '../../../src/components/dashboard/ExecutiveOverviewDashboard'
import type { Risk } from '../../../src/types/risk'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

vi.mock('recharts', () => {
  const passthrough = () => ({ children }: any) => <div>{children}</div>

  return {
    ResponsiveContainer: passthrough(),
    PieChart: passthrough(),
    Pie: passthrough(),
    Cell: passthrough(),
    BarChart: passthrough(),
    Bar: passthrough(),
    LineChart: passthrough(),
    Line: passthrough(),
    XAxis: passthrough(),
    YAxis: passthrough(),
    CartesianGrid: passthrough(),
    Tooltip: passthrough(),
    Legend: passthrough(),
  }
})

const baseRisk = (overrides: Partial<Risk>): Risk => ({
  id: overrides.id ?? 'risk_1',
  title: overrides.title ?? 'Test risk',
  description: overrides.description ?? 'Desc',
  probability: overrides.probability ?? 3,
  impact: overrides.impact ?? 3,
  riskScore: overrides.riskScore ?? 9,
  category: overrides.category ?? 'Security',
  status: overrides.status ?? 'open',
  threatType: overrides.threatType ?? 'other',
  mitigationPlan: overrides.mitigationPlan ?? '',
  checklistStatus: overrides.checklistStatus ?? 'not_started',
  checklists: overrides.checklists ?? [],
  evidence: overrides.evidence ?? [],
  mitigationSteps: overrides.mitigationSteps ?? [],
  riskResponse: overrides.riskResponse ?? 'treat',
  creationDate: overrides.creationDate ?? new Date().toISOString(),
  lastModified: overrides.lastModified ?? new Date().toISOString(),
  ...overrides,
})

describe('ExecutiveOverviewDashboard drill-down filters', () => {
  it('emits only supported RiskFilters keys', () => {
    const onDrillDown = vi.fn()
    render(
      <ExecutiveOverviewDashboard
        risks={[
          baseRisk({ id: 'r1', riskScore: 20 }),
          baseRisk({ id: 'r2', riskScore: 12, category: 'Compliance' }),
        ]}
        snapshots={[]}
        onDrillDown={onDrillDown}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /View High-Risk Items/i }))
    fireEvent.click(screen.getByRole('button', { name: /View Financial Impact/i }))
    fireEvent.click(screen.getByRole('button', { name: /View Compliance Risks/i }))

    expect(onDrillDown).toHaveBeenCalledTimes(3)

    const calls = onDrillDown.mock.calls.map((args) => args[0]?.filters)
    expect(calls[0]).toEqual({ severity: 'high' })
    expect(calls[1]).toEqual({ category: 'Financial' })
    expect(calls[2]).toEqual({ category: 'Compliance' })
  })
})
