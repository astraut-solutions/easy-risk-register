import { useMemo } from 'react'

import type { Risk, RiskFilters, RiskInput } from '../types/risk'
import { useRiskStore } from '../stores/riskStore'

/**
 * Risk service providing centralized access to risk management operations
 * This service acts as a facade to the risk store, providing consistent methods
 * for interacting with risk data throughout the application
 */
export const riskService = {
  /** Returns the currently filtered list of risks */
  list: (): Risk[] => useRiskStore.getState().filteredRisks,

  /** Returns the complete list of all risks without filtering */
  listAll: (): Risk[] => useRiskStore.getState().risks,

  /** Retrieves a specific risk by its unique ID */
  getById: (id: string): Risk | undefined =>
    useRiskStore.getState().risks.find((risk) => risk.id === id),

  /** Creates a new risk record with the provided input data */
  create: (input: RiskInput) => useRiskStore.getState().addRisk(input),

  /** Updates an existing risk with the provided partial updates */
  update: (
    id: string,
    updates: Partial<RiskInput> & { status?: Risk['status'] },
  ) => useRiskStore.getState().updateRisk(id, updates),

  /** Removes a risk from the store by its ID */
  remove: (id: string) => useRiskStore.getState().deleteRisk(id),

  /** Updates the current risk filtering criteria */
  setFilters: (updates: Partial<RiskFilters>) =>
    useRiskStore.getState().setFilters(updates),

  /** Exports all risks to CSV format for external use */
  exportCSV: () => useRiskStore.getState().exportToCSV(),

  /** Imports risks from a CSV string and adds them to the store */
  importCSV: (csv: string) => useRiskStore.getState().importFromCSV(csv),

  /** Seeds the risk store with demonstration data for testing purposes */
  seedDemoData: () => useRiskStore.getState().seedDemoData(),
}

/**
 * Custom React hook that provides access to risk management functionality
 * This hook offers both the current risk data and methods to manipulate it
 * @returns Object containing risk data (risks, stats, filters, categories) and actions
 */
export const useRiskManagement = () => {
  const risks = useRiskStore((state) => state.filteredRisks)
  const stats = useRiskStore((state) => state.stats)
  const filters = useRiskStore((state) => state.filters)
  const categories = useRiskStore((state) => state.categories)
  const addRisk = useRiskStore((state) => state.addRisk)
  const updateRisk = useRiskStore((state) => state.updateRisk)
  const deleteRisk = useRiskStore((state) => state.deleteRisk)
  const setFilters = useRiskStore((state) => state.setFilters)
  const exportToCSV = useRiskStore((state) => state.exportToCSV)
  const importFromCSV = useRiskStore((state) => state.importFromCSV)
  const seedDemoData = useRiskStore((state) => state.seedDemoData)

  const actions = useMemo(
    () => ({
      addRisk,
      updateRisk,
      deleteRisk,
      setFilters,
      exportToCSV,
      importFromCSV,
      seedDemoData,
    }),
    [
      addRisk,
      deleteRisk,
      exportToCSV,
      importFromCSV,
      seedDemoData,
      setFilters,
      updateRisk,
    ],
  )

  return { risks, stats, filters, categories, actions }
}
