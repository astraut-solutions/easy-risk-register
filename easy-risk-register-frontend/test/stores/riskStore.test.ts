import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRiskStore } from '../../src/stores/riskStore'
import type { RiskInput } from '../../src/types/risk'
import { DEFAULT_FILTERS } from '../../src/utils/riskCalculations'
import { DEFAULT_SETTINGS } from '../../src/stores/riskStore'

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
      filters: { ...DEFAULT_FILTERS },
      stats: {
        total: 0,
        byStatus: { open: 0, mitigated: 0, closed: 0, accepted: 0 },
        bySeverity: { low: 0, medium: 0, high: 0 },
        averageScore: 0,
        maxScore: 0,
        updatedAt: new Date().toISOString()
      },
      settings: { ...DEFAULT_SETTINGS, onboardingDismissed: true },
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

      expect(csv.split('\n')[0]).toContain('csvSpecVersion')
      expect(csv.split('\n')[0]).toContain('owner')
      expect(csv.split('\n')[0]).toContain('evidenceJson')
      expect(csv.split('\n')[0]).toContain('mitigationStepsJson')
      expect(csv).toContain('CSV Test Risk')
      expect(csv).toContain('CSV Test Description')
      expect(csv).toContain('2')
      expect(csv).toContain('3')
      expect(csv).toContain('6') // risk score
      expect(csv).toContain('Compliance')
      expect(csv).toContain('Test mitigation')
    })

    it('should protect against CSV/Excel formula injection on export', () => {
      useRiskStore.getState().addRisk({
        title: '=2+2',
        description: 'Formula-like title',
        probability: 1,
        impact: 1,
        category: 'Security',
      })

      const csv = useRiskStore.getState().exportToCSV()
      expect(csv).toContain("'=2+2")
    })

    it('should export an audit pack CSV with evidence URL columns', () => {
      useRiskStore.getState().addRisk({
        title: 'Audit pack risk',
        description: 'Includes evidence',
        probability: 3,
        impact: 3,
        category: 'Custom Audit Category',
        evidence: [
          {
            type: 'link',
            url: 'https://example.com/evidence',
            addedAt: '2023-01-01T00:00:00.000Z',
            description: 'Example evidence',
          },
        ],
        mitigationSteps: [
          {
            id: 'step-1',
            description: 'Do thing',
            status: 'open',
            createdAt: '2023-01-01T00:00:00.000Z',
          },
          {
            id: 'step-2',
            description: 'Done thing',
            status: 'done',
            createdAt: '2023-01-02T00:00:00.000Z',
            completedAt: '2023-01-03T00:00:00.000Z',
          },
        ],
      })

      const csv = useRiskStore.getState().exportToCSV('audit_pack')
      expect(csv.split('\n')[0]).toContain('evidenceUrls')
      expect(csv).toContain('https://example.com/evidence')
    })

    it('should import risks from CSV format', () => {
      const csvData = `id,title,description,probability,impact,riskScore,category,status,mitigationPlan,creationDate,lastModified
test-id,"Imported Risk","Imported Description",3,4,12,"Financial","open","Imported Plan","2023-01-01T00:00:00.000Z","2023-01-01T00:00:00.000Z"`

      const result = useRiskStore.getState().importFromCSV(csvData)
      expect(result).toEqual({ imported: 1 })

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
      expect(state.categories).toContain('Financial')
    })

    it('should import new-format CSV columns (including evidence JSON) when present', () => {
      const evidenceJson = '[{""type"":""link"",""url"":""https://example.com/evidence"",""addedAt"":""2023-01-01T00:00:00.000Z""}]'
      const mitigationStepsJson = '[{""id"":""step-1"",""description"":""Step"",""status"":""open"",""createdAt"":""2023-01-01T00:00:00.000Z""}]'

      const csvData =
        `csvSpecVersion,csvVariant,id,title,description,probability,impact,category,status,mitigationPlan,owner,reviewCadence,evidenceJson,mitigationStepsJson,creationDate,lastModified\n` +
        `1,standard,test-id,"Imported Risk","Imported Description",3,4,"CustomCat","accepted","Imported Plan","Owner Name","monthly","${evidenceJson}","${mitigationStepsJson}","2023-01-01T00:00:00.000Z","2023-01-01T00:00:00.000Z"`

      const result = useRiskStore.getState().importFromCSV(csvData)
      expect(result).toEqual({ imported: 1 })

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(1)
      expect(state.risks[0].status).toBe('accepted')
      expect(state.risks[0].owner).toBe('Owner Name')
      expect(state.risks[0].reviewCadence).toBe('monthly')
      expect(state.risks[0].evidence).toHaveLength(1)
      expect(state.risks[0].evidence[0].url).toBe('https://example.com/evidence')
      expect(state.risks[0].mitigationSteps).toHaveLength(1)
      expect(state.categories).toContain('CustomCat')
    })

    it('should round-trip standard CSV exports (new format) with evidence and mitigation steps', () => {
      useRiskStore.getState().addRisk({
        title: 'Roundtrip risk',
        description: 'Roundtrip description',
        probability: 4,
        impact: 4,
        category: 'Roundtrip Category',
        status: 'accepted',
        owner: 'Jane Riskowner',
        ownerTeam: 'Security',
        dueDate: '2024-12-01',
        reviewCadence: 'quarterly',
        evidence: [
          {
            type: 'ticket',
            url: 'https://example.com/ticket/123',
            description: 'Tracked in ticket',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        mitigationSteps: [
          {
            id: 'step-1',
            description: 'Patch thing',
            owner: 'Ops',
            dueDate: '2024-02-01',
            status: 'open',
            createdAt: '2024-01-10T00:00:00.000Z',
          },
        ],
        notes: 'Some longer notes',
      })

      const csv = useRiskStore.getState().exportToCSV()

      useRiskStore.setState({
        risks: [],
        filteredRisks: [],
        categories: [],
        filters: { ...DEFAULT_FILTERS },
        stats: {
          total: 0,
          byStatus: { open: 0, mitigated: 0, closed: 0, accepted: 0 },
          bySeverity: { low: 0, medium: 0, high: 0 },
          averageScore: 0,
          maxScore: 0,
          updatedAt: new Date().toISOString(),
        },
      })

      const result = useRiskStore.getState().importFromCSV(csv)
      expect(result).toEqual({ imported: 1 })

      const state = useRiskStore.getState()
      expect(state.risks).toHaveLength(1)
      expect(state.risks[0].title).toBe('Roundtrip risk')
      expect(state.risks[0].status).toBe('accepted')
      expect(state.risks[0].owner).toBe('Jane Riskowner')
      expect(state.risks[0].reviewCadence).toBe('quarterly')
      expect(state.risks[0].evidence).toHaveLength(1)
      expect(state.risks[0].evidence[0].url).toBe('https://example.com/ticket/123')
      expect(state.risks[0].mitigationSteps).toHaveLength(1)
      expect(state.categories).toContain('Roundtrip Category')
    })

    it('should round-trip legacy CSV imports by exporting as the new versioned format', () => {
      const legacyCsv =
        'id,title,description,probability,impact,riskScore,category,status,mitigationPlan,creationDate,lastModified\n' +
        'legacy-1,"Legacy Risk","Legacy Desc",2,3,6,"LegacyCat","open","Legacy Plan","2023-01-01T00:00:00.000Z","2023-01-02T00:00:00.000Z"'

      const imported = useRiskStore.getState().importFromCSV(legacyCsv)
      expect(imported).toEqual({ imported: 1 })

      const exported = useRiskStore.getState().exportToCSV()
      expect(exported.split('\n')[0]).toContain('csvSpecVersion')
      expect(exported).toContain('Legacy Risk')
      expect(useRiskStore.getState().categories).toContain('LegacyCat')
    })

    it('should return a reason when CSV contains no valid rows', () => {
      const csvData = `id,name,details
test-id,"Missing fields","No title/description columns here"`

      const result = useRiskStore.getState().importFromCSV(csvData)
      expect(result).toEqual({ imported: 0, reason: 'no_valid_rows' })
    })

    it('should return a reason when CSV validation fails', () => {
      const csvData = `id,title,description
1,"=HYPERLINK(\\"http://evil\\",\\"click\\")","Looks fine"`

      const result = useRiskStore.getState().importFromCSV(csvData)
      expect(result).toEqual({ imported: 0, reason: 'invalid_content' })
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
      // 4*4=16 (high), 1*2=2 (low), 2*3=6 (medium with new thresholds)
      useRiskStore.getState().setFilters({ severity: 'high' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1) // Only 'High Risk' (16) should be high
      expect(state.filteredRisks[0].title).toBe('High Risk')
    })

    it('should correctly identify medium severity risks', () => {
      // 4*4=16 (high), 1*2=2 (low), 2*3=6 (medium with new thresholds)
      useRiskStore.getState().setFilters({ severity: 'medium' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1) // Only 'Medium Risk' (6) should be medium
      expect(state.filteredRisks[0].title).toBe('Medium Risk')
    })

    it('should filter risks by search term', () => {
      useRiskStore.getState().setFilters({ search: 'High' })

      const state = useRiskStore.getState()
      expect(state.filteredRisks).toHaveLength(1)
      expect(state.filteredRisks[0].title).toBe('High Risk')
    })
  })

  describe('Validation edge cases', () => {
    it('should drop invalid evidence URLs when adding a risk', () => {
      useRiskStore.getState().addRisk({
        title: 'Evidence URL validation',
        description: 'Evidence should be validated',
        probability: 2,
        impact: 2,
        category: 'Security',
        evidence: [
          { type: 'link', url: 'javascript:alert(1)', addedAt: '2023-01-01T00:00:00.000Z' },
          { type: 'link', url: 'https://example.com/ok', addedAt: '2023-01-01T00:00:00.000Z' },
        ],
      })

      const state = useRiskStore.getState()
      expect(state.risks[0].evidence).toHaveLength(1)
      expect(state.risks[0].evidence[0].url).toBe('https://example.com/ok')
    })

    it('should ignore invalid ISO-like dates on import', () => {
      const csvData =
        `csvSpecVersion,csvVariant,id,title,description,probability,impact,category,status,mitigationPlan,owner,dueDate,reviewDate,creationDate,lastModified\n` +
        `1,standard,test-id,"Date Risk","Bad dates",3,4,"Security","open","Plan","","not-a-date","also-bad","2023-01-01T00:00:00.000Z","2023-01-01T00:00:00.000Z"`

      const result = useRiskStore.getState().importFromCSV(csvData)
      expect(result).toEqual({ imported: 1 })

      const state = useRiskStore.getState()
      expect(state.risks[0].dueDate).toBeUndefined()
      expect(state.risks[0].reviewDate).toBeUndefined()
    })

    it('should default missing owner to empty string', () => {
      const legacyCsv =
        'id,title,description,probability,impact,riskScore,category,status,mitigationPlan,creationDate,lastModified\n' +
        'legacy-2,"No owner","Legacy Desc",2,3,6,"Ops","open","Plan","2023-01-01T00:00:00.000Z","2023-01-02T00:00:00.000Z"'

      const result = useRiskStore.getState().importFromCSV(legacyCsv)
      expect(result).toEqual({ imported: 1 })
      expect(useRiskStore.getState().risks[0].owner).toBe('')
    })

    it('should truncate long notes to the configured maximum length', () => {
      const longNotes = 'a'.repeat(11000)
      useRiskStore.getState().addRisk({
        title: 'Long notes',
        description: 'Should truncate notes',
        probability: 2,
        impact: 2,
        category: 'Operational',
        notes: longNotes,
      })

      const state = useRiskStore.getState()
      expect(state.risks[0].notes?.length).toBe(10000)
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
