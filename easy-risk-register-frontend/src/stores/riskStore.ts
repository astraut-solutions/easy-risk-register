import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import Papa from 'papaparse'

import { DEFAULT_CATEGORIES, LOCAL_STORAGE_KEY } from '../constants/risk'
import { COMPLIANCE_CHECKLIST_TEMPLATES, buildChecklistInstanceFromTemplate } from '../constants/cyber'
import type { Risk, RiskFilters, RiskInput, RiskPlaybookStep } from '../types/risk'
import type {
  MaturityAssessment,
  MaturityFrameworkPreset,
  MaturityDomainScore,
  RiskScoreSnapshot,
  ScoreHistoryRetention,
  TrendDefaultMode,
} from '../types/visualization'
import {
  DEFAULT_FILTERS,
  calculateRiskScore,
  computeRiskStats,
  filterRisks,
} from '../utils/riskCalculations'
import { applySnapshotRetention } from '../utils/snapshotRetention'
import { sanitizeRiskInput, sanitizeTextInput, validateCSVContent } from '../utils/sanitization'
import { RiskRegisterPersistStorage } from '../utils/RiskRegisterPersistStorage'

export type ReminderFrequency = 'daily' | 'weekly' | 'monthly'

export interface ReminderSettings {
  enabled: boolean
  frequency: ReminderFrequency
  preferNotifications: boolean
  lastTriggeredAt?: string
}

export interface AppSettings {
  tooltipsEnabled: boolean
  onboardingDismissed: boolean
  reminders: ReminderSettings
  visualizations: {
    scoreHistoryEnabled: boolean
    scoreHistoryRetention: ScoreHistoryRetention
    defaultTrendMode: TrendDefaultMode
    maturityEnabled: boolean
    maturityFrameworkPreset: MaturityFrameworkPreset
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  tooltipsEnabled: true,
  onboardingDismissed: false,
  reminders: {
    enabled: false,
    frequency: 'weekly',
    preferNotifications: false,
    lastTriggeredAt: undefined,
  },
  visualizations: {
    scoreHistoryEnabled: true,
    scoreHistoryRetention: { mode: 'days', value: 365 },
    defaultTrendMode: 'overall_exposure',
    maturityEnabled: false,
    maturityFrameworkPreset: 'acsc_essential_eight',
  },
}

export type RiskDataSyncStatus = 'idle' | 'loading' | 'ready' | 'error'

const clampScore = (value: number) => Math.min(Math.max(Math.round(value), 1), 5)

const normalizeText = (value: string) => value.trim()

const buildRiskScoreSnapshot = (
  risk: Pick<Risk, 'id' | 'probability' | 'impact' | 'riskScore'>,
): RiskScoreSnapshot => ({
  riskId: risk.id,
  timestamp: Date.now(),
  probability: clampScore(risk.probability),
  impact: clampScore(risk.impact),
  riskScore: Math.min(Math.max(Math.round(risk.riskScore), 1), 25),
})

const normalizeRiskScoreSnapshot = (value: unknown): RiskScoreSnapshot | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as any
  if (typeof raw.riskId !== 'string' || !raw.riskId.trim()) return null

  const timestamp = typeof raw.timestamp === 'number' && Number.isFinite(raw.timestamp) ? raw.timestamp : NaN
  const probability = typeof raw.probability === 'number' && Number.isFinite(raw.probability) ? raw.probability : NaN
  const impact = typeof raw.impact === 'number' && Number.isFinite(raw.impact) ? raw.impact : NaN
  const riskScore = typeof raw.riskScore === 'number' && Number.isFinite(raw.riskScore) ? raw.riskScore : NaN

  if (!Number.isFinite(timestamp)) return null
  if (!Number.isFinite(probability) || !Number.isFinite(impact) || !Number.isFinite(riskScore)) return null

  return {
    riskId: raw.riskId.trim(),
    timestamp,
    probability: clampScore(probability),
    impact: clampScore(impact),
    riskScore: Math.min(Math.max(Math.round(riskScore), 1), 25),
  }
}

const isRiskStatus = (value: unknown): value is Risk['status'] =>
  value === 'open' || value === 'mitigated' || value === 'closed' || value === 'accepted'

const isRiskResponse = (value: unknown): value is Risk['riskResponse'] =>
  value === 'treat' || value === 'transfer' || value === 'tolerate' || value === 'terminate'

const isThreatType = (value: unknown): value is Risk['threatType'] =>
  value === 'phishing' ||
  value === 'ransomware' ||
  value === 'business_email_compromise' ||
  value === 'malware' ||
  value === 'vulnerability' ||
  value === 'data_breach' ||
  value === 'supply_chain' ||
  value === 'insider' ||
  value === 'other'

const isReviewCadence = (value: unknown): value is NonNullable<Risk['reviewCadence']> =>
  value === 'weekly' ||
  value === 'monthly' ||
  value === 'quarterly' ||
  value === 'semiannual' ||
  value === 'annual' ||
  value === 'ad-hoc'

const isReminderFrequency = (value: unknown): value is ReminderFrequency =>
  value === 'daily' || value === 'weekly' || value === 'monthly'

const isTrendDefaultMode = (value: unknown): value is TrendDefaultMode =>
  value === 'overall_exposure' || value === 'recent_changes'

const isMaturityFrameworkPreset = (value: unknown): value is MaturityFrameworkPreset =>
  value === 'acsc_essential_eight' || value === 'nist_csf'

const maturityPresets: Record<
  MaturityFrameworkPreset,
  { frameworkName: string; domains: Array<{ key: string; name: string }> }
> = {
  acsc_essential_eight: {
    frameworkName: 'ACSC Essential Eight (self-assessment)',
    domains: [
      { key: 'application_control', name: 'Application control' },
      { key: 'patch_applications', name: 'Patch applications' },
      { key: 'patch_operating_systems', name: 'Patch operating systems' },
      { key: 'mfa', name: 'Multi-factor authentication (MFA)' },
      { key: 'restrict_admin', name: 'Restrict administrative privileges' },
      { key: 'backups', name: 'Regular backups' },
      { key: 'user_application_hardening', name: 'User application hardening' },
      { key: 'macro_settings', name: 'Macro settings' },
    ],
  },
  nist_csf: {
    frameworkName: 'NIST CSF (self-assessment)',
    domains: [
      { key: 'identify', name: 'Identify' },
      { key: 'protect', name: 'Protect' },
      { key: 'detect', name: 'Detect' },
      { key: 'respond', name: 'Respond' },
      { key: 'recover', name: 'Recover' },
    ],
  },
}

const clampMaturityScore = (value: number) => Math.max(0, Math.min(Math.floor(value), 4))

const normalizeMaturityDomainScore = (value: unknown): MaturityDomainScore | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as any
  if (typeof raw.key !== 'string' || !raw.key.trim()) return null
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null
  if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) return null
  const notes = typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes : undefined
  return {
    key: raw.key.trim(),
    name: raw.name.trim(),
    score: clampMaturityScore(raw.score),
    notes,
  }
}

const normalizeMaturityAssessment = (value: unknown): MaturityAssessment | null => {
  if (!value || typeof value !== 'object') return null
  const raw = value as any
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null
  if (!isMaturityFrameworkPreset(raw.frameworkKey)) return null

  const frameworkKey = raw.frameworkKey as MaturityFrameworkPreset
  const frameworkName =
    typeof raw.frameworkName === 'string' && raw.frameworkName.trim()
      ? raw.frameworkName.trim()
      : maturityPresets[frameworkKey].frameworkName

  const createdAt = typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : NaN
  const updatedAt = typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : createdAt
  if (!Number.isFinite(createdAt)) return null

  const domainsRaw: unknown[] = Array.isArray(raw.domains) ? raw.domains : []
  const domains = domainsRaw
    .map((domain) => normalizeMaturityDomainScore(domain))
    .filter((domain): domain is MaturityDomainScore => Boolean(domain))

  return {
    id: raw.id.trim(),
    frameworkKey,
    frameworkName,
    domains,
    createdAt,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : createdAt,
  }
}

const normalizeScoreHistoryRetention = (value: unknown): ScoreHistoryRetention => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS.visualizations.scoreHistoryRetention }
  const raw = value as any
  const mode = raw.mode === 'count' || raw.mode === 'days' ? raw.mode : 'days'
  const numeric = typeof raw.value === 'number' && Number.isFinite(raw.value) ? Math.floor(raw.value) : 365
  const bounded = Math.max(1, Math.min(numeric, 10_000))
  return { mode, value: bounded }
}

const normalizeSettings = (value: unknown): AppSettings => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS }
  const raw = value as any

  const tooltipsEnabled =
    typeof raw.tooltipsEnabled === 'boolean' ? raw.tooltipsEnabled : DEFAULT_SETTINGS.tooltipsEnabled
  const onboardingDismissed =
    typeof raw.onboardingDismissed === 'boolean'
      ? raw.onboardingDismissed
      : DEFAULT_SETTINGS.onboardingDismissed

  const remindersRaw = raw.reminders
  const reminders: ReminderSettings = {
    enabled:
      remindersRaw && typeof remindersRaw.enabled === 'boolean'
        ? remindersRaw.enabled
        : DEFAULT_SETTINGS.reminders.enabled,
    frequency:
      remindersRaw && isReminderFrequency(remindersRaw.frequency)
        ? remindersRaw.frequency
        : DEFAULT_SETTINGS.reminders.frequency,
    preferNotifications:
      remindersRaw && typeof remindersRaw.preferNotifications === 'boolean'
        ? remindersRaw.preferNotifications
        : DEFAULT_SETTINGS.reminders.preferNotifications,
    lastTriggeredAt:
      remindersRaw && typeof remindersRaw.lastTriggeredAt === 'string'
        ? normalizeISODateOrUndefined(remindersRaw.lastTriggeredAt)
        : undefined,
  }

  const visualizationsRaw = raw.visualizations
  const visualizations: AppSettings['visualizations'] = {
    scoreHistoryEnabled:
      visualizationsRaw && typeof visualizationsRaw.scoreHistoryEnabled === 'boolean'
        ? visualizationsRaw.scoreHistoryEnabled
        : DEFAULT_SETTINGS.visualizations.scoreHistoryEnabled,
    scoreHistoryRetention: normalizeScoreHistoryRetention(visualizationsRaw?.scoreHistoryRetention),
    defaultTrendMode:
      visualizationsRaw && isTrendDefaultMode(visualizationsRaw.defaultTrendMode)
        ? visualizationsRaw.defaultTrendMode
        : DEFAULT_SETTINGS.visualizations.defaultTrendMode,
    maturityEnabled:
      visualizationsRaw && typeof visualizationsRaw.maturityEnabled === 'boolean'
        ? visualizationsRaw.maturityEnabled
        : DEFAULT_SETTINGS.visualizations.maturityEnabled,
    maturityFrameworkPreset:
      visualizationsRaw && isMaturityFrameworkPreset(visualizationsRaw.maturityFrameworkPreset)
        ? visualizationsRaw.maturityFrameworkPreset
        : DEFAULT_SETTINGS.visualizations.maturityFrameworkPreset,
  }

  return { tooltipsEnabled, onboardingDismissed, reminders, visualizations }
}

const normalizeThreatType = (value: unknown): Risk['threatType'] =>
  isThreatType(value) ? value : 'other'

const normalizeTemplateId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return normalizeText(trimmed)
}

const normalizeISODateOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Date.parse(trimmed)
  if (Number.isNaN(parsed)) return undefined
  return new Date(parsed).toISOString()
}

const normalizeChecklistStatus = (checklists: Risk['checklists']): Risk['checklistStatus'] => {
  if (!checklists.length) return 'not_started'
  const items = checklists.flatMap((checklist) => checklist.items ?? [])
  if (!items.length) return 'not_started'
  const completed = items.filter((item) => Boolean(item.completedAt)).length
  if (completed === 0) return 'not_started'
  if (completed >= items.length) return 'done'
  return 'in_progress'
}

const normalizeChecklists = (value: unknown): Risk['checklists'] => {
  if (!Array.isArray(value)) return []
  const now = new Date().toISOString()

  return value
    .map((rawChecklist: any) => {
      if (!rawChecklist || typeof rawChecklist !== 'object') return null

      const templateId =
        typeof rawChecklist.templateId === 'string' && rawChecklist.templateId.trim()
          ? normalizeText(rawChecklist.templateId)
          : ''
      if (!templateId) return null

      const title =
        typeof rawChecklist.title === 'string' && rawChecklist.title.trim()
          ? normalizeText(sanitizeTextInput(rawChecklist.title))
          : templateId

      const attachedAt =
        typeof rawChecklist.attachedAt === 'string' && rawChecklist.attachedAt.trim()
          ? rawChecklist.attachedAt.trim()
          : now

      const items: Risk['checklists'][number]['items'] = Array.isArray(rawChecklist.items)
        ? rawChecklist.items
            .map((rawItem: any) => {
              if (!rawItem || typeof rawItem !== 'object') return null

              const description =
                typeof rawItem.description === 'string' && rawItem.description.trim()
                  ? normalizeText(sanitizeTextInput(rawItem.description))
                  : ''
              if (!description) return null

              const createdAt =
                typeof rawItem.createdAt === 'string' && rawItem.createdAt.trim()
                  ? rawItem.createdAt.trim()
                  : now

              const completedAt = normalizeISODateOrUndefined(rawItem.completedAt)

              return {
                id:
                  typeof rawItem.id === 'string' && rawItem.id.trim()
                    ? rawItem.id.trim()
                    : nanoid(10),
                description,
                createdAt,
                ...(completedAt ? { completedAt } : {}),
              }
            })
            .filter(
              (
                item: Risk['checklists'][number]['items'][number] | null,
              ): item is Risk['checklists'][number]['items'][number] => Boolean(item),
            )
        : []

      return {
        id:
          typeof rawChecklist.id === 'string' && rawChecklist.id.trim()
            ? rawChecklist.id.trim()
            : nanoid(10),
        templateId,
        title,
        attachedAt,
        items,
      }
    })
    .filter((checklist): checklist is Risk['checklists'][number] => Boolean(checklist))
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

const normalizePlaybook = (value: unknown): Risk['playbook'] => {
  if (!value || typeof value !== 'object') return undefined

  const raw = value as any
  const title =
    typeof raw.title === 'string' && raw.title.trim()
      ? normalizeText(sanitizeTextInput(raw.title))
      : ''

  const steps: RiskPlaybookStep[] = Array.isArray(raw.steps)
    ? raw.steps
        .map((step: any) => {
          if (!step || typeof step !== 'object') return null
          const description =
            typeof step.description === 'string' && step.description.trim()
              ? normalizeText(sanitizeTextInput(step.description))
              : ''
          if (!description) return null

          const createdAt =
            typeof step.createdAt === 'string' && step.createdAt.trim()
              ? step.createdAt.trim()
              : new Date().toISOString()
          const completedAt = normalizeISODateOrUndefined(step.completedAt)

          return {
            id: typeof step.id === 'string' && step.id.trim() ? step.id.trim() : nanoid(10),
            description,
            createdAt,
            ...(completedAt ? { completedAt } : {}),
          }
        })
        .filter((step: RiskPlaybookStep | null): step is RiskPlaybookStep => Boolean(step))
    : []

  const lastModified =
    typeof raw.lastModified === 'string' && raw.lastModified.trim()
      ? raw.lastModified.trim()
      : new Date().toISOString()

  if (!title && steps.length === 0) return undefined

  return {
    title: title || 'Incident response playbook',
    steps,
    lastModified,
  }
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

  const threatType = normalizeThreatType(sanitized.threatType)
  const templateId = normalizeTemplateId(sanitized.templateId)
  const checklists = normalizeChecklists(sanitized.checklists)
  const checklistStatus = normalizeChecklistStatus(checklists)
  const playbook = normalizePlaybook((sanitized as any).playbook)

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
    threatType,
    ...(templateId ? { templateId } : {}),
    status,
    mitigationPlan:
      typeof sanitized.mitigationPlan === 'string' ? normalizeText(sanitized.mitigationPlan) : '',
    mitigationSteps: normalizeMitigationSteps(sanitized.mitigationSteps),
    checklists,
    checklistStatus,
    ...(playbook ? { playbook } : {}),
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
    financialImpact: sanitized.financialImpact,
    riskPriority: sanitized.riskPriority,
    immediateAttention: sanitized.immediateAttention,
    actionableRecommendations: sanitized.actionableRecommendations,
    creationDate,
    lastModified,
  }
}

const buildRisk = (input: RiskInput): Risk => {
  // Sanitize the input before processing
  const sanitizedInput = sanitizeRiskInput(input) as RiskInput

  const now = new Date().toISOString()
  const checklists = normalizeChecklists(sanitizedInput.checklists)
  const playbook = normalizePlaybook((sanitizedInput as any).playbook)
  return {
    id: nanoid(12),
    title: normalizeText(sanitizedInput.title),
    description: normalizeText(sanitizedInput.description),
    probability: clampScore(sanitizedInput.probability),
    impact: clampScore(sanitizedInput.impact),
    riskScore: calculateRiskScore(sanitizedInput.probability, sanitizedInput.impact),
    category: normalizeText(sanitizedInput.category) || DEFAULT_CATEGORIES[0],
    threatType: normalizeThreatType(sanitizedInput.threatType),
    ...(normalizeTemplateId(sanitizedInput.templateId) ? { templateId: normalizeTemplateId(sanitizedInput.templateId) } : {}),
    status: sanitizedInput.status ?? 'open',
    mitigationPlan: normalizeText(sanitizedInput.mitigationPlan ?? ''),
    mitigationSteps: normalizeMitigationSteps(sanitizedInput.mitigationSteps),
    checklists,
    checklistStatus: normalizeChecklistStatus(checklists),
    ...(playbook ? { playbook } : {}),
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
    financialImpact: sanitizedInput.financialImpact,
    riskPriority: sanitizedInput.riskPriority,
    immediateAttention: sanitizedInput.immediateAttention,
    actionableRecommendations: sanitizedInput.actionableRecommendations,
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

const safeStorage = () => {
  if (typeof window === 'undefined') {
    return memoryStorage()
  }

  return new RiskRegisterPersistStorage(LOCAL_STORAGE_KEY)
}

export type CSVExportVariant = 'standard' | 'audit_pack'

const CSV_SPEC_VERSION = 2 as const

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
  'threatType',
  'templateId',
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
  'checklistStatus',
  'checklistsJson',
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
      threatType: risk.threatType,
      templateId: risk.templateId ?? '',
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
      checklistStatus: risk.checklistStatus,
      checklistsJson: JSON.stringify(risk.checklists ?? []),
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

export const exportRisksToCSV = (risks: Risk[], variant: CSVExportVariant = 'standard'): string =>
  toCSV(risks, variant)

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
      const checklistsJson = row.checklistsJson ?? row.checklists ?? ''

      const evidenceFromJson = parseJsonArray<Risk['evidence'][number]>(evidenceJson)
      const mitigationStepsFromJson =
        parseJsonArray<Risk['mitigationSteps'][number]>(mitigationStepsJson)
      const checklistsFromJson = parseJsonArray<Risk['checklists'][number]>(checklistsJson)

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
        threatType: row.threatType || undefined,
        templateId: row.templateId || undefined,
        status: row.status,
        mitigationPlan: row.mitigationPlan || '',
        mitigationSteps: mitigationStepsFromJson,
        checklists: checklistsFromJson,
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
  dataSyncStatus: RiskDataSyncStatus
  dataSyncError: string | null
  dataLastSyncedAt: string | null
  readOnlyMode: boolean
  readOnlyReason: string | null
  risks: Risk[]
  filteredRisks: Risk[]
  categories: string[]
  filters: RiskFilters
  stats: ReturnType<typeof computeRiskStats>
  settings: AppSettings
  riskScoreSnapshots: RiskScoreSnapshot[]
  maturityAssessments: MaturityAssessment[]
  updateSettings: (updates: Partial<AppSettings>) => void
  updateReminderSettings: (updates: Partial<ReminderSettings>) => void
  createMaturityAssessment: (preset?: MaturityFrameworkPreset) => MaturityAssessment
  updateMaturityDomain: (
    assessmentId: string,
    domainKey: string,
    updates: { score?: number; notes?: string },
  ) => void
  deleteMaturityAssessment: (assessmentId: string) => void
  addRisk: (input: RiskInput) => Risk
  updateRisk: (
    id: string,
    updates: Partial<RiskInput> & { status?: Risk['status'] },
  ) => Risk | null
  deleteRisk: (id: string) => void
  attachChecklistTemplate: (riskId: string, templateId: string) => void
  toggleChecklistItem: (riskId: string, checklistId: string, itemId: string) => void
  addCategory: (category: string) => void
  setFilters: (updates: Partial<RiskFilters>) => void
  bulkImport: (risks: Risk[]) => void
  exportToCSV: (variant?: CSVExportVariant) => string
  importFromCSV: (csv: string) => CSVImportResult
  seedDemoData: () => number
  seedPerformanceData: (options?: {
    riskCount?: number
    snapshotsPerRisk?: number
    withHistory?: boolean
  }) => { risksSeeded: number; snapshotsSeeded: number }

  replaceFromApi: (payload: { risks: Risk[]; categories: string[] }) => void
  upsertFromApi: (risk: Risk) => void
  removeFromApi: (id: string) => void
  resetApiData: () => void
  setDataSyncState: (payload: {
    status: RiskDataSyncStatus
    error?: string | null
    lastSyncedAt?: string | null
  }) => void
  setReadOnlyState: (payload: { readOnly: boolean; reason?: string | null }) => void
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
    financialImpact: {
      lowerBound: 500000,
      upperBound: 2000000,
      expectedMean: 1200000,
      currency: 'USD'
    },
    immediateAttention: true,
    riskPriority: 15,
    actionableRecommendations: [
      'Implement redundant payment processing system',
      'Establish real-time monitoring for payment gateway',
      'Create incident response plan for payment outages'
    ]
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
    financialImpact: {
      lowerBound: 100000,
      upperBound: 750000,
      expectedMean: 300000,
      currency: 'USD'
    },
    riskPriority: 8,
    actionableRecommendations: [
      'Update vendor contract with current DPA',
      'Schedule annual compliance review',
      'Implement vendor risk assessment process'
    ]
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
    financialImpact: {
      lowerBound: 250000,
      upperBound: 1500000,
      expectedMean: 750000,
      currency: 'USD'
    },
    immediateAttention: true,
    riskPriority: 12,
    actionableRecommendations: [
      'Implement comprehensive security awareness training',
      'Deploy advanced email filtering solution',
      'Enforce multi-factor authentication company-wide'
    ]
  },
]

const createMulberry32 = (seed: number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let value = t
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const useRiskStore = create<RiskStoreState>()(
  persist(
    (set, get) => ({
      initialized: false,
      dataSyncStatus: 'idle',
      dataSyncError: null,
      dataLastSyncedAt: null,
      readOnlyMode: false,
      readOnlyReason: null,
      risks: [],
      filteredRisks: [],
      categories: [...DEFAULT_CATEGORIES],
      filters: { ...DEFAULT_FILTERS },
      stats: computeRiskStats([]),
      settings: { ...DEFAULT_SETTINGS },
      riskScoreSnapshots: [],
      maturityAssessments: [],
      setDataSyncState: ({ status, error, lastSyncedAt }) =>
        set(() => ({
          dataSyncStatus: status,
          dataSyncError: error ?? null,
          dataLastSyncedAt: lastSyncedAt ?? null,
        })),
      setReadOnlyState: ({ readOnly, reason }) =>
        set(() => ({
          readOnlyMode: Boolean(readOnly),
          readOnlyReason: reason ?? null,
        })),
      resetApiData: () =>
        set((state) => ({
          ...recalc([], state.filters),
          categories: [...DEFAULT_CATEGORIES],
          dataSyncStatus: 'idle',
          dataSyncError: null,
          dataLastSyncedAt: null,
          readOnlyMode: false,
          readOnlyReason: null,
        })),
      replaceFromApi: ({ risks, categories }) =>
        set((state) => {
          const mergedCategories = Array.from(
            new Set([
              ...categories.filter(Boolean),
              ...risks.map((risk) => risk.category).filter(Boolean),
            ]),
          )
          return {
            ...recalc(risks, state.filters),
            categories: mergedCategories.length ? mergedCategories : [...DEFAULT_CATEGORIES],
          }
        }),
      upsertFromApi: (risk) =>
        set((state) => {
          const nextRisks = state.risks.some((existing) => existing.id === risk.id)
            ? state.risks.map((existing) => (existing.id === risk.id ? risk : existing))
            : [risk, ...state.risks]

          const categories = state.categories.includes(risk.category)
            ? state.categories
            : [...state.categories, risk.category].filter(Boolean)

          return {
            ...recalc(nextRisks, state.filters),
            categories,
          }
        }),
      removeFromApi: (id) =>
        set((state) => {
          const nextRisks = state.risks.filter((risk) => risk.id !== id)
          return recalc(nextRisks, state.filters)
        }),
      updateSettings: (updates) =>
        set((state) => {
          const nextSettings = normalizeSettings({ ...state.settings, ...updates })
          const nextRetention = nextSettings.visualizations.scoreHistoryRetention
          const prevRetention = state.settings.visualizations.scoreHistoryRetention
          const retentionChanged =
            nextRetention.mode !== prevRetention.mode || nextRetention.value !== prevRetention.value

          return {
            settings: nextSettings,
            ...(retentionChanged
              ? {
                  riskScoreSnapshots: applySnapshotRetention(state.riskScoreSnapshots, nextRetention),
                }
              : {}),
          }
        }),
      updateReminderSettings: (updates) =>
        set((state) => ({
          settings: normalizeSettings({
            ...state.settings,
            reminders: { ...state.settings.reminders, ...updates },
          }),
        })),
      createMaturityAssessment: (preset) => {
        const key = preset ?? get().settings.visualizations.maturityFrameworkPreset
        const now = Date.now()
        const base = maturityPresets[key]

        const assessment: MaturityAssessment = {
          id: nanoid(10),
          frameworkKey: key,
          frameworkName: base.frameworkName,
          domains: base.domains.map((domain) => ({ ...domain, score: 0 })),
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          maturityAssessments: [assessment, ...state.maturityAssessments],
        }))

        return assessment
      },
      updateMaturityDomain: (assessmentId, domainKey, updates) =>
        set((state) => {
          const now = Date.now()
          const maturityAssessments = state.maturityAssessments.map((assessment) => {
            if (assessment.id !== assessmentId) return assessment
            const domains = assessment.domains.map((domain) => {
              if (domain.key !== domainKey) return domain
              return {
                ...domain,
                ...(typeof updates.score === 'number' ? { score: clampMaturityScore(updates.score) } : {}),
                ...(typeof updates.notes === 'string'
                  ? { notes: updates.notes.trim() ? updates.notes : undefined }
                  : {}),
              }
            })
            return { ...assessment, domains, updatedAt: now }
          })
          return { maturityAssessments }
        }),
      deleteMaturityAssessment: (assessmentId) =>
        set((state) => ({
          maturityAssessments: state.maturityAssessments.filter(
            (assessment) => assessment.id !== assessmentId,
          ),
        })),
      addRisk: (input) => {
        const risk = buildRisk(input)
        set((state) => {
          const next = recalc([risk, ...state.risks], state.filters)
          if (!state.settings.visualizations.scoreHistoryEnabled) return next

          const snapshot = buildRiskScoreSnapshot(risk)
          const riskScoreSnapshots = applySnapshotRetention(
            [...state.riskScoreSnapshots, snapshot],
            state.settings.visualizations.scoreHistoryRetention,
          )

          return { ...next, riskScoreSnapshots }
        })
        return risk
      },
      updateRisk: (id, updates) => {
        // Sanitize the updates before applying them
        const sanitizedUpdates = sanitizeRiskInput(updates)

        let updatedRisk: Risk | null = null
        set((state) => {
          const previousRisk = state.risks.find((risk) => risk.id === id) ?? null
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

            const nextChecklists =
              'checklists' in sanitizedUpdates
                ? normalizeChecklists((sanitizedUpdates as any).checklists)
                : merged.checklists

            const nextPlaybook =
              'playbook' in sanitizedUpdates
                ? normalizePlaybook((sanitizedUpdates as any).playbook)
                : merged.playbook

            updatedRisk = {
              ...merged,
              title: sanitizedUpdates.title ? normalizeText(sanitizedUpdates.title) : merged.title,
              description: sanitizedUpdates.description
                ? normalizeText(sanitizedUpdates.description)
                : merged.description,
              category: sanitizedUpdates.category
                ? normalizeText(sanitizedUpdates.category)
                : merged.category,
              threatType:
                'threatType' in sanitizedUpdates
                  ? normalizeThreatType((sanitizedUpdates as any).threatType)
                  : merged.threatType,
              templateId:
                'templateId' in sanitizedUpdates
                  ? normalizeTemplateId((sanitizedUpdates as any).templateId)
                  : merged.templateId,
              mitigationPlan: sanitizedUpdates.mitigationPlan
                ? normalizeText(sanitizedUpdates.mitigationPlan)
                : merged.mitigationPlan,
              mitigationSteps:
                'mitigationSteps' in sanitizedUpdates
                  ? normalizeMitigationSteps(sanitizedUpdates.mitigationSteps)
                  : merged.mitigationSteps,
              checklists: nextChecklists,
              checklistStatus: normalizeChecklistStatus(nextChecklists),
              playbook: nextPlaybook,
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

          const next = recalc(risks, state.filters)
          if (!updatedRisk) return next
          if (!state.settings.visualizations.scoreHistoryEnabled) return next

          const previousProbability = previousRisk?.probability
          const previousImpact = previousRisk?.impact
          const previousScore = previousRisk?.riskScore
          const shouldSnapshot =
            previousProbability !== updatedRisk.probability ||
            previousImpact !== updatedRisk.impact ||
            previousScore !== updatedRisk.riskScore
          if (!shouldSnapshot) return next

          const snapshot = buildRiskScoreSnapshot(updatedRisk)
          const riskScoreSnapshots = applySnapshotRetention(
            [...state.riskScoreSnapshots, snapshot],
            state.settings.visualizations.scoreHistoryRetention,
          )

          return { ...next, riskScoreSnapshots }
        })
        return updatedRisk
      },
      deleteRisk: (id) =>
        set((state) => {
          const risks = state.risks.filter((risk) => risk.id !== id)
          return recalc(risks, state.filters)
        }),
      attachChecklistTemplate: (riskId, templateId) =>
        set((state) => {
          const template =
            COMPLIANCE_CHECKLIST_TEMPLATES.find((entry) => entry.id === templateId) ?? null
          if (!template) return state

          const now = new Date().toISOString()
          const checklistId = nanoid(10)
          const instance = buildChecklistInstanceFromTemplate(template, now, checklistId)

          const risks = state.risks.map((risk) => {
            if (risk.id !== riskId) return risk
            if (risk.checklists.some((checklist) => checklist.templateId === templateId)) {
              return risk
            }

            const checklists = [...risk.checklists, instance]
            return {
              ...risk,
              checklists,
              checklistStatus: normalizeChecklistStatus(checklists),
              lastModified: now,
            }
          })

          return recalc(risks, state.filters)
        }),
      toggleChecklistItem: (riskId, checklistId, itemId) =>
        set((state) => {
          const now = new Date().toISOString()
          const risks = state.risks.map((risk) => {
            if (risk.id !== riskId) return risk

            const checklists = risk.checklists.map((checklist) => {
              if (checklist.id !== checklistId) return checklist
              const items = checklist.items.map((item) => {
                if (item.id !== itemId) return item
                return item.completedAt ? { ...item, completedAt: undefined } : { ...item, completedAt: now }
              })
              return { ...checklist, items }
            })

            return {
              ...risk,
              checklists,
              checklistStatus: normalizeChecklistStatus(checklists),
              lastModified: now,
            }
          })

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
      seedPerformanceData: (options) => {
        const state = get()
        if (state.risks.length) return { risksSeeded: 0, snapshotsSeeded: 0 }

        const riskCount = Math.max(1, Math.min(Math.floor(options?.riskCount ?? 1000), 10_000))
        const snapshotsPerRisk = Math.max(0, Math.min(Math.floor(options?.snapshotsPerRisk ?? 5), 10_000))
        const withHistory = options?.withHistory ?? true

        const seed = Date.now() >>> 0
        const rng = createMulberry32(seed)
        const categoriesPool = [...DEFAULT_CATEGORIES, 'Security', 'Compliance', 'Operations', 'Third-party']
        const owners = ['IT', 'Finance', 'Operations', 'Compliance', 'Security', 'Leadership']
        const now = new Date()

        const seededRisks: Risk[] = []
        const seededSnapshots: RiskScoreSnapshot[] = []

        for (let index = 0; index < riskCount; index += 1) {
          const probability = 1 + Math.floor(rng() * 5)
          const impact = 1 + Math.floor(rng() * 5)
          const category = categoriesPool[Math.floor(rng() * categoriesPool.length)] ?? DEFAULT_CATEGORIES[0]
          const ownerTeam = owners[Math.floor(rng() * owners.length)] ?? ''

          const dueInDays = 7 + Math.floor(rng() * 180)
          const reviewInDays = 14 + Math.floor(rng() * 90)
          const dueDate = new Date(now.getTime() + dueInDays * 24 * 60 * 60 * 1000).toISOString()
          const reviewDate = new Date(now.getTime() + reviewInDays * 24 * 60 * 60 * 1000).toISOString()

          const risk = buildRisk({
            title: `Perf risk ${index + 1}`,
            description: 'Synthetic risk used for performance validation.',
            probability,
            impact,
            category,
            ownerTeam,
            owner: ownerTeam ? `${ownerTeam} Lead` : '',
            mitigationPlan: 'Review controls and update likelihood/impact as needed.',
            status: rng() < 0.75 ? 'open' : rng() < 0.5 ? 'mitigated' : 'accepted',
            dueDate,
            reviewDate,
          })

          seededRisks.push(risk)

          if (!withHistory || snapshotsPerRisk === 0) continue

          const baseTimestamp = Date.now() - 29 * 24 * 60 * 60 * 1000
          const step = (29 * 24 * 60 * 60 * 1000) / Math.max(1, snapshotsPerRisk - 1)

          for (let snapshotIndex = 0; snapshotIndex < snapshotsPerRisk; snapshotIndex += 1) {
            const drift = Math.round((rng() - 0.5) * 2) // -1..1
            const snapshotProbability = Math.min(5, Math.max(1, probability + drift))
            const snapshotImpact = Math.min(5, Math.max(1, impact + Math.round((rng() - 0.5) * 2)))
            const timestamp = Math.round(baseTimestamp + snapshotIndex * step + rng() * 12 * 60 * 60 * 1000)
            seededSnapshots.push({
              riskId: risk.id,
              timestamp,
              probability: snapshotProbability,
              impact: snapshotImpact,
              riskScore: Math.min(25, Math.max(1, snapshotProbability * snapshotImpact)),
            })
          }
        }

        const baseCategories =
          state.categories && state.categories.length ? state.categories : [...DEFAULT_CATEGORIES]
        const categories = Array.from(
          new Set([...baseCategories, ...seededRisks.map((risk) => risk.category)].filter(Boolean)),
        )

        set((current) => ({
          ...recalc([...seededRisks, ...current.risks], current.filters),
          categories,
          riskScoreSnapshots: applySnapshotRetention(
            seededSnapshots,
            current.settings.visualizations.scoreHistoryRetention,
          ),
        }))

        return {
          risksSeeded: seededRisks.length,
          snapshotsSeeded: applySnapshotRetention(
            seededSnapshots,
            state.settings.visualizations.scoreHistoryRetention,
          ).length,
        }
      },
    }),
    {
      name: LOCAL_STORAGE_KEY,
      storage: createJSONStorage(safeStorage),
      version: 7,
      partialize: (state) => ({
        filters: state.filters,
        settings: state.settings,
      }),
      migrate: (persistedState, _version) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState
        }

        const state = persistedState as any
        const filters = { ...DEFAULT_FILTERS, ...(state.filters ?? {}) }
        const settings = normalizeSettings(state.settings)
        return { filters, settings }
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.initialized = true
        const filters = { ...DEFAULT_FILTERS, ...(state.filters ?? {}) }
        const stats = computeRiskStats(state.risks)
        state.filteredRisks = filterRisks(state.risks, filters)
        state.stats = stats
        state.filters = filters
        state.settings = normalizeSettings((state as any).settings)
        const snapshotsRaw = Array.isArray((state as any).riskScoreSnapshots)
          ? ((state as any).riskScoreSnapshots as unknown[])
          : []
        const snapshots = snapshotsRaw
          .map((snapshot: unknown) => normalizeRiskScoreSnapshot(snapshot))
          .filter(
            (snapshot: RiskScoreSnapshot | null): snapshot is RiskScoreSnapshot => Boolean(snapshot),
          )
        state.riskScoreSnapshots = applySnapshotRetention(
          snapshots,
          state.settings.visualizations.scoreHistoryRetention,
        )
        state.maturityAssessments = Array.isArray((state as any).maturityAssessments)
          ? ((state as any).maturityAssessments as unknown[])
              .map((assessment) => normalizeMaturityAssessment(assessment))
              .filter((assessment): assessment is MaturityAssessment => Boolean(assessment))
          : []

        // Best-effort privacy cleanup: if a previous version persisted risk data in plaintext
        // localStorage, overwrite it with the minimal non-sensitive preferences payload.
        try {
          if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
            if (raw) {
              const parsed = JSON.parse(raw) as any
              if (
                parsed &&
                typeof parsed === 'object' &&
                parsed.state &&
                typeof parsed.state === 'object'
              ) {
                window.localStorage.setItem(
                  LOCAL_STORAGE_KEY,
                  JSON.stringify({ version: 7, state: { filters: state.filters, settings: state.settings } }),
                )
              }
            }
          }
        } catch {
          // ignore (e.g. encrypted payloads or blocked storage)
        }
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
