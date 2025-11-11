import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRiskStore } from './src/stores/riskStore'
import type { RiskInput } from './src/types/risk'

// Mock nanoid to have predictable IDs for testing
vi.mock('nanoid', () => ({
  nanoid: (size: number) => `mock-id-${size}`
}))

describe('RiskStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useRiskStore.setState({
      risks: [],
      filteredRisks: [],
      categories: [],
      filters: { search: '', category: 'all', status: 'all', severity: 'all' },
      stats: {
        total: 0,
        byStatus: { open: 0, mitigated: 0, closed: 0 },
        bySeverity: { low: 0, medium: 0, high: 0 },
        averageScore: 0,
        maxScore: 0,
        updatedAt: new Date().toISOString()
      }
    })
  })

  describe('Risk Creation', () => {
    it('should add a new risk', () => {
      const newRisk: RiskInput = {
        title: 'Test Risk',
        description: 'Test Description',
        probability: 3,
        impact: 4,
        category: 'Security',
      }

      const addedRisk = useRiskStore.getState().addRisk(newRisk)
      
      expect(addedRisk.title).toBe('Test Risk')
      expect(addedRisk.description).toBe('Test Description')
      expect(addedRisk.probability).toBe(3)
      expect(addedRisk.impact).toBe(4)
      expect(addedRisk.riskScore).toBe(12) // 3 * 4
      expect(addedRisk.category).toBe('Security')
      expect(addedRisk.status).toBe('open')
      
      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(1)
      expect(state.risks[0].id).toBe('mock-id-12')
    })
  })

  describe('Risk Management', () => {
    it('should update an existing risk', () => {
      const newRisk: RiskInput = {
        title: 'Original Risk',
        description: 'Original Description',
        probability: 2,
        impact: 3,
        category: 'Operational',
      }

      const risk = useRiskStore.getState().addRisk(newRisk)
      const updatedRisk = useRiskStore.getState().updateRisk(risk.id, {
        title: 'Updated Risk',
        probability: 4
      })

      expect(updatedRisk?.title).toBe('Updated Risk')
      expect(updatedRisk?.probability).toBe(4)
      expect(updatedRisk?.riskScore).toBe(12) // 4 * 3 (unchanged impact)

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(1)
      expect(state.risks[0].title).toBe('Updated Risk')
    })

    it('should delete a risk', () => {
      const newRisk: RiskInput = {
        title: 'Test Risk',
        description: 'Test Description',
        probability: 2,
        impact: 3,
        category: 'Operational',
      }

      const risk = useRiskStore.getState().addRisk(newRisk)
      useRiskStore.getState().deleteRisk(risk.id)

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(0)
    })
  })

  describe('CSV Import/Export', () => {
    it('should export risks to CSV format', () => {
      const newRisk: RiskInput = {
        title: 'CSV Test Risk',
        description: 'CSV Test Description',
        probability: 2,
        impact: 3,
        category: 'Compliance',
        mitigationPlan: 'Test mitigation',
      }

      useRiskStore.getState().addRisk(newRisk)
      const csv = useRiskStore.getState().exportToCSV()

      expect(csv).toContain('CSV Test Risk')
      expect(csv).toContain('CSV Test Description')
      expect(csv).toContain('2')
      expect(csv).toContain('3')
      expect(csv).toContain('6') // risk score
      expect(csv).toContain('Compliance')
      expect(csv).toContain('Test mitigation')
    })

    it('should import risks from CSV format', () => {
      const csvData = `id,title,description,probability,impact,riskScore,category,status,mitigationPlan,creationDate,lastModified
test-id,"Imported Risk","Imported Description",3,4,12,"Financial","open","Imported Plan","2023-01-01T00:00:00.000Z","2023-01-01T00:00:00.000Z"`

      const importedCount = useRiskStore.getState().importFromCSV(csvData)
      expect(importedCount).toBe(1)

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(1)
      expect(state.risks[0].title).toBe('Imported Risk')
      expect(state.risks[0].description).toBe('Imported Description')
      expect(state.risks[0].probability).toBe(3)
      expect(state.risks[0].impact).toBe(4)
      expect(state.risks[0].riskScore).toBe(12)
      expect(state.risks[0].category).toBe('Financial')
      expect(state.risks[0].status).toBe('open')
      expect(state.risks[0].mitigationPlan).toBe('Imported Plan')
    })
  })

  describe('Filtering', () => {
    beforeEach(() => {
      const risks = [
        {
          title: 'High Risk',
          description: 'A high severity risk',
          probability: 4,
          impact: 4,
          category: 'Security',
          status: 'open',
        },
        {
          title: 'Low Risk',
          description: 'A low severity risk',
          probability: 1,
          impact: 2,
          category: 'Operational',
          status: 'closed',
        },
        {
          title: 'Medium Risk',
          description: 'A medium severity risk',
          probability: 2,
          impact: 3,
          category: 'Compliance',
          status: 'mitigated',
        }
      ]

      risks.forEach(risk => useRiskStore.getState().addRisk(risk))
    })

    it('should filter risks by category', () => {
      useRiskStore.getState().setFilters({ category: 'Security' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1)
      expect(state.filteredRisks[0].title).toBe('High Risk')
    })

    it('should filter risks by status', () => {
      useRiskStore.getState().setFilters({ status: 'open' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1)
      expect(state.filteredRisks[0].title).toBe('High Risk')
    })

    it('should filter risks by severity', () => {
      // 4*4=16 (high), 1*2=2 (low), 2*3=6 (medium)
      useRiskStore.getState().setFilters({ severity: 'high' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1)
      expect(state.filteredRisks[0].title).toBe('High Risk')
    })

    it('should filter risks by search term', () => {
      useRiskStore.getState().setFilters({ search: 'High' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1)
      expect(state.filteredRisks[0].title).toBe('High Risk')
    })
  })

  describe('Demo Data Seeding', () => {
    it('should seed demo data when store is empty', () => {
      const seededCount = useRiskStore.getState().seedDemoData()

      expect(seededCount).toBeGreaterThan(0)

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(seededCount)
      expect(state.risks[0].title).toBeDefined()
      expect(state.risks[0].description).toBeDefined()
    })

    it('should not seed demo data when store already has risks', () => {
      const newRisk: RiskInput = {
        title: 'Existing Risk',
        description: 'Existing Description',
        probability: 2,
        impact: 3,
        category: 'Operational',
      }

      useRiskStore.getState().addRisk(newRisk)
      const seededCount = useRiskStore.getState().seedDemoData()

      expect(seededCount).toBe(0)

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(1)
    })
  })
})