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

const isRiskStatus = (value: unknown): value is Risk['status'] =>
  value === 'open' || value === 'mitigated' || value === 'closed' || value === 'accepted'

const isRiskResponse = (value: unknown): value is Risk['riskResponse'] =>
  value === 'treat' || value === 'transfer' || value === 'tolerate' || value === 'terminate'

const isReviewCadence = (value: unknown): value is NonNullable<Risk['reviewCadence']> =>
  value === 'weekly' ||
  value === 'monthly' ||
  value === 'quarterly' ||
  value === 'semiannual' ||
  value === 'annual' ||
  value === 'ad-hoc'

const normalizeISODateOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Date.parse(trimmed)
  if (Number.isNaN(parsed)) return undefined
  return new Date(parsed).toISOString()
}

const normalizeEvidence = (value: unknown): Risk['evidence'] => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry: any) => {
      if (!entry || typeof entry !== 'object') return null
      if (typeof entry.url !== 'string' || !entry.url.trim()) return null

      const rawType = typeof entry.type === 'string' ? entry.type.trim() : 'link'
      const type: Risk['evidence'][number]['type'] =
        rawType === 'link' || rawType === 'ticket' || rawType === 'doc' || rawType === 'other'
          ? rawType
          : 'other'

      const description =
        typeof entry.description === 'string' && entry.description.trim()
          ? normalizeText(entry.description)
          : undefined

      const addedAt =
        typeof entry.addedAt === 'string' && entry.addedAt.trim()
          ? entry.addedAt.trim()
          : new Date().toISOString()

      return {
        type,
        url: entry.url.trim(),
        ...(description ? { description } : {}),
        addedAt,
      }
    })
    .filter((entry): entry is Risk['evidence'][number] => Boolean(entry))
}

const normalizeMitigationSteps = (value: unknown): Risk['mitigationSteps'] => {
  if (!Array.isArray(value)) return []

  return value
    .map((step: any) => {
      if (!step || typeof step !== 'object') return null
      if (typeof step.description !== 'string' || !step.description.trim()) return null

      const owner =
        typeof step.owner === 'string' && step.owner.trim()
          ? normalizeText(step.owner)
          : undefined

      const dueDate = normalizeISODateOrUndefined(step.dueDate)

      const status: Risk['mitigationSteps'][number]['status'] =
        step.status === 'done' || step.status === 'open' ? step.status : 'open'

      const createdAt =
        typeof step.createdAt === 'string' && step.createdAt.trim()
          ? step.createdAt.trim()
          : new Date().toISOString()

      const completedAt = normalizeISODateOrUndefined(step.completedAt)

      return {
        id: typeof step.id === 'string' && step.id.trim() ? step.id.trim() : nanoid(10),
        description: normalizeText(step.description),
        ...(owner ? { owner } : {}),
        ...(dueDate ? { dueDate } : {}),
        status,
        createdAt,
        ...(completedAt ? { completedAt } : {}),
      }
    })
    .filter((step): step is Risk['mitigationSteps'][number] => Boolean(step))
}

const normalizeStoredRisk = (raw: unknown): Risk => {
  const now = new Date().toISOString()
  const sanitized = sanitizeRiskInput((raw ?? {}) as Record<string, any>)

  const probability = clampScore(Number(sanitized.probability) || 1)
  const impact = clampScore(Number(sanitized.impact) || 1)
  const riskScore = calculateRiskScore(probability, impact)

  const creationDate =
    typeof sanitized.creationDate === 'string' && sanitized.creationDate.trim()
      ? sanitized.creationDate.trim()
      : now
  const lastModified =
    typeof sanitized.lastModified === 'string' && sanitized.lastModified.trim()
      ? sanitized.lastModified.trim()
      : creationDate

  const status = isRiskStatus(sanitized.status) ? sanitized.status : 'open'

  const riskResponse = isRiskResponse(sanitized.riskResponse)
    ? sanitized.riskResponse
    : 'treat'

  return {
    id:
      typeof sanitized.id === 'string' && sanitized.id.trim()
        ? sanitized.id.trim()
        : nanoid(12),
    title: normalizeText(sanitizeTextInput(String(sanitized.title ?? 'Untitled risk'))),
    description: normalizeText(sanitizeTextInput(String(sanitized.description ?? ''))),
    probability,
    impact,
    riskScore,
    category:
      typeof sanitized.category === 'string' && sanitized.category.trim()
        ? normalizeText(sanitized.category)
        : DEFAULT_CATEGORIES[0],
    status,
    mitigationPlan:
      typeof sanitized.mitigationPlan === 'string' ? normalizeText(sanitized.mitigationPlan) : '',
    mitigationSteps: normalizeMitigationSteps(sanitized.mitigationSteps),
    owner: typeof sanitized.owner === 'string' ? normalizeText(sanitized.owner) : '',
    ...(typeof sanitized.ownerTeam === 'string' && sanitized.ownerTeam.trim()
      ? { ownerTeam: normalizeText(sanitized.ownerTeam) }
      : {}),
    ...(normalizeISODateOrUndefined(sanitized.dueDate)
      ? { dueDate: normalizeISODateOrUndefined(sanitized.dueDate) }
      : {}),
    ...(normalizeISODateOrUndefined(sanitized.reviewDate)
      ? { reviewDate: normalizeISODateOrUndefined(sanitized.reviewDate) }
      : {}),
    ...(isReviewCadence(sanitized.reviewCadence)
      ? { reviewCadence: sanitized.reviewCadence }
      : {}),
    riskResponse,
    ownerResponse:
      typeof sanitized.ownerResponse === 'string' ? normalizeText(sanitized.ownerResponse) : '',
    securityAdvisorComment:
      typeof sanitized.securityAdvisorComment === 'string'
        ? normalizeText(sanitized.securityAdvisorComment)
        : '',
    vendorResponse:
      typeof sanitized.vendorResponse === 'string' ? normalizeText(sanitized.vendorResponse) : '',
    ...(typeof sanitized.notes === 'string' && sanitized.notes.trim()
      ? { notes: normalizeText(sanitized.notes) }
      : {}),
    evidence: normalizeEvidence(sanitized.evidence),
    creationDate,
    lastModified,
  }
}

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
    mitigationSteps: normalizeMitigationSteps(sanitizedInput.mitigationSteps),
    owner: normalizeText(sanitizedInput.owner ?? ''),
    ...(sanitizedInput.ownerTeam ? { ownerTeam: normalizeText(sanitizedInput.ownerTeam) } : {}),
    ...(normalizeISODateOrUndefined(sanitizedInput.dueDate)
      ? { dueDate: normalizeISODateOrUndefined(sanitizedInput.dueDate) }
      : {}),
    ...(normalizeISODateOrUndefined(sanitizedInput.reviewDate)
      ? { reviewDate: normalizeISODateOrUndefined(sanitizedInput.reviewDate) }
      : {}),
    ...(isReviewCadence(sanitizedInput.reviewCadence)
      ? { reviewCadence: sanitizedInput.reviewCadence }
      : {}),
    riskResponse: isRiskResponse(sanitizedInput.riskResponse)
      ? sanitizedInput.riskResponse
      : 'treat',
    ownerResponse: normalizeText(sanitizedInput.ownerResponse ?? ''),
    securityAdvisorComment: normalizeText(sanitizedInput.securityAdvisorComment ?? ''),
    vendorResponse: normalizeText(sanitizedInput.vendorResponse ?? ''),
    ...(sanitizedInput.notes ? { notes: normalizeText(sanitizedInput.notes) } : {}),
    evidence: normalizeEvidence(sanitizedInput.evidence),
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

export type CSVExportVariant = 'standard' | 'audit_pack'

const CSV_SPEC_VERSION = 1 as const

const CSV_STANDARD_COLUMNS = [
  'csvSpecVersion',
  'csvVariant',
  'id',
  'title',
  'description',
  'probability',
  'impact',
  'riskScore',
  'category',
  'status',
  'mitigationPlan',
  'owner',
  'ownerTeam',
  'dueDate',
  'reviewDate',
  'reviewCadence',
  'riskResponse',
  'ownerResponse',
  'securityAdvisorComment',
  'vendorResponse',
  'notes',
  'evidenceJson',
  'mitigationStepsJson',
  'creationDate',
  'lastModified',
] as const

const CSV_AUDIT_PACK_COLUMNS = [
  ...CSV_STANDARD_COLUMNS,
  'evidenceCount',
  'evidenceUrls',
  'evidenceTypes',
  'evidenceAddedAt',
  'mitigationStepsOpenCount',
  'mitigationStepsDoneCount',
] as const

type CSVColumnStandard = (typeof CSV_STANDARD_COLUMNS)[number]
type CSVColumnAuditPack = (typeof CSV_AUDIT_PACK_COLUMNS)[number]

const toCSV = (risks: Risk[], variant: CSVExportVariant = 'standard'): string => {
  const columns = variant === 'audit_pack' ? CSV_AUDIT_PACK_COLUMNS : CSV_STANDARD_COLUMNS

  const data = risks.map((risk) => {
    const base: Record<CSVColumnStandard, string | number> = {
      csvSpecVersion: CSV_SPEC_VERSION,
      csvVariant: variant,
      id: risk.id,
      title: risk.title,
      description: risk.description,
      probability: risk.probability,
      impact: risk.impact,
      riskScore: risk.riskScore,
      category: risk.category,
      status: risk.status,
      mitigationPlan: risk.mitigationPlan,
      owner: risk.owner,
      ownerTeam: risk.ownerTeam ?? '',
      dueDate: risk.dueDate ?? '',
      reviewDate: risk.reviewDate ?? '',
      reviewCadence: risk.reviewCadence ?? '',
      riskResponse: risk.riskResponse,
      ownerResponse: risk.ownerResponse,
      securityAdvisorComment: risk.securityAdvisorComment,
      vendorResponse: risk.vendorResponse,
      notes: risk.notes ?? '',
      evidenceJson: JSON.stringify(risk.evidence ?? []),
      mitigationStepsJson: JSON.stringify(risk.mitigationSteps ?? []),
      creationDate: risk.creationDate,
      lastModified: risk.lastModified,
    }

    if (variant !== 'audit_pack') {
      return base
    }

    const openSteps = (risk.mitigationSteps ?? []).filter((step) => step.status !== 'done').length
    const doneSteps = (risk.mitigationSteps ?? []).filter((step) => step.status === 'done').length

    const audit: Record<CSVColumnAuditPack, string | number> = {
      ...(base as Record<CSVColumnAuditPack, string | number>),
      evidenceCount: (risk.evidence ?? []).length,
      evidenceUrls: (risk.evidence ?? []).map((entry) => entry.url).join(' '),
      evidenceTypes: (risk.evidence ?? []).map((entry) => entry.type).join(' '),
      evidenceAddedAt: (risk.evidence ?? []).map((entry) => entry.addedAt).join(' '),
      mitigationStepsOpenCount: openSteps,
      mitigationStepsDoneCount: doneSteps,
    }

    return audit
  })

  return Papa.unparse(data, {
    columns: [...columns],
    header: true,
    newline: '\n',
    quotes: true,
    escapeFormulae: true,
  })
}

export type CSVImportFailureReason =
  | 'empty'
  | 'invalid_content'
  | 'parse_error'
  | 'no_valid_rows'

export type CSVImportResult = { imported: number; reason?: CSVImportFailureReason }

const parseJsonArray = <T,>(value: unknown): T[] => {
  if (typeof value !== 'string') return []
  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

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

      const now = new Date().toISOString()

      const evidenceJson = row.evidenceJson ?? row.evidence ?? ''
      const mitigationStepsJson = row.mitigationStepsJson ?? row.mitigationSteps ?? ''

      const evidenceFromJson = parseJsonArray<Risk['evidence'][number]>(evidenceJson)
      const mitigationStepsFromJson =
        parseJsonArray<Risk['mitigationSteps'][number]>(mitigationStepsJson)

      const evidenceFromUrls =
        !evidenceFromJson.length && typeof row.evidenceUrls === 'string' && row.evidenceUrls.trim()
          ? row.evidenceUrls
              .split(/\s+/)
              .filter(Boolean)
              .map((url: string) => ({ type: 'link', url, addedAt: now }))
          : []

      const importedRaw = {
        id: row.id || nanoid(12),
        title: row.title,
        description: row.description,
        probability: Number(row.probability) || 1,
        impact: Number(row.impact) || 1,
        category: row.category || DEFAULT_CATEGORIES[0],
        status: row.status,
        mitigationPlan: row.mitigationPlan || '',
        mitigationSteps: mitigationStepsFromJson,
        owner: row.owner || '',
        ownerTeam: row.ownerTeam || undefined,
        dueDate: row.dueDate || undefined,
        reviewDate: row.reviewDate || undefined,
        reviewCadence: row.reviewCadence || undefined,
        riskResponse: row.riskResponse || undefined,
        ownerResponse: row.ownerResponse || '',
        securityAdvisorComment: row.securityAdvisorComment || '',
        vendorResponse: row.vendorResponse || '',
        notes: row.notes || undefined,
        evidence: evidenceFromJson.length ? evidenceFromJson : evidenceFromUrls,
        creationDate: row.creationDate || now,
        lastModified: row.lastModified || row.creationDate || now,
      }

      const normalized = normalizeStoredRisk(importedRaw)
      return normalized satisfies Risk
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
  exportToCSV: (variant?: CSVExportVariant) => string
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
    owner: 'Finance Ops Lead',
    ownerTeam: 'Finance',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    reviewCadence: 'monthly',
    evidence: [
      {
        type: 'ticket',
        url: 'https://example.com/tickets/psp-failover',
        description: 'Tracking failover workstream',
        addedAt: new Date().toISOString(),
      },
    ],
    mitigationSteps: [
      {
        id: 'seed-psp-1',
        description: 'Identify secondary PSP and contract terms',
        owner: 'Procurement',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        status: 'open',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed-psp-2',
        description: 'Implement health checks and smoke tests',
        owner: 'Engineering',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    title: 'Vendor compliance gap',
    description: 'Key vendor contract missing updated DPA for latest regulation.',
    probability: 2,
    impact: 4,
    category: 'Compliance',
    status: 'accepted',
    mitigationPlan: 'Legal review scheduled and updated contract template drafted.',
    owner: 'Vendor Manager',
    ownerTeam: 'Legal',
    reviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    reviewCadence: 'quarterly',
    ownerResponse: 'Temporary acceptance until contract update is executed.',
    securityAdvisorComment: 'Ensure vendor SOC 2 report is obtained annually.',
    evidence: [
      {
        type: 'doc',
        url: 'https://example.com/docs/vendor-dpa-redline',
        description: 'Draft DPA redline',
        addedAt: new Date().toISOString(),
      },
    ],
  },
  {
    title: 'Phishing vulnerability',
    description: 'Limited phishing training leading to increased credential attacks.',
    probability: 4,
    impact: 3,
    category: 'Security',
    status: 'open',
    mitigationPlan: 'Roll out quarterly training and MFA hardening.',
    owner: 'Security Lead',
    ownerTeam: 'Security',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    reviewCadence: 'monthly',
    vendorResponse: 'MFA enforcement is supported by the IdP vendor.',
    evidence: [
      {
        type: 'link',
        url: 'https://example.com/runbooks/phishing-response',
        description: 'Incident response runbook',
        addedAt: new Date().toISOString(),
      },
    ],
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
              mitigationSteps:
                'mitigationSteps' in sanitizedUpdates
                  ? normalizeMitigationSteps(sanitizedUpdates.mitigationSteps)
                  : merged.mitigationSteps,
              owner:
                'owner' in sanitizedUpdates
                  ? normalizeText(String(sanitizedUpdates.owner ?? ''))
                  : merged.owner,
              ownerTeam:
                'ownerTeam' in sanitizedUpdates
                  ? typeof sanitizedUpdates.ownerTeam === 'string' && sanitizedUpdates.ownerTeam.trim()
                    ? normalizeText(sanitizedUpdates.ownerTeam)
                    : undefined
                  : merged.ownerTeam,
              dueDate:
                'dueDate' in sanitizedUpdates
                  ? normalizeISODateOrUndefined(sanitizedUpdates.dueDate)
                  : merged.dueDate,
              reviewDate:
                'reviewDate' in sanitizedUpdates
                  ? normalizeISODateOrUndefined(sanitizedUpdates.reviewDate)
                  : merged.reviewDate,
              reviewCadence:
                'reviewCadence' in sanitizedUpdates
                  ? isReviewCadence(sanitizedUpdates.reviewCadence)
                    ? sanitizedUpdates.reviewCadence
                    : undefined
                  : merged.reviewCadence,
              riskResponse:
                'riskResponse' in sanitizedUpdates
                  ? isRiskResponse(sanitizedUpdates.riskResponse)
                    ? sanitizedUpdates.riskResponse
                    : merged.riskResponse
                  : merged.riskResponse,
              ownerResponse:
                'ownerResponse' in sanitizedUpdates
                  ? normalizeText(String(sanitizedUpdates.ownerResponse ?? ''))
                  : merged.ownerResponse,
              securityAdvisorComment:
                'securityAdvisorComment' in sanitizedUpdates
                  ? normalizeText(String(sanitizedUpdates.securityAdvisorComment ?? ''))
                  : merged.securityAdvisorComment,
              vendorResponse:
                'vendorResponse' in sanitizedUpdates
                  ? normalizeText(String(sanitizedUpdates.vendorResponse ?? ''))
                  : merged.vendorResponse,
              notes:
                'notes' in sanitizedUpdates
                  ? typeof sanitizedUpdates.notes === 'string' && sanitizedUpdates.notes.trim()
                    ? normalizeText(sanitizedUpdates.notes)
                    : undefined
                  : merged.notes,
              evidence:
                'evidence' in sanitizedUpdates
                  ? normalizeEvidence(sanitizedUpdates.evidence)
                  : merged.evidence,
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
      exportToCSV: (variant) => {
        const state = get()
        return toCSV(state.risks, variant ?? 'standard')
      },
      importFromCSV: (csv) => {
        const { risks, reason } = fromCSV(csv)
        if (!risks.length) {
          return { imported: 0, reason: reason ?? 'empty' }
        }
        set((state) => {
          const mergedRisks = [...risks, ...state.risks]
          const baseCategories =
            state.categories && state.categories.length
              ? state.categories
              : [...DEFAULT_CATEGORIES]
          const categories = Array.from(
            new Set([...baseCategories, ...risks.map((risk) => risk.category)].filter(Boolean)),
          )
          return { ...recalc(mergedRisks, state.filters), categories }
        })
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
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState
        }

        if (version >= 2) {
          return persistedState
        }

        const state = persistedState as any
        const risks: Risk[] = Array.isArray(state.risks)
          ? state.risks.map((risk: any) => normalizeStoredRisk(risk))
          : []

        const categories: string[] = Array.isArray(state.categories)
          ? Array.from(
              new Set(
                [...DEFAULT_CATEGORIES, ...state.categories]
                  .map((category) =>
                    typeof category === 'string' ? sanitizeTextInput(category).trim() : '',
                  )
                  .filter(Boolean),
              ),
            )
          : [...DEFAULT_CATEGORIES]

        const filters = state.filters ?? { ...DEFAULT_FILTERS }

        return {
          ...state,
          risks,
          categories,
          filters,
          filteredRisks: filterRisks(risks, filters),
          stats: computeRiskStats(risks),
        }
      },
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
