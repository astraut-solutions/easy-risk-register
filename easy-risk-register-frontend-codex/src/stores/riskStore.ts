import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'

import { DEFAULT_CATEGORIES, LOCAL_STORAGE_KEY } from '../constants/risk'
import type { Risk, RiskFilters, RiskInput } from '../types/risk'
import {
  DEFAULT_FILTERS,
  calculateRiskScore,
  computeRiskStats,
  filterRisks,
} from '../utils/riskCalculations'

const clampScore = (value: number) => Math.min(Math.max(Math.round(value), 1), 5)

const normalizeText = (value: string) => value.trim()

const buildRisk = (input: RiskInput): Risk => {
  const now = new Date().toISOString()
  return {
    id: nanoid(12),
    title: normalizeText(input.title),
    description: normalizeText(input.description),
    probability: clampScore(input.probability),
    impact: clampScore(input.impact),
    riskScore: calculateRiskScore(input.probability, input.impact),
    category: normalizeText(input.category) || DEFAULT_CATEGORIES[0],
    status: input.status ?? 'open',
    mitigationPlan: normalizeText(input.mitigationPlan ?? ''),
    creationDate: now,
    lastModified: now,
  }
}

const memoryStorage = (): Storage => {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  } as Storage
}

const safeStorage = () =>
  typeof window === 'undefined' ? memoryStorage() : window.localStorage

const toCSV = (risks: Risk[]): string => {
  const header = [
    'id',
    'title',
    'description',
    'probability',
    'impact',
    'riskScore',
    'category',
    'status',
    'mitigationPlan',
    'creationDate',
    'lastModified',
  ]

  const rows = risks.map((risk) =>
    [
      risk.id,
      `"${risk.title.replace(/"/g, '""')}"`,
      `"${risk.description.replace(/"/g, '""')}"`,
      risk.probability,
      risk.impact,
      risk.riskScore,
      risk.category,
      risk.status,
      `"${risk.mitigationPlan.replace(/"/g, '""')}"`,
      risk.creationDate,
      risk.lastModified,
    ].join(','),
  )

  return [header.join(','), ...rows].join('\n')
}

const fromCSV = (csv: string): Risk[] => {
  const [, ...rows] = csv
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return rows
    .map((row) => {
      const [id, title, description, probability, impact, , category, status, mitigationPlan, creationDate, lastModified] =
        row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)

      if (!title || !description) return null
      return {
        id: id?.replaceAll('"', '') || nanoid(12),
        title: title.replace(/^"|"$/g, '').replace(/""/g, '"'),
        description: description.replace(/^"|"$/g, '').replace(/""/g, '"'),
        probability: clampScore(Number(probability) || 1),
        impact: clampScore(Number(impact) || 1),
        riskScore: calculateRiskScore(Number(probability) || 1, Number(impact) || 1),
        category: (category || DEFAULT_CATEGORIES[0]).replace(/^"|"$/g, ''),
        status: (status?.replace(/^"|"$/g, '') as Risk['status']) ?? 'open',
        mitigationPlan: (mitigationPlan || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
        creationDate: creationDate || new Date().toISOString(),
        lastModified: lastModified || new Date().toISOString(),
      } satisfies Risk
    })
    .filter((risk): risk is Risk => Boolean(risk))
}

export interface RiskStoreState {
  initialized: boolean
  risks: Risk[]
  filteredRisks: Risk[]
  categories: string[]
  filters: RiskFilters
  stats: ReturnType<typeof computeRiskStats>
  addRisk: (input: RiskInput) => Risk
  updateRisk: (
    id: string,
    updates: Partial<RiskInput> & { status?: Risk['status'] },
  ) => Risk | null
  deleteRisk: (id: string) => void
  addCategory: (category: string) => void
  setFilters: (updates: Partial<RiskFilters>) => void
  bulkImport: (risks: Risk[]) => void
  exportToCSV: () => string
  importFromCSV: (csv: string) => number
  seedDemoData: () => number
}

const recalc = (risks: Risk[], filters: RiskFilters) => ({
  risks,
  filteredRisks: filterRisks(risks, filters),
  stats: computeRiskStats(risks),
})

const seedData: RiskInput[] = [
  {
    title: 'Payment processor outage',
    description: 'Primary payment gateway has a single point of failure with no redundancy.',
    probability: 3,
    impact: 5,
    category: 'Operational',
    status: 'open',
    mitigationPlan: 'Add backup PSP integration and automated smoke tests.',
  },
  {
    title: 'Vendor compliance gap',
    description: 'Key vendor contract missing updated DPA for latest regulation.',
    probability: 2,
    impact: 4,
    category: 'Compliance',
    status: 'mitigated',
    mitigationPlan: 'Legal review scheduled and updated contract template drafted.',
  },
  {
    title: 'Phishing vulnerability',
    description: 'Limited phishing training leading to increased credential attacks.',
    probability: 4,
    impact: 3,
    category: 'Security',
    status: 'open',
    mitigationPlan: 'Roll out quarterly training and MFA hardening.',
  },
]

export const useRiskStore = create<RiskStoreState>()(
  persist(
    (set, get) => ({
      initialized: false,
      risks: [],
      filteredRisks: [],
      categories: [...DEFAULT_CATEGORIES],
      filters: { ...DEFAULT_FILTERS },
      stats: computeRiskStats([]),
      addRisk: (input) => {
        const risk = buildRisk(input)
        set((state) => recalc([risk, ...state.risks], state.filters))
        return risk
      },
      updateRisk: (id, updates) => {
        let updatedRisk: Risk | null = null
        set((state) => {
          const risks = state.risks.map((risk) => {
            if (risk.id !== id) return risk
            const merged: Risk = {
              ...risk,
              ...('probability' in updates
                ? { probability: clampScore(updates.probability ?? risk.probability) }
                : {}),
              ...('impact' in updates
                ? { impact: clampScore(updates.impact ?? risk.impact) }
                : {}),
            }

            const probability = updates.probability ?? merged.probability
            const impact = updates.impact ?? merged.impact

            updatedRisk = {
              ...merged,
              title: updates.title ? normalizeText(updates.title) : merged.title,
              description: updates.description
                ? normalizeText(updates.description)
                : merged.description,
              category: updates.category
                ? normalizeText(updates.category)
                : merged.category,
              mitigationPlan: updates.mitigationPlan
                ? normalizeText(updates.mitigationPlan)
                : merged.mitigationPlan,
              status: updates.status ?? merged.status,
              probability,
              impact,
              riskScore: calculateRiskScore(probability, impact),
              lastModified: new Date().toISOString(),
            }
            return updatedRisk
          })
          return recalc(risks, state.filters)
        })
        return updatedRisk
      },
      deleteRisk: (id) =>
        set((state) => {
          const risks = state.risks.filter((risk) => risk.id !== id)
          return recalc(risks, state.filters)
        }),
      addCategory: (category) =>
        set((state) => {
          const normalized = normalizeText(category)
          if (!normalized || state.categories.includes(normalized)) return state
          return { categories: [...state.categories, normalized] }
        }),
      setFilters: (updates) =>
        set((state) => {
          const filters = { ...state.filters, ...updates }
          return {
            filters,
            filteredRisks: filterRisks(state.risks, filters),
          }
        }),
      bulkImport: (risks) =>
        set((state) => {
          const merged = [...risks, ...state.risks]
          return recalc(merged, state.filters)
        }),
      exportToCSV: () => {
        const state = get()
        return toCSV(state.risks)
      },
      importFromCSV: (csv) => {
        const parsed = fromCSV(csv)
        if (!parsed.length) return 0
        set((state) => recalc([...parsed, ...state.risks], state.filters))
        return parsed.length
      },
      seedDemoData: () => {
        const state = get()
        if (state.risks.length) return 0
        const seeded = seedData.map((item) => ({
          ...buildRisk(item),
          status: item.status ?? 'open',
        }))
        set((current) => recalc([...seeded, ...current.risks], current.filters))
        return seeded.length
      },
    }),
    {
      name: LOCAL_STORAGE_KEY,
      storage: createJSONStorage(safeStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.initialized = true
        const filters = state.filters ?? { ...DEFAULT_FILTERS }
        const stats = computeRiskStats(state.risks)
        state.filteredRisks = filterRisks(state.risks, filters)
        state.stats = stats
      },
    },
  ),
)

export const selectRiskById = (id: string) => (state: RiskStoreState) =>
  state.risks.find((risk) => risk.id === id)

export const riskSeverityPalette = {
  low: 'text-status-success bg-status-success/10 border-status-success/40',
  medium: 'text-status-warning bg-status-warning/10 border-status-warning/40',
  high: 'text-status-danger bg-status-danger/10 border-status-danger/40',
}
