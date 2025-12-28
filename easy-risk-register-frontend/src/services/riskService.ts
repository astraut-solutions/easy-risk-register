import { useMemo } from 'react'

import type { Risk, RiskFilters, RiskInput } from '../types/risk'
import { useRiskStore } from '../stores/riskStore'
import type { CSVExportVariant } from '../stores/riskStore'
import type { AppSettings, ReminderSettings } from '../stores/riskStore'
import type { ApiError } from './apiClient'
import { apiDelete, apiGetJson, apiPatchJson, apiPostJson } from './apiClient'
import { timeSeriesService } from './timeSeriesService'
import { useAuthStore } from '../stores/authStore'

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
  probability: number
  impact: number
  riskScore: number
  category: string
  status: Risk['status']
  threatType: Risk['threatType']
  mitigationPlan: string
  creationDate: string
  lastModified: string
  data?: unknown
}

type ApiRisksListResponse = {
  items: ApiRisk[]
  count: number | null
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

function inflateRisk(apiRisk: ApiRisk): Risk {
  const data = normalizeObject(apiRisk.data)

  return {
    id: apiRisk.id,
    title: apiRisk.title,
    description: apiRisk.description,
    probability: Number(apiRisk.probability),
    impact: Number(apiRisk.impact),
    riskScore: Number(apiRisk.riskScore),
    category: apiRisk.category,
    threatType: apiRisk.threatType,
    templateId: typeof data.templateId === 'string' ? data.templateId : undefined,
    status: apiRisk.status,
    mitigationPlan: apiRisk.mitigationPlan ?? '',
    mitigationSteps: Array.isArray(data.mitigationSteps) ? (data.mitigationSteps as any) : [],
    checklists: Array.isArray(data.checklists) ? (data.checklists as any) : [],
    checklistStatus:
      data.checklistStatus === 'not_started' || data.checklistStatus === 'in_progress' || data.checklistStatus === 'done'
        ? (data.checklistStatus as any)
        : 'not_started',
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

function extractRiskData(input: RiskInput): Record<string, unknown> {
  const {
    description: _description,
    probability: _probability,
    impact: _impact,
    category: _category,
    threatType: _threatType,
    status: _status,
    mitigationPlan: _mitigationPlan,
    ...rest
  } = input as any

  return rest as Record<string, unknown>
}

function formatApiError(error: unknown): string {
  const err = error as ApiError
  if (err && typeof err.status === 'number' && typeof err.message === 'string') {
    return `${err.status}: ${err.message}`
  }
  if (error instanceof Error) return error.message
  return 'Unexpected error'
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

    try {
      const [categories, risksResponse] = await Promise.all([
        apiGetJson<ApiCategory[]>('/api/categories'),
        apiGetJson<ApiRisksListResponse>('/api/risks?limit=500&sort=updated_at&order=desc'),
      ])

      const categoryNames = Array.from(
        new Set(
          (categories || [])
            .map((c) => (typeof c?.name === 'string' ? c.name : ''))
            .map((name) => name.trim())
            .filter(Boolean),
        ),
      )

      const risks = (risksResponse?.items || []).map(inflateRisk)

      store.replaceFromApi({ risks, categories: categoryNames })
      store.setDataSyncState({
        status: 'ready',
        error: null,
        lastSyncedAt: new Date().toISOString(),
      })
      cacheUtil.clear()
    } catch (error) {
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
    }

    const apiRisk = await apiPostJson<ApiRisk>('/api/risks', payload)
    const risk = inflateRisk(apiRisk)

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
    }

    const apiRisk = await apiPatchJson<ApiRisk>(`/api/risks/${id}`, patch)
    const risk = inflateRisk(apiRisk)
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

  /** Attaches a compliance checklist template to a risk */
  attachChecklistTemplate: (riskId: string, templateId: string) =>
    useRiskStore.getState().attachChecklistTemplate(riskId, templateId),

  /** Toggles a checklist item's completion state */
  toggleChecklistItem: (riskId: string, checklistId: string, itemId: string) =>
    useRiskStore.getState().toggleChecklistItem(riskId, checklistId, itemId),

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
  updateSettings: (updates: Partial<AppSettings>) => useRiskStore.getState().updateSettings(updates),

  /** Updates reminder-specific settings */
  updateReminderSettings: (updates: Partial<ReminderSettings>) =>
    useRiskStore.getState().updateReminderSettings(updates),

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
  const createMaturityAssessment = useRiskStore((state) => state.createMaturityAssessment)
  const updateMaturityDomain = useRiskStore((state) => state.updateMaturityDomain)
  const deleteMaturityAssessment = useRiskStore((state) => state.deleteMaturityAssessment)
  const attachChecklistTemplate = useRiskStore((state) => state.attachChecklistTemplate)
  const toggleChecklistItem = useRiskStore((state) => state.toggleChecklistItem)
  const addCategory = useRiskStore((state) => state.addCategory)
  const setFilters = useRiskStore((state) => state.setFilters)
  const exportToCSV = useRiskStore((state) => state.exportToCSV)
  const importFromCSV = useRiskStore((state) => state.importFromCSV)
  const seedDemoData = useRiskStore((state) => state.seedDemoData)
  const updateSettings = useRiskStore((state) => state.updateSettings)
  const updateReminderSettings = useRiskStore((state) => state.updateReminderSettings)

  const actions = useMemo(
    () => ({
      syncFromApi: riskService.syncFromApi,
      addRisk: riskService.create,
      updateRisk: riskService.update,
      deleteRisk: riskService.remove,
      attachChecklistTemplate,
      toggleChecklistItem,
      addCategory,
      setFilters,
      exportToCSV,
      importFromCSV,
      seedDemoData,
      updateSettings,
      updateReminderSettings,
      createMaturityAssessment,
      updateMaturityDomain,
      deleteMaturityAssessment,
    }),
    [
      attachChecklistTemplate,
      addCategory,
      exportToCSV,
      importFromCSV,
      seedDemoData,
      setFilters,
      toggleChecklistItem,
      updateReminderSettings,
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
    actions,
  }
}
