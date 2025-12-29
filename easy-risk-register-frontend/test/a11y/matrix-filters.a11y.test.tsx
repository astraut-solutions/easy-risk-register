import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import { RiskFiltersBar } from '../../src/components/risk/RiskFilters'
import { RiskMatrix } from '../../src/components/risk/RiskMatrix'
import type { Risk } from '../../src/types/risk'
import { DEFAULT_FILTERS } from '../../src/utils/riskCalculations'

async function runAxe(target: Element) {
  const axeModule: any = await import('axe-core')
  const axe: any = axeModule.default ?? axeModule

  return axe.run(target, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
    rules: {
      'color-contrast': { enabled: false },
    },
  })
}

describe('A11y smoke: matrix + filters', () => {
  it('has no serious/critical axe violations', async () => {
    const risks: Risk[] = [
      {
        id: '1',
        title: 'Test risk',
        description: 'Test risk description',
        probability: 5,
        impact: 4,
        riskScore: 20,
        category: 'Security',
        status: 'open',
        threatType: 'phishing' as any,
        mitigationPlan: '',
        mitigationSteps: [],
        owner: '',
        riskResponse: 'treat' as any,
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        evidence: [],
        creationDate: '2023-01-01T00:00:00.000Z',
        lastModified: '2023-01-01T00:00:00.000Z',
        checklists: [],
        checklistStatus: 'not_started' as any,
      },
    ]

    const { container } = render(
      <div>
        <RiskFiltersBar
          filters={DEFAULT_FILTERS}
          categories={['Security', 'Operational']}
          onChange={() => {}}
          onReset={() => {}}
        />
        <RiskMatrix risks={risks} onSelect={() => {}} />
      </div>,
    )

    const results = await runAxe(container)
    const serious = results.violations.filter((v: any) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious).toEqual([])
  })
})

