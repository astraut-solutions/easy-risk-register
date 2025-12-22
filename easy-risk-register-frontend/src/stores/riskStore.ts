import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import Papa from 'papaparse'

import { DEFAULT_CATEGORIES, LOCAL_STORAGE_KEY } from '../constants/risk'
import type { Risk, RiskFilters, RiskInput } from '../types/risk'
import {
  DEFAULT_FILTERS,
  calculateRiskScore,
  computeRiskStats,
  filterRisks,
} from '../utils/riskCalculations'
import { sanitizeRiskInput, sanitizeTextInput, validateCSVContent } from '../utils/sanitization'
import ZustandEncryptedStorage from '../utils/ZustandEncryptedStorage'

const clampScore = (value: number) => Math.min(Math.max(Math.round(value), 1), 5)

const normalizeText = (value: string) => value.trim()

const buildRisk = (input: RiskInput): Risk => {
  // Sanitize the input before processing
  const sanitizedInput = sanitizeRiskInput(input) as RiskInput

  const now = new Date().toISOString()
  return {
    id: nanoid(12),
    title: normalizeText(sanitizedInput.title),
    description: normalizeText(sanitizedInput.description),
    probability: clampScore(sanitizedInput.probability),
    impact: clampScore(sanitizedInput.impact),
    riskScore: calculateRiskScore(sanitizedInput.probability, sanitizedInput.impact),
    category: normalizeText(sanitizedInput.category) || DEFAULT_CATEGORIES[0],
    status: sanitizedInput.status ?? 'open',
    mitigationPlan: normalizeText(sanitizedInput.mitigationPlan ?? ''),
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

// Updated safeStorage function to use encrypted storage when available
const safeStorage = () => {
  if (typeof window === 'undefined') {
    return memoryStorage()
  }

  // Check if secure storage is available, otherwise default to localStorage
  if (ZustandEncryptedStorage.isAvailable()) {
    return new ZustandEncryptedStorage()
  }

  return window.localStorage
}

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

export type CSVImportFailureReason =
  | 'empty'
  | 'invalid_content'
  | 'parse_error'
  | 'no_valid_rows'

export type CSVImportResult = { imported: number; reason?: CSVImportFailureReason }

const fromCSV = (csv: string): { risks: Risk[]; reason?: CSVImportFailureReason } => {
  if (!csv.trim()) {
    return { risks: [], reason: 'empty' }
  }

  // Validate CSV content for potential injection attacks
  if (!validateCSVContent(csv)) {
    console.error('CSV validation failed: Potential injection attack detected');
    return { risks: [], reason: 'invalid_content' }
  }

  // Use papaparse to securely parse the CSV
  const results = Papa.parse(csv, {
    header: true, // Use first row as headers
    skipEmptyLines: true,
    transform: (value) => {
      // Clean up the values during parsing
      return value ? value.toString().trim() : value;
    }
  });

  if (results.errors && results.errors.length > 0) {
    console.error('CSV parsing errors:', results.errors);
    // Continue processing even if there are errors - just log them
  }

  const hadRows = Array.isArray(results.data) && results.data.length > 0

  const risks = results.data
    .map((row: any) => {
      // Cast to any since papaparse returns unknown for parsed objects
      if (!row.title || !row.description) return null;

      return {
        id: row.id || nanoid(12),
        title: sanitizeTextInput(row.title ? row.title.toString().replace(/""/g, '"') : ''),
        description: sanitizeTextInput(row.description ? row.description.toString().replace(/""/g, '"') : ''),
        probability: clampScore(Number(row.probability) || 1),
        impact: clampScore(Number(row.impact) || 1),
        riskScore: calculateRiskScore(Number(row.probability) || 1, Number(row.impact) || 1),
        category: sanitizeTextInput(row.category || DEFAULT_CATEGORIES[0]),
        status: (row.status as Risk['status']) || 'open',
        mitigationPlan: sanitizeTextInput(row.mitigationPlan || ''),
        creationDate: row.creationDate || new Date().toISOString(),
        lastModified: row.lastModified || new Date().toISOString(),
      } satisfies Risk
    })
    .filter((risk): risk is Risk => Boolean(risk))

  if (!risks.length) {
    if (results.errors && results.errors.length > 0) {
      return { risks: [], reason: 'parse_error' }
    }

    return { risks: [], reason: hadRows ? 'no_valid_rows' : 'empty' }
  }

  return { risks }
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
  importFromCSV: (csv: string) => CSVImportResult
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
        // Sanitize the updates before applying them
        const sanitizedUpdates = sanitizeRiskInput(updates)

        let updatedRisk: Risk | null = null
        set((state) => {
          const risks = state.risks.map((risk) => {
            if (risk.id !== id) return risk
            const merged: Risk = {
              ...risk,
              ...('probability' in sanitizedUpdates
                ? { probability: clampScore(sanitizedUpdates.probability ?? risk.probability) }
                : {}),
              ...('impact' in sanitizedUpdates
                ? { impact: clampScore(sanitizedUpdates.impact ?? risk.impact) }
                : {}),
            }

            const probability = sanitizedUpdates.probability ?? merged.probability
            const impact = sanitizedUpdates.impact ?? merged.impact

            updatedRisk = {
              ...merged,
              title: sanitizedUpdates.title ? normalizeText(sanitizedUpdates.title) : merged.title,
              description: sanitizedUpdates.description
                ? normalizeText(sanitizedUpdates.description)
                : merged.description,
              category: sanitizedUpdates.category
                ? normalizeText(sanitizedUpdates.category)
                : merged.category,
              mitigationPlan: sanitizedUpdates.mitigationPlan
                ? normalizeText(sanitizedUpdates.mitigationPlan)
                : merged.mitigationPlan,
              status: sanitizedUpdates.status ?? merged.status,
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
          // Sanitize the category before adding
          const sanitizedCategory = sanitizeTextInput(category)
          const normalized = normalizeText(sanitizedCategory)
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
        const { risks, reason } = fromCSV(csv)
        if (!risks.length) {
          return { imported: 0, reason: reason ?? 'empty' }
        }
        set((state) => recalc([...risks, ...state.risks], state.filters))
        return { imported: risks.length }
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
