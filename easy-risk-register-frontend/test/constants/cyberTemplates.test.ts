import { describe, expect, it } from 'vitest'

import { buildRiskDefaultsFromCyberTemplate, CYBER_RISK_TEMPLATES } from '../../src/constants/cyber'

describe('buildRiskDefaultsFromCyberTemplate', () => {
  it('returns a deep-cloned, independent set of defaults', () => {
    const template = CYBER_RISK_TEMPLATES[0]
    const nowIso = '2025-01-01T00:00:00.000Z'

    const snapshot = JSON.parse(JSON.stringify(template))

    const defaults = buildRiskDefaultsFromCyberTemplate(template, nowIso)

    expect(defaults.templateId).toBe(template.id)
    expect(defaults.threatType).toBe(template.threatType)
    expect(defaults.status).toBe('open')

    expect(defaults.mitigationSteps?.length).toBe(template.risk.mitigationSteps?.length ?? 0)
    if (defaults.mitigationSteps?.length && template.risk.mitigationSteps?.length) {
      expect(defaults.mitigationSteps[0].id).not.toBe(template.risk.mitigationSteps[0].id)
      expect(defaults.mitigationSteps[0].createdAt).toBe(nowIso)

      defaults.mitigationSteps[0].description = 'changed'
      expect(template.risk.mitigationSteps[0].description).toBe(snapshot.risk.mitigationSteps[0].description)
    }
  })
})

