import { describe, expect, it } from 'vitest'

import { calculateRiskScore, getRiskSeverity } from './riskCalculations'

describe('risk scoring', () => {
  it('computes risk score as probability × impact (clamped 1-5)', () => {
    expect(calculateRiskScore(1, 1)).toBe(1)
    expect(calculateRiskScore(5, 5)).toBe(25)
    expect(calculateRiskScore(0, 5)).toBe(5)
    expect(calculateRiskScore(6, 5)).toBe(25)
  })

  it('maps boundary scores to severity using 1-8 low, 9-15 medium, 16-25 high', () => {
    expect(getRiskSeverity(1)).toBe('low')
    expect(getRiskSeverity(8)).toBe('low')
    expect(getRiskSeverity(9)).toBe('medium')
    expect(getRiskSeverity(15)).toBe('medium')
    expect(getRiskSeverity(16)).toBe('high')
    expect(getRiskSeverity(25)).toBe('high')
  })
})

