import { describe, it, expect } from 'vitest'

import type { Risk } from '../../src/types/risk'
import { computeReminderSummary, getFrequencyMs } from '../../src/utils/reminders'

const baseRisk = (overrides: Partial<Risk>): Risk => ({
  id: 'r1',
  title: 'Test',
  description: 'Desc',
  probability: 3,
  impact: 3,
  riskScore: 9,
  category: 'Security',
  threatType: 'phishing',
  status: 'open',
  mitigationPlan: '',
  mitigationSteps: [],
  checklists: [],
  checklistStatus: 'not_started',
  owner: '',
  riskResponse: 'treat',
  ownerResponse: '',
  securityAdvisorComment: '',
  vendorResponse: '',
  evidence: [],
  creationDate: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  lastModified: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  ...overrides,
})

describe('reminders utils', () => {
  it('returns expected frequency durations', () => {
    expect(getFrequencyMs('daily')).toBe(1000 * 60 * 60 * 24)
    expect(getFrequencyMs('weekly')).toBe(1000 * 60 * 60 * 24 * 7)
    expect(getFrequencyMs('monthly')).toBe(1000 * 60 * 60 * 24 * 30)
  })

  it('counts overdue and due soon risks by earliest due/review date', () => {
    const now = new Date('2024-01-10T12:00:00.000Z').getTime()

    const risks: Risk[] = [
      baseRisk({ id: 'overdue', dueDate: new Date('2024-01-05T00:00:00.000Z').toISOString() }),
      baseRisk({ id: 'soon', reviewDate: new Date('2024-01-12T00:00:00.000Z').toISOString() }),
      baseRisk({ id: 'future', dueDate: new Date('2024-02-01T00:00:00.000Z').toISOString() }),
      baseRisk({ id: 'closed', status: 'closed', dueDate: new Date('2024-01-01T00:00:00.000Z').toISOString() }),
      baseRisk({
        id: 'both',
        dueDate: new Date('2024-01-20T00:00:00.000Z').toISOString(),
        reviewDate: new Date('2024-01-11T00:00:00.000Z').toISOString(),
      }),
    ]

    const summary = computeReminderSummary(risks, now)
    expect(summary.overdue).toBe(1)
    expect(summary.dueSoon).toBe(2)
    expect(summary.earliestDueMs).toBe(new Date('2024-01-05T00:00:00.000Z').getTime())
  })
})

