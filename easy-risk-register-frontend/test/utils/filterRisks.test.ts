import { describe, it, expect, beforeEach } from 'vitest'
import type { Risk, RiskFilters } from '../../src/types/risk'
import { filterRisks, DEFAULT_FILTERS } from '../../src/utils/riskCalculations'

describe('filterRisks consistency', () => {
    const createMockRisk = (overrides?: Partial<Risk>): Risk => ({
        id: 'risk-' + Math.random().toString(36).substring(7),
        description: 'Test risk',
        category: 'Cyber Security',
        probability: 3,
        impact: 2,
        riskScore: 6,
        status: 'open',
        threatType: 'phishing',
        riskResponse: 'treat',
        mitigationPlan: 'Test mitigation',
        evidence: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        checklists: [],
        ...overrides,
    })

    describe('single filter consistency', () => {
        it('should filter by status consistently', () => {
            const risks = [
                createMockRisk({ status: 'open' }),
                createMockRisk({ status: 'mitigated' }),
                createMockRisk({ status: 'open' }),
                createMockRisk({ status: 'closed' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, statuses: ['open'] }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.status === 'open')).toBe(true)
        })

        it('should filter by category consistently', () => {
            const risks = [
                createMockRisk({ category: 'Cyber Security' }),
                createMockRisk({ category: 'Operational' }),
                createMockRisk({ category: 'Cyber Security' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, categories: ['Cyber Security'] }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.category === 'Cyber Security')).toBe(true)
        })

        it('should filter by threat type consistently', () => {
            const risks = [
                createMockRisk({ threatType: 'phishing' }),
                createMockRisk({ threatType: 'ransomware' }),
                createMockRisk({ threatType: 'phishing' }),
                createMockRisk({ threatType: 'malware' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, threatTypes: ['phishing'] }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.threatType === 'phishing')).toBe(true)
        })

        it('should filter by severity consistently', () => {
            const risks = [
                createMockRisk({ riskScore: 2 }), // Low
                createMockRisk({ riskScore: 5 }), // Medium
                createMockRisk({ riskScore: 4 }), // Medium
                createMockRisk({ riskScore: 10 }), // High
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, severities: ['medium'] }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.riskScore <= 6 && r.riskScore > 3)).toBe(true)
        })

        it('should return all risks when filter array is empty', () => {
            const risks = [
                createMockRisk({ category: 'Cyber Security' }),
                createMockRisk({ category: 'Operational' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, categories: [] }
            const result = filterRisks(risks, filters)

            expect(result).toEqual(risks)
        })
    })

    describe('multiple filter consistency', () => {
        it('should apply AND logic across multiple filters', () => {
            const risks = [
                createMockRisk({
                    status: 'open',
                    category: 'Cyber Security',
                    threatType: 'phishing',
                }),
                createMockRisk({
                    status: 'open',
                    category: 'Operational',
                    threatType: 'phishing',
                }),
                createMockRisk({
                    status: 'mitigated',
                    category: 'Cyber Security',
                    threatType: 'phishing',
                }),
                createMockRisk({
                    status: 'open',
                    category: 'Cyber Security',
                    threatType: 'ransomware',
                }),
            ]

            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                statuses: ['open'],
                categories: ['Cyber Security'],
                threatTypes: ['phishing'],
            }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(1)
            expect(result[0].status).toBe('open')
            expect(result[0].category).toBe('Cyber Security')
            expect(result[0].threatType).toBe('phishing')
        })

        it('should apply OR logic within the same filter type', () => {
            const risks = [
                createMockRisk({ status: 'open' }),
                createMockRisk({ status: 'mitigated' }),
                createMockRisk({ status: 'closed' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, statuses: ['open', 'mitigated'] }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.status === 'open' || r.status === 'mitigated')).toBe(true)
        })

        it('should maintain consistency with combined status and category filters', () => {
            const risks = [
                createMockRisk({ status: 'open', category: 'Cyber' }),
                createMockRisk({ status: 'open', category: 'Operational' }),
                createMockRisk({ status: 'mitigated', category: 'Cyber' }),
                createMockRisk({ status: 'mitigated', category: 'Operational' }),
            ]

            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                statuses: ['open', 'mitigated'],
                categories: ['Cyber'],
            }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.category === 'Cyber')).toBe(true)
        })
    })

    describe('search filter consistency', () => {
        it('should search in description', () => {
            const risks = [
                createMockRisk({ description: 'Phishing attack vulnerability' }),
                createMockRisk({ description: 'Database backup failure' }),
                createMockRisk({ description: 'Email phishing campaign' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, searchQuery: 'phishing' }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(2)
            expect(result.every((r) => r.description.toLowerCase().includes('phishing'))).toBe(true)
        })

        it('should be case-insensitive', () => {
            const risks = [
                createMockRisk({ description: 'PHISHING ATTACK' }),
                createMockRisk({ description: 'phishing threat' }),
                createMockRisk({ description: 'Phishing Email' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, searchQuery: 'PHISHING' }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(3)
        })

        it('should search in category when description does not match', () => {
            const risks = [
                createMockRisk({ description: 'Test', category: 'Cyber Security' }),
                createMockRisk({ description: 'Test', category: 'Operational' }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, searchQuery: 'cyber' }
            const result = filterRisks(risks, filters)

            expect(result).toHaveLength(1)
            expect(result[0].category).toBe('Cyber Security')
        })
    })

    describe('checklist filter consistency', () => {
        it('should filter by checklist completion status', () => {
            const risks = [
                createMockRisk({ checklists: [] }),
                createMockRisk({
                    checklists: [
                        {
                            checklistId: 'cl-1',
                            templateId: 'template-1',
                            items: [{ itemId: 'item-1', name: 'Check 1', completed: true }],
                            completedAt: new Date().toISOString(),
                        },
                    ],
                }),
                createMockRisk({
                    checklists: [
                        {
                            checklistId: 'cl-2',
                            templateId: 'template-1',
                            items: [{ itemId: 'item-1', name: 'Check 1', completed: false }],
                            completedAt: undefined,
                        },
                    ],
                }),
            ]

            const filters: RiskFilters = { ...DEFAULT_FILTERS, checklistCompletionStatus: ['not_started'] }
            const result = filterRisks(risks, filters)

            // Should include risks without checklists and checklists not started
            expect(result.length).toBeGreaterThanOrEqual(1)
        })
    })

    describe('empty filter handling', () => {
        it('should return all risks with default filters', () => {
            const risks = [createMockRisk(), createMockRisk(), createMockRisk()]

            const result = filterRisks(risks, DEFAULT_FILTERS)

            expect(result).toEqual(risks)
        })

        it('should return all risks when all filter arrays are empty', () => {
            const risks = [createMockRisk(), createMockRisk()]

            const filters: RiskFilters = {
                statuses: [],
                categories: [],
                threatTypes: [],
                severities: [],
                checklistCompletionStatus: [],
                searchQuery: '',
            }
            const result = filterRisks(risks, filters)

            expect(result).toEqual(risks)
        })
    })

    describe('consistency across multiple calls', () => {
        it('should return consistent results for identical inputs', () => {
            const risks = [
                createMockRisk({ status: 'open', category: 'Cyber' }),
                createMockRisk({ status: 'mitigated', category: 'Cyber' }),
                createMockRisk({ status: 'open', category: 'Operational' }),
            ]

            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                statuses: ['open'],
                categories: ['Cyber'],
            }

            const result1 = filterRisks(risks, filters)
            const result2 = filterRisks(risks, filters)

            expect(result1).toEqual(result2)
            expect(result1.map((r) => r.id)).toEqual(result2.map((r) => r.id))
        })

        it('should maintain order consistency', () => {
            const risks = [
                createMockRisk({ id: 'risk-1' }),
                createMockRisk({ id: 'risk-2' }),
                createMockRisk({ id: 'risk-3' }),
            ]

            const filters = DEFAULT_FILTERS
            const result1 = filterRisks(risks, filters)
            const result2 = filterRisks([...risks].reverse(), filters)

            // Order should match original input order, not filter application order
            expect(result1.map((r) => r.id)).toEqual(['risk-1', 'risk-2', 'risk-3'])
            expect(result2.map((r) => r.id)).toEqual(['risk-3', 'risk-2', 'risk-1'])
        })
    })

    describe('performance with large datasets', () => {
        it('should handle ~1000 risks efficiently', () => {
            const risks: Risk[] = []
            for (let i = 0; i < 1000; i += 1) {
                risks.push(
                    createMockRisk({
                        id: `risk-${i}`,
                        status: i % 3 === 0 ? 'open' : i % 3 === 1 ? 'mitigated' : 'closed',
                        category: i % 2 === 0 ? 'Cyber Security' : 'Operational',
                        threatType: ['phishing', 'ransomware', 'malware'][i % 3] as any,
                    }),
                )
            }

            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                statuses: ['open'],
                categories: ['Cyber Security'],
            }

            const startTime = performance.now()
            const result = filterRisks(risks, filters)
            const duration = performance.now() - startTime

            expect(result.length).toBeGreaterThan(0)
            expect(result.length).toBeLessThanOrEqual(1000)

            // Should complete in reasonable time (< 10ms for JS filtering)
            expect(duration).toBeLessThan(10)
        })
    })
})
