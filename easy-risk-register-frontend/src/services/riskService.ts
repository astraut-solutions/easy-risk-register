import { useMemo } from 'react'

import type { ChecklistStatus, Risk, RiskChecklist, RiskFilters, RiskInput, RiskSeverity } from '../types/risk'
import { useRiskStore } from '../stores/riskStore'
import type { CSVExportVariant } from '../stores/riskStore'
import type { AppSettings, ReminderSettings } from '../stores/riskStore'
import type { ApiError } from './apiClient'
import { apiDelete, apiGetJson, apiPatchJson, apiPostJson } from './apiClient'
import { timeSeriesService } from './timeSeriesService'
import { useAuthStore } from '../stores/authStore'
import { getRiskSeverity } from '../utils/riskCalculations'
import { loadWorkspaceOfflineCache, saveWorkspaceOfflineCache } from '../utils/offlineCache'
import { getE2eeSessionKey, getE2eeStatus, getE2eeKdfConfig } from '../utils/e2eeManager'
import { buildRiskEncryptedFieldsV1, decryptRiskEncryptedFieldsV1, normalizeRiskEncryptedFieldsV1 } from '../utils/e2eeRiskFields'

/**
 * Cache Utility for frequently accessed data
 */
interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheUtil {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get cached data by key
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + (entry.ttl * 1000)) {
      // Entry expired, remove from cache
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   */
  set<T = any>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 300; // Default 5 minutes

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);

    // Ensure cache doesn't exceed max size
    if (this.cache.size > this.maxSize) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Delete a key from cache
   * @param key Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Check if a key exists in cache and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Singleton instance
const cacheUtil = new CacheUtil();

type ApiCategory = {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

type ApiRisk = {
  id: string
  title: string
  description: string
  encryptedFields?: unknown
  probability: number
  impact: number
  riskScore: number
  severity?: RiskSeverity
  category: string
  status: Risk['status']
  threatType: Risk['threatType']
  mitigationPlan: string
  checklistStatus?: ChecklistStatus
  creationDate: string
  lastModified: string
  data?: unknown
}

type ApiRisksListResponse = {
  items: ApiRisk[]
  count: number | null
}

type ApiRiskChecklistItem = {
  id: string
  position: number
  description: string
  createdAt: string
  completedAt?: string | null
  completedBy?: string | null
}

type ApiRiskChecklist = {
  id: string
  templateId: string
  title: string
  description?: string
  status?: ChecklistStatus
  attachedAt: string
  startedAt?: string | null
  completedAt?: string | null
  items: ApiRiskChecklistItem[]
}

type ApiRiskChecklistsListResponse = {
  items: ApiRiskChecklist[]
}

type ApiChecklistItemPatchResponse = {
  itemId: string
  checklistId: string
  completedAt: string | null
  checklistStatus: ChecklistStatus
  riskChecklistStatus: ChecklistStatus
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string') : []
}

function normalizeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizeChecklistStatus(value: unknown): ChecklistStatus | null {
  if (value === 'not_started' || value === 'in_progress' || value === 'done') return value
  return null
}

function mapApiChecklistToRiskChecklist(apiChecklist: ApiRiskChecklist): RiskChecklist {
  const status = normalizeChecklistStatus(apiChecklist.status) ?? undefined
  return {
    id: apiChecklist.id,
    templateId: apiChecklist.templateId,
    title: apiChecklist.title,
    description: typeof apiChecklist.description === 'string' ? apiChecklist.description : undefined,
    status,
    attachedAt: apiChecklist.attachedAt,
    startedAt: apiChecklist.startedAt ?? undefined,
    completedAt: apiChecklist.completedAt ?? undefined,
    items: Array.isArray(apiChecklist.items)
      ? apiChecklist.items
          .map((item) => ({
            id: item.id,
            position: Number(item.position),
            description: item.description,
            createdAt: item.createdAt,
            completedAt: item.completedAt ?? undefined,
            completedBy: item.completedBy ?? undefined,
          }))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      : [],
  }
}

function inflateRisk(apiRisk: ApiRisk): Risk {
  const data = normalizeObject(apiRisk.data)
  const severity =
    apiRisk.severity === 'low' || apiRisk.severity === 'medium' || apiRisk.severity === 'high'
      ? apiRisk.severity
      : getRiskSeverity(Number(apiRisk.riskScore))

  const checklistStatus =
    apiRisk.checklistStatus === 'not_started' ||
    apiRisk.checklistStatus === 'in_progress' ||
    apiRisk.checklistStatus === 'done'
      ? apiRisk.checklistStatus
      : data.checklistStatus === 'not_started' ||
          data.checklistStatus === 'in_progress' ||
          data.checklistStatus === 'done'
        ? (data.checklistStatus as ChecklistStatus)
        : 'not_started'

  return {
    id: apiRisk.id,
    title: apiRisk.title,
    description: apiRisk.description,
    encryptedFields: apiRisk.encryptedFields,
    probability: Number(apiRisk.probability),
    impact: Number(apiRisk.impact),
    riskScore: Number(apiRisk.riskScore),
    severity,
    category: apiRisk.category,
    threatType: apiRisk.threatType,
    templateId: typeof data.templateId === 'string' ? data.templateId : undefined,
    status: apiRisk.status,
    mitigationPlan: apiRisk.mitigationPlan ?? '',
    mitigationSteps: Array.isArray(data.mitigationSteps) ? (data.mitigationSteps as any) : [],
    checklists: [],
    checklistStatus,
    playbook: data.playbook && typeof data.playbook === 'object' ? (data.playbook as any) : undefined,
    owner: normalizeString(data.owner, ''),
    ownerTeam: typeof data.ownerTeam === 'string' ? data.ownerTeam : undefined,
    dueDate: typeof data.dueDate === 'string' ? data.dueDate : undefined,
    reviewDate: typeof data.reviewDate === 'string' ? data.reviewDate : undefined,
    reviewCadence:
      data.reviewCadence === 'weekly' ||
      data.reviewCadence === 'monthly' ||
      data.reviewCadence === 'quarterly' ||
      data.reviewCadence === 'semiannual' ||
      data.reviewCadence === 'annual' ||
      data.reviewCadence === 'ad-hoc'
        ? (data.reviewCadence as any)
        : undefined,
    riskResponse:
      data.riskResponse === 'treat' ||
      data.riskResponse === 'transfer' ||
      data.riskResponse === 'tolerate' ||
      data.riskResponse === 'terminate'
        ? (data.riskResponse as any)
        : 'treat',
    ownerResponse: normalizeString(data.ownerResponse, ''),
    securityAdvisorComment: normalizeString(data.securityAdvisorComment, ''),
    vendorResponse: normalizeString(data.vendorResponse, ''),
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    evidence: Array.isArray(data.evidence) ? (data.evidence as any) : [],
    creationDate: apiRisk.creationDate,
    lastModified: apiRisk.lastModified,
    financialImpact: data.financialImpact && typeof data.financialImpact === 'object' ? (data.financialImpact as any) : undefined,
    riskPriority: typeof data.riskPriority === 'number' ? data.riskPriority : undefined,
    immediateAttention: typeof data.immediateAttention === 'boolean' ? data.immediateAttention : undefined,
    actionableRecommendations: normalizeStringArray(data.actionableRecommendations),
  }
}

async function inflateRiskWithE2ee(apiRisk: ApiRisk, workspaceId: string | null): Promise<Risk> {
  const risk = inflateRisk(apiRisk)
  const encrypted = normalizeRiskEncryptedFieldsV1(apiRisk.encryptedFields)
  if (!encrypted) {
    risk.e2eeLocked = false
    return risk
  }

  const key = getE2eeSessionKey(workspaceId)
  if (!key) {
    risk.e2eeLocked = true
    return risk
  }

  try {
    const decrypted = await decryptRiskEncryptedFieldsV1({ encryptedFields: encrypted, key })
    risk.description = decrypted.description
    risk.mitigationPlan = decrypted.mitigationPlan
    risk.e2eeLocked = false
    return risk
  } catch {
    risk.e2eeLocked = true
    return risk
  }
}

function extractRiskData(input: RiskInput): Record<string, unknown> {
  const {
    description: _description,
    probability: _probability,
    impact: _impact,
    category: _category,
    threatType: _threatType,
    status: _status,
    mitigationPlan: _mitigationPlan,
    checklists: _checklists,
    checklistStatus: _checklistStatus,
    ...rest
  } = input as any

  return rest as Record<string, unknown>
}

function formatApiError(error: unknown): string {
  const err = error as ApiError
  if (err && typeof err.status === 'number' && typeof err.message === 'string') {
    if (err.status === 0) return err.message
    if (err.requestId) return `${err.message} (request ${err.requestId})`
    return err.message
  }
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}

function isOfflineOrUnreachable(error: unknown): boolean {
  const err = error as ApiError
  if (!err || typeof err.status !== 'number') return false
  if (err.status === 0) return true
  if (err.status === 503) return true
  if (typeof err.code === 'string' && err.code === 'SUPABASE_UNREACHABLE') return true
  return Boolean(err.retryable) && (err.status === 502 || err.status === 503)
}

function parseIsoTimestamp(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function reviewCadenceToIntervalDays(cadence: RiskInput['reviewCadence']): number | null {
  switch (cadence) {
    case 'weekly':
      return 7
    case 'monthly':
      return 30
    case 'quarterly':
      return 90
    case 'semiannual':
      return 182
    case 'annual':
      return 365
    case 'ad-hoc':
    default:
      return null
  }
}

function computeNextReviewAtIso(input: Pick<RiskInput, 'dueDate' | 'reviewDate'>): string | null {
  const dueMs = parseIsoTimestamp(input.dueDate)
  const reviewMs = parseIsoTimestamp(input.reviewDate)
  const candidates = [dueMs, reviewMs].filter((value): value is number => value !== null)
  if (candidates.length === 0) return null
  return new Date(Math.min(...candidates)).toISOString()
}

function buildBoundedOfflineCache(risks: Risk[]) {
  const now = Date.now()
  const cutoff = now - 7 * 24 * 60 * 60 * 1000

  return [...risks]
    .map((risk) => ({ risk, ts: parseIsoTimestamp(risk.lastModified) ?? parseIsoTimestamp(risk.creationDate) ?? 0 }))
    .filter((entry) => entry.ts >= cutoff)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 100)
    .map((entry) => entry.risk)
}

function normalizeCachedRisk(value: unknown): Risk | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as any
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null
  if (typeof raw.title !== 'string') return null
  if (typeof raw.description !== 'string') return null
  if (typeof raw.category !== 'string') return null
  if (typeof raw.status !== 'string') return null
  if (typeof raw.threatType !== 'string') return null
  if (typeof raw.mitigationPlan !== 'string') return null
  if (typeof raw.creationDate !== 'string') return null
  if (typeof raw.lastModified !== 'string') return null

  const probability = Number(raw.probability)
  const impact = Number(raw.impact)
  const riskScore = Number(raw.riskScore)
  if (!Number.isFinite(probability) || !Number.isFinite(impact) || !Number.isFinite(riskScore)) return null

  return raw as Risk
}

/**
 * Risk service providing centralized access to risk management operations
 * This service acts as a facade to the risk store, providing consistent methods
 * for interacting with risk data throughout the application
 */
export const riskService = {
  syncFromApi: async () => {
    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') {
      useRiskStore.getState().resetApiData()
      return
    }

    const store = useRiskStore.getState()
    store.setDataSyncState({ status: 'loading', error: null })
    store.setReadOnlyState({ readOnly: false, reason: null })

    try {
      const [categories, risksResponse] = await Promise.all([
        apiGetJson<ApiCategory[]>('/api/categories'),
        apiGetJson<ApiRisksListResponse>('/api/risks?limit=1000&sort=updated_at&order=desc'),
      ])

      const categoryNames = Array.from(
        new Set(
          (categories || [])
            .map((c) => (typeof c?.name === 'string' ? c.name : ''))
            .map((name) => name.trim())
            .filter(Boolean),
        ),
      )

      const workspaceId = useAuthStore.getState().workspaceId
      const risks = await Promise.all(
        (risksResponse?.items || []).map((risk) => inflateRiskWithE2ee(risk, workspaceId)),
      )

      const lastSyncedAt = new Date().toISOString()

      store.replaceFromApi({ risks, categories: categoryNames })
      store.setDataSyncState({
        status: 'ready',
        error: null,
        lastSyncedAt,
      })
      cacheUtil.clear()

      if (workspaceId) {
        const boundedRisks = buildBoundedOfflineCache(risks)
        void saveWorkspaceOfflineCache({
          workspaceId,
          lastUpdatedAt: lastSyncedAt,
          risks: boundedRisks,
          categories: categoryNames,
        }).catch(() => {})
      }
    } catch (error) {
      if (isOfflineOrUnreachable(error)) {
        const workspaceId = useAuthStore.getState().workspaceId
        if (workspaceId) {
          try {
            const cached = await loadWorkspaceOfflineCache(workspaceId)
            const cachedRisks = (cached?.risks || [])
              .map((risk) => normalizeCachedRisk(risk))
              .filter((risk): risk is Risk => Boolean(risk))
            const cachedCategories = Array.isArray(cached?.categories) ? cached!.categories : []

            if (cached && cachedRisks.length) {
              store.replaceFromApi({ risks: cachedRisks, categories: cachedCategories })
              store.setDataSyncState({
                status: 'ready',
                error: null,
                lastSyncedAt: cached.lastUpdatedAt,
              })
              store.setReadOnlyState({
                readOnly: true,
                reason: `Offline/unavailable: showing cached data (last updated ${new Date(cached.lastUpdatedAt).toLocaleString()}).`,
              })
              return
            }
          } catch {
            // ignore cache read failures
          }
        }

        store.setDataSyncState({ status: 'error', error: formatApiError(error) })
        store.setReadOnlyState({
          readOnly: true,
          reason: 'Offline/unavailable: changes will not be saved.',
        })
        throw error
      }

      store.setDataSyncState({ status: 'error', error: formatApiError(error) })
      throw error
    }
  },

  /** Returns the currently filtered list of risks */
  list: (): Risk[] => {
    // Check if we have cached risks
    const cachedRisks = cacheUtil.get<Risk[]>('filteredRisks');
    if (cachedRisks) {
      return cachedRisks;
    }

    // Get from store and cache it
    const risks = useRiskStore.getState().filteredRisks;
    cacheUtil.set('filteredRisks', risks, { ttl: 300 }); // Cache for 5 minutes
    return risks;
  },

  /** Returns the complete list of all risks without filtering */
  listAll: (): Risk[] => {
    // Check if we have cached all risks
    const cachedRisks = cacheUtil.get<Risk[]>('allRisks');
    if (cachedRisks) {
      return cachedRisks;
    }

    // Get from store and cache it
    const risks = useRiskStore.getState().risks;
    cacheUtil.set('allRisks', risks, { ttl: 300 }); // Cache for 5 minutes
    return risks;
  },

  /** Retrieves a specific risk by its unique ID */
  getById: (id: string): Risk | undefined => {
    // Check if we have cached this specific risk
    const cachedRisk = cacheUtil.get<Risk>(`risk_${id}`);
    if (cachedRisk) {
      return cachedRisk;
    }

    // Get from store and cache it
    const risk = useRiskStore.getState().risks.find((risk) => risk.id === id);
    if (risk) {
      cacheUtil.set(`risk_${id}`, risk, { ttl: 600 }); // Cache for 10 minutes
    }
    return risk;
  },

  /** Creates a new risk record with the provided input data */
  create: async (input: RiskInput) => {
    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') {
      cacheUtil.delete('filteredRisks')
      cacheUtil.delete('allRisks')
      cacheUtil.delete('risk_stats')
      return useRiskStore.getState().addRisk(input)
    }

    cacheUtil.delete('filteredRisks')
    cacheUtil.delete('allRisks')
    cacheUtil.delete('risk_stats')

    const nextReviewAt = computeNextReviewAtIso(input)
    const reviewIntervalDays = reviewCadenceToIntervalDays(input.reviewCadence)

    const payload = {
      title: (input as any).title,
      description: input.description,
      probability: input.probability,
      impact: input.impact,
      category: input.category,
      status: input.status,
      threatType: input.threatType,
      mitigationPlan: input.mitigationPlan,
      data: extractRiskData(input),
      ...(nextReviewAt ? { nextReviewAt } : {}),
      ...(typeof reviewIntervalDays === 'number' ? { reviewIntervalDays } : {}),
    }

    const workspaceId = useAuthStore.getState().workspaceId
    const e2eeStatus = getE2eeStatus(workspaceId)
    if (e2eeStatus.enabled) {
      if (!e2eeStatus.unlocked) {
        throw new Error('End-to-end encryption is enabled. Unlock it to create/update encrypted fields.')
      }
      const key = getE2eeSessionKey(workspaceId)
      const kdf = getE2eeKdfConfig(workspaceId)
      if (!key || !kdf) throw new Error('End-to-end encryption misconfigured. Re-enable E2EE and try again.')

      const encryptedFields = await buildRiskEncryptedFieldsV1({
        kdf,
        key,
        description: input.description ?? '',
        mitigationPlan: input.mitigationPlan ?? '',
      })

      ;(payload as any).encryptedFields = encryptedFields
      ;(payload as any).description = ''
      ;(payload as any).mitigationPlan = ''
    }

    const apiRisk = await apiPostJson<ApiRisk>('/api/risks', payload as any)
    const risk = await inflateRiskWithE2ee(apiRisk, workspaceId)

    useRiskStore.getState().upsertFromApi(risk)
    void timeSeriesService.writeSnapshot(risk).catch(() => {})
    return risk
  },

  /** Updates an existing risk with the provided partial updates */
  update: async (
    id: string,
    updates: Partial<RiskInput> & { status?: Risk['status'] },
  ) => {
    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') {
      cacheUtil.delete(`risk_${id}`)
      cacheUtil.delete('filteredRisks')
      cacheUtil.delete('allRisks')
      cacheUtil.delete('risk_stats')
      return useRiskStore.getState().updateRisk(id, updates)
    }

    cacheUtil.delete(`risk_${id}`)
    cacheUtil.delete('filteredRisks')
    cacheUtil.delete('allRisks')
    cacheUtil.delete('risk_stats')

    const current = useRiskStore.getState().risks.find((risk) => risk.id === id)
    if (!current) return null

    const merged: RiskInput = {
      title: current.title,
      description: current.description,
      probability: current.probability,
      impact: current.impact,
      category: current.category,
      threatType: current.threatType,
      templateId: current.templateId,
      status: current.status,
      mitigationPlan: current.mitigationPlan,
      mitigationSteps: current.mitigationSteps,
      checklists: current.checklists,
      playbook: current.playbook,
      owner: current.owner,
      ownerTeam: current.ownerTeam,
      dueDate: current.dueDate,
      reviewDate: current.reviewDate,
      reviewCadence: current.reviewCadence,
      riskResponse: current.riskResponse,
      ownerResponse: current.ownerResponse,
      securityAdvisorComment: current.securityAdvisorComment,
      vendorResponse: current.vendorResponse,
      notes: current.notes,
      evidence: current.evidence,
      financialImpact: current.financialImpact,
      riskPriority: current.riskPriority,
      immediateAttention: current.immediateAttention,
      actionableRecommendations: current.actionableRecommendations,
      ...(updates as any),
    }

    const nextReviewAt = computeNextReviewAtIso(merged)
    const reviewIntervalDays = reviewCadenceToIntervalDays(merged.reviewCadence)

    const patch = {
      title: (updates as any).title,
      description: updates.description,
      probability: updates.probability,
      impact: updates.impact,
      category: updates.category,
      status: updates.status,
      threatType: updates.threatType,
      mitigationPlan: updates.mitigationPlan,
      data: extractRiskData(merged),
      nextReviewAt,
      reviewIntervalDays,
    }

    const workspaceId = useAuthStore.getState().workspaceId
    const e2eeStatus = getE2eeStatus(workspaceId)
    const touchesSensitive =
      Object.prototype.hasOwnProperty.call(updates, 'description') ||
      Object.prototype.hasOwnProperty.call(updates, 'mitigationPlan')

    if (e2eeStatus.enabled && touchesSensitive) {
      if (!e2eeStatus.unlocked) {
        throw new Error('End-to-end encryption is enabled. Unlock it to edit encrypted fields.')
      }
      const key = getE2eeSessionKey(workspaceId)
      const kdf = getE2eeKdfConfig(workspaceId)
      if (!key || !kdf) throw new Error('End-to-end encryption misconfigured. Re-enable E2EE and try again.')

      const encryptedFields = await buildRiskEncryptedFieldsV1({
        kdf,
        key,
        description: merged.description ?? '',
        mitigationPlan: merged.mitigationPlan ?? '',
      })

      delete (patch as any).description
      delete (patch as any).mitigationPlan
      ;(patch as any).encryptedFields = encryptedFields
    }

    const apiRisk = await apiPatchJson<ApiRisk>(`/api/risks/${id}`, patch as any)
    const risk = await inflateRiskWithE2ee(apiRisk, workspaceId)
    risk.checklists = current.checklists
    useRiskStore.getState().upsertFromApi(risk)

    const maybeScoreChanged =
      Object.prototype.hasOwnProperty.call(updates, 'probability') ||
      Object.prototype.hasOwnProperty.call(updates, 'impact')
    if (risk && maybeScoreChanged) {
      void timeSeriesService.writeSnapshot(risk).catch(() => {})
    }

    return risk
  },

  /** Removes a risk from the store by its ID */
  remove: async (id: string) => {
    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') {
      cacheUtil.delete(`risk_${id}`)
      cacheUtil.delete('filteredRisks')
      cacheUtil.delete('allRisks')
      cacheUtil.delete('risk_stats')
      useRiskStore.getState().deleteRisk(id)
      return
    }

    cacheUtil.delete(`risk_${id}`)
    cacheUtil.delete('filteredRisks')
    cacheUtil.delete('allRisks')
    cacheUtil.delete('risk_stats')

    await apiDelete(`/api/risks/${id}`)
    useRiskStore.getState().removeFromApi(id)
  },

  /** Loads checklists for a risk (used by the edit/details view). */
  loadRiskChecklists: async (riskId: string): Promise<RiskChecklist[]> => {
    const store = useRiskStore.getState()
    const current = store.risks.find((risk) => risk.id === riskId)
    if (!current) return []

    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') return current.checklists

    const cacheKey = `risk_checklists_${riskId}`
    const cached = cacheUtil.get<RiskChecklist[]>(cacheKey)
    if (cached) {
      store.upsertFromApi({ ...current, checklists: cached })
      return cached
    }

    const response = await apiGetJson<ApiRiskChecklistsListResponse>(`/api/risks/${riskId}/checklists`)
    const checklists = (response?.items || []).map(mapApiChecklistToRiskChecklist)

    cacheUtil.set(cacheKey, checklists, { ttl: 60 })
    store.upsertFromApi({ ...current, checklists })
    return checklists
  },

  /** Attaches a compliance checklist template to a risk */
  attachChecklistTemplate: async (riskId: string, templateId: string) => {
    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') {
      return useRiskStore.getState().attachChecklistTemplate(riskId, templateId)
    }

    cacheUtil.delete(`risk_checklists_${riskId}`)

    const apiChecklist = await apiPostJson<ApiRiskChecklist>(`/api/risks/${riskId}/checklists`, { templateId })
    const checklist = mapApiChecklistToRiskChecklist(apiChecklist)

    const store = useRiskStore.getState()
    const current = store.risks.find((risk) => risk.id === riskId)
    if (current) {
      const checklists = current.checklists.some((entry) => entry.id === checklist.id)
        ? current.checklists
        : [...current.checklists, checklist]
      store.upsertFromApi({ ...current, checklists })
    }

    // Refresh risk-level checklistStatus (rollup is computed server-side).
    try {
      const apiRisk = await apiGetJson<ApiRisk>(`/api/risks/${riskId}`)
      const workspaceId = useAuthStore.getState().workspaceId
      const inflated = await inflateRiskWithE2ee(apiRisk, workspaceId)
      const preserve = store.risks.find((risk) => risk.id === riskId)?.checklists ?? []
      inflated.checklists = preserve
      store.upsertFromApi(inflated)
    } catch {
      // best-effort
    }

    return checklist
  },

  /** Toggles a checklist item's completion state */
  toggleChecklistItem: async (riskId: string, checklistId: string, itemId: string) => {
    const { status: authStatus } = useAuthStore.getState()
    if (authStatus !== 'authenticated') {
      return useRiskStore.getState().toggleChecklistItem(riskId, checklistId, itemId)
    }

    const store = useRiskStore.getState()
    const current = store.risks.find((risk) => risk.id === riskId)
    if (!current) return

    const checklist = current.checklists.find((entry) => entry.id === checklistId) ?? null
    const item = checklist?.items.find((entry) => entry.id === itemId) ?? null
    if (!checklist || !item) return

    const completed = !item.completedAt

    const result = await apiPatchJson<ApiChecklistItemPatchResponse>(
      `/api/risks/${riskId}/checklists/items/${itemId}`,
      { completed },
    )

    cacheUtil.delete(`risk_checklists_${riskId}`)

    const checklists = current.checklists.map((entry) => {
      if (entry.id !== checklistId) return entry
      return {
        ...entry,
        status: result.checklistStatus,
        items: entry.items.map((existing) =>
          existing.id === itemId ? { ...existing, completedAt: result.completedAt ?? undefined } : existing,
        ),
      }
    })

    store.upsertFromApi({
      ...current,
      checklists,
      checklistStatus: result.riskChecklistStatus,
    })
  },

  /** Updates the current risk filtering criteria */
  setFilters: (updates: Partial<RiskFilters>) => {
    // Clear filtered risks cache when filters change
    cacheUtil.delete('filteredRisks');
    return useRiskStore.getState().setFilters(updates);
  },

  /** Exports all risks to CSV format for external use */
  exportCSV: (variant?: CSVExportVariant) => useRiskStore.getState().exportToCSV(variant),

  /** Imports risks from a CSV string and adds them to the store */
  importCSV: (csv: string) => {
    // Clear all cache when importing
    cacheUtil.clear();
    return useRiskStore.getState().importFromCSV(csv);
  },

  /** Seeds the risk store with demonstration data for testing purposes */
  seedDemoData: () => {
    // Clear all cache when seeding demo data
    cacheUtil.clear();
    return useRiskStore.getState().seedDemoData();
  },

  /** Updates UI/app settings persisted locally */
  updateSettings: (updates: Partial<AppSettings>) => {
    useRiskStore.getState().updateSettings(updates)

    const patch: Record<string, boolean> = {}
    if (typeof updates.tooltipsEnabled === 'boolean') patch.tooltipsEnabled = updates.tooltipsEnabled
    if (typeof updates.onboardingDismissed === 'boolean') patch.onboardingDismissed = updates.onboardingDismissed

    if (Object.keys(patch).length === 0) return
    void apiPatchJson('/api/settings', patch).catch(() => {
      // Keep UX responsive: settings apply locally even if the backend is unavailable/offline.
    })
  },

  /** Updates reminder-specific settings */
  updateReminderSettings: (updates: Partial<ReminderSettings>) => {
    useRiskStore.getState().updateReminderSettings(updates)

    const patch: Record<string, unknown> = {}
    if (typeof updates.enabled === 'boolean') patch.remindersEnabled = updates.enabled
    if (Object.prototype.hasOwnProperty.call(updates, 'snoozedUntil')) {
      patch.remindersSnoozedUntil = updates.snoozedUntil ?? null
    }

    if (Object.keys(patch).length === 0) return
    void apiPatchJson('/api/settings', patch).catch(() => {
      // Keep UX responsive: settings apply locally even if the backend is unavailable/offline.
    })
  },

  /** Get cached statistics */
  getStats: () => {
    const cachedStats = cacheUtil.get('risk_stats');
    if (cachedStats) {
      return cachedStats;
    }

    const stats = useRiskStore.getState().stats;
    cacheUtil.set('risk_stats', stats, { ttl: 120 }); // Cache for 2 minutes
    return stats;
  },

  /** Clear the cache */
  clearCache: () => {
    cacheUtil.clear();
  }
}

/**
 * Custom React hook that provides access to risk management functionality
 * This hook offers both the current risk data and methods to manipulate it
 * @returns Object containing risk data (risks, stats, filters, categories) and actions
 */
export const useRiskManagement = () => {
  const risks = useRiskStore((state) => state.filteredRisks)
  const allRisks = useRiskStore((state) => state.risks)
  const stats = useRiskStore((state) => state.stats)
  const filters = useRiskStore((state) => state.filters)
  const categories = useRiskStore((state) => state.categories)
  const settings = useRiskStore((state) => state.settings)
  const riskScoreSnapshots = useRiskStore((state) => state.riskScoreSnapshots)
  const maturityAssessments = useRiskStore((state) => state.maturityAssessments)
  const dataSyncStatus = useRiskStore((state) => state.dataSyncStatus)
  const dataSyncError = useRiskStore((state) => state.dataSyncError)
  const dataLastSyncedAt = useRiskStore((state) => state.dataLastSyncedAt)
  const readOnlyMode = useRiskStore((state) => state.readOnlyMode)
  const readOnlyReason = useRiskStore((state) => state.readOnlyReason)
  const createMaturityAssessment = useRiskStore((state) => state.createMaturityAssessment)
  const updateMaturityDomain = useRiskStore((state) => state.updateMaturityDomain)
  const deleteMaturityAssessment = useRiskStore((state) => state.deleteMaturityAssessment)
  const addCategory = useRiskStore((state) => state.addCategory)
  const setFilters = useRiskStore((state) => state.setFilters)
  const exportToCSV = useRiskStore((state) => state.exportToCSV)
  const importFromCSV = useRiskStore((state) => state.importFromCSV)
  const seedDemoData = useRiskStore((state) => state.seedDemoData)
  const updateSettings = useRiskStore((state) => state.updateSettings)

  const actions = useMemo(
    () => ({
      syncFromApi: riskService.syncFromApi,
      addRisk: riskService.create,
      updateRisk: riskService.update,
      deleteRisk: riskService.remove,
      loadRiskChecklists: riskService.loadRiskChecklists,
      attachChecklistTemplate: riskService.attachChecklistTemplate,
      toggleChecklistItem: riskService.toggleChecklistItem,
      addCategory,
      setFilters,
      exportToCSV,
      importFromCSV,
      seedDemoData,
      updateSettings,
      updateReminderSettings: riskService.updateReminderSettings,
      createMaturityAssessment,
      updateMaturityDomain,
      deleteMaturityAssessment,
    }),
    [
      addCategory,
      exportToCSV,
      importFromCSV,
      seedDemoData,
      setFilters,
      updateSettings,
      createMaturityAssessment,
      deleteMaturityAssessment,
      updateMaturityDomain,
    ],
  )

  return {
    risks,
    allRisks,
    stats,
    filters,
    categories,
    settings,
    riskScoreSnapshots,
    maturityAssessments,
    dataSyncStatus,
    dataSyncError,
    dataLastSyncedAt,
    readOnlyMode,
    readOnlyReason,
    actions,
  }
}
