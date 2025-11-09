import { useMemo } from 'react'

import type { Risk, RiskFilters, RiskInput } from '../types/risk'
import { useRiskStore } from '../stores/riskStore'

export const riskService = {
  list: (): Risk[] => useRiskStore.getState().filteredRisks,
  listAll: (): Risk[] => useRiskStore.getState().risks,
  getById: (id: string): Risk | undefined =>
    useRiskStore.getState().risks.find((risk) => risk.id === id),
  create: (input: RiskInput) => useRiskStore.getState().addRisk(input),
  update: (
    id: string,
    updates: Partial<RiskInput> & { status?: Risk['status'] },
  ) => useRiskStore.getState().updateRisk(id, updates),
  remove: (id: string) => useRiskStore.getState().deleteRisk(id),
  setFilters: (updates: Partial<RiskFilters>) =>
    useRiskStore.getState().setFilters(updates),
  exportCSV: () => useRiskStore.getState().exportToCSV(),
  importCSV: (csv: string) => useRiskStore.getState().importFromCSV(csv),
  seedDemoData: () => useRiskStore.getState().seedDemoData(),
}

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
