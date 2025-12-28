import { describe, it, expect } from 'vitest'

import { useRiskStore } from '../../src/stores/riskStore'

const getPersistOptions = () => {
  const persist = (useRiskStore as unknown as { persist?: { getOptions?: () => unknown } }).persist
  if (!persist?.getOptions) {
    throw new Error('Persist options are not available on useRiskStore.persist.getOptions()')
  }
  return persist.getOptions() as any
}

describe('RiskStore persistence migration', () => {
  it('should migrate legacy persisted state to preferences-only shape', () => {
    const migrate = getPersistOptions().migrate as (state: unknown, version: number) => any

    const persistedV1 = {
      risks: [
        {
          id: 'legacy-1',
          title: 'Legacy risk',
          description: 'Legacy description',
          probability: 2,
          impact: 3,
          category: 'Legacy Custom Category',
          status: 'open',
          mitigationPlan: 'Legacy plan',
          creationDate: '2023-01-01T00:00:00.000Z',
          lastModified: '2023-01-01T00:00:00.000Z',
        },
      ],
      categories: ['Legacy Custom Category'],
      filters: { search: '', category: 'all', status: 'all', severity: 'all' },
    }

    const migrated = migrate(persistedV1, 1)

    // Core register data must not be migrated into persistent browser storage.
    expect(migrated.risks).toBeUndefined()
    expect(migrated.categories).toBeUndefined()

    // Preferences survive migration.
    expect(migrated.filters.threatType).toBe('all')
    expect(migrated.filters.checklistStatus).toBe('all')
    expect(migrated.settings).toBeDefined()
    expect(migrated.settings.tooltipsEnabled).toBeTypeOf('boolean')
  })

  it('should drop legacy core data even when present', () => {
    const migrate = getPersistOptions().migrate as (state: unknown, version: number) => any

    const persistedV1 = {
      risks: [
        {
          id: 'legacy-2',
          title: 'Legacy with evidence',
          description: 'Legacy description',
          probability: 2,
          impact: 3,
          category: 'Security',
          status: 'open',
          mitigationPlan: 'Legacy plan',
          evidence: [
            { type: 'link', url: 'javascript:alert(1)', description: 'bad', addedAt: '2023-01-01' },
            { type: 'link', url: 'https://example.com/evidence', description: 'ok', addedAt: '2023-01-01' },
          ],
          creationDate: '2023-01-01T00:00:00.000Z',
          lastModified: '2023-01-01T00:00:00.000Z',
        },
      ],
      categories: ['Security'],
      filters: { search: '', category: 'all', status: 'all', severity: 'all' },
    }

    const migrated = migrate(persistedV1, 1)
    expect(migrated.risks).toBeUndefined()
    expect(migrated.categories).toBeUndefined()
  })
})

