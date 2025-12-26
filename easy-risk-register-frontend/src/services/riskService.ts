import { useMemo } from 'react'

import type { Risk, RiskFilters, RiskInput } from '../types/risk'
import { useRiskStore } from '../stores/riskStore'
import type { CSVExportVariant } from '../stores/riskStore'
import type { AppSettings, ReminderSettings } from '../stores/riskStore'
import { timeSeriesService } from './timeSeriesService'

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

/**
 * Risk service providing centralized access to risk management operations
 * This service acts as a facade to the risk store, providing consistent methods
 * for interacting with risk data throughout the application
 */
export const riskService = {
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
  create: (input: RiskInput) => {
    // Clear related cache entries
    cacheUtil.delete('filteredRisks');
    cacheUtil.delete('allRisks');
    cacheUtil.delete('risk_stats');
    const risk = useRiskStore.getState().addRisk(input);
    void timeSeriesService.writeSnapshot(risk).catch(() => {})
    return risk
  },

  /** Updates an existing risk with the provided partial updates */
  update: (
    id: string,
    updates: Partial<RiskInput> & { status?: Risk['status'] },
  ) => {
    // Clear related cache entries
    cacheUtil.delete(`risk_${id}`);
    cacheUtil.delete('filteredRisks');
    cacheUtil.delete('allRisks');
    cacheUtil.delete('risk_stats');
    const risk = useRiskStore.getState().updateRisk(id, updates);
    const maybeScoreChanged = Object.prototype.hasOwnProperty.call(updates, 'probability')
      || Object.prototype.hasOwnProperty.call(updates, 'impact')
    if (risk && maybeScoreChanged) {
      void timeSeriesService.writeSnapshot(risk).catch(() => {})
    }
    return risk
  },

  /** Removes a risk from the store by its ID */
  remove: (id: string) => {
    // Clear related cache entries
    cacheUtil.delete(`risk_${id}`);
    cacheUtil.delete('filteredRisks');
    cacheUtil.delete('allRisks');
    cacheUtil.delete('risk_stats');
    return useRiskStore.getState().deleteRisk(id);
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
  const createMaturityAssessment = useRiskStore((state) => state.createMaturityAssessment)
  const updateMaturityDomain = useRiskStore((state) => state.updateMaturityDomain)
  const deleteMaturityAssessment = useRiskStore((state) => state.deleteMaturityAssessment)
  const deleteRisk = useRiskStore((state) => state.deleteRisk)
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
      addRisk: riskService.create,
      updateRisk: riskService.update,
      deleteRisk,
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
      deleteRisk,
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
    actions,
  }
}
