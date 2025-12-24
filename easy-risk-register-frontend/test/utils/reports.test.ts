import { describe, it, expect } from 'vitest'

import type { Risk, RiskFilters } from '../../src/types/risk'
import {
  buildPrivacyIncidentChecklistReportHtml,
  buildRiskRegisterReportHtml,
} from '../../src/utils/reports'

const baseRisk = (overrides: Partial<Risk>): Risk => ({
  id: 'r1',
  title: 'Test Risk',
  description: 'Test description',
  probability: 2,
  impact: 3,
  riskScore: 6,
  category: 'Security',
  threatType: 'phishing',
  status: 'open',
  mitigationPlan: '',
  mitigationSteps: [],
  checklists: [],
  checklistStatus: 'not_started',
  owner: 'Owner',
  riskResponse: 'treat',
  ownerResponse: '',
  securityAdvisorComment: '',
  vendorResponse: '',
  evidence: [],
  creationDate: new Date('2024-01-01T00:00:00.000Z').toISOString(),
  lastModified: new Date('2024-01-02T00:00:00.000Z').toISOString(),
  ...overrides,
})

const baseFilters: RiskFilters = {
  search: '',
  category: 'all',
  threatType: 'all',
  status: 'all',
  severity: 'all',
  checklistStatus: 'all',
}

describe('reports utils', () => {
  it('renders a risk register HTML report with filters and legend', () => {
    const html = buildRiskRegisterReportHtml({
      risks: [baseRisk({ title: 'R1 <script>' })],
      filters: { ...baseFilters, category: 'Security', search: 'phishing' },
      generatedAtIso: new Date('2024-01-10T00:00:00.000Z').toISOString(),
      matrixFilterLabel: 'Likelihood 2 × Impact 3',
    })

    expect(html).toContain('Risk register report')
    expect(html).toContain('Severity Legend')
    expect(html).toContain('Applied filters')
    expect(html).toContain('Category: Security')
    expect(html).toContain('Search: phishing')
    expect(html).toContain('Matrix: Likelihood 2 × Impact 3')
    expect(html).toContain('R1 &lt;script&gt;')
  })

  it('renders a privacy incident checklist report with completion summary', () => {
    const risk = baseRisk({
      title: 'Privacy incident',
      checklists: [
        {
          id: 'c1',
          templateId: 'checklist_privacy_incident_ndb_v1',
          title: 'Privacy incident response (NDB assist)',
          attachedAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          items: [
            {
              id: 'i1',
              description: 'Containment',
              createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
              completedAt: new Date('2024-01-02T00:00:00.000Z').toISOString(),
            },
            {
              id: 'i2',
              description: 'Assess serious harm',
              createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
            },
          ],
        },
      ],
    })

    const html = buildPrivacyIncidentChecklistReportHtml({
      risk,
      generatedAtIso: new Date('2024-01-10T00:00:00.000Z').toISOString(),
    })

    expect(html).toContain('Privacy incident / checklist report')
    expect(html).toContain('Completion:</span> 1/2')
    expect(html).toContain('Containment')
    expect(html).toContain('Assess serious harm')
  })
})

