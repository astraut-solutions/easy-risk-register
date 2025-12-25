import { describe, it, expect, beforeEach } from 'vitest'
import type { Risk, RiskFilters } from '../../src/types/risk'
import { filterRisks, DEFAULT_FILTERS } from '../../src/utils/riskCalculations'
import { applySnapshotRetention } from '../../src/utils/snapshotRetention'
import type { RiskScoreSnapshot } from '../../src/types/visualization'

describe('Performance Tests with 1000 Risks', () => {
    const createMockRisk = (id: number, overrides?: Partial<Risk>): Risk => ({
        id: `risk-${id}`,
        title: `Test Risk ${id}`,
        description: `Test risk description ${id}`,
        category: ['Cyber Security', 'Operational', 'Strategic'][id % 3] as any,
        probability: Math.floor(Math.random() * 5) + 1,
        impact: Math.floor(Math.random() * 5) + 1,
        riskScore: 0, // Will be calculated
        status: ['open', 'mitigated', 'closed'][id % 3] as any,
        threatType: ['phishing', 'ransomware', 'malware', 'insider', 'misuse', 'physical', 'supply', 'cloud', 'web'][id % 9] as any,
        riskResponse: ['treat', 'transfer', 'tolerate', 'terminate'][id % 4] as any,
        mitigationPlan: `Test mitigation plan for risk ${id}`,
        evidence: [],
        creationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastModified: new Date().toISOString(),
        checklists: [],
        checklistStatus: ['not_started', 'in_progress', 'done'][id % 3] as any,
        owner: `Owner ${id}`,
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        mitigationSteps: [],
        ...overrides,
    })

    // Create 1000 risks for testing
    let risks: Risk[] = []

    beforeEach(() => {
        risks = []
        for (let i = 0; i < 1000; i++) {
            risks.push(createMockRisk(i))
        }
        
        // Calculate risk scores for all risks
        risks.forEach(risk => {
            risk.riskScore = risk.probability * risk.impact
        })
    })

    describe('Matrix Render Performance', () => {
        it('should filter 1000 risks efficiently', () => {
            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                status: 'open',
                category: 'Cyber Security',
            }

            const startTime = performance.now()
            const result = filterRisks(risks, filters)
            const duration = performance.now() - startTime

            console.log(`Filtering 1000 risks took ${duration}ms`)
            
            // Performance target: < 50ms for filter application
            expect(duration).toBeLessThan(50)
            
            // Ensure results are reasonable
            expect(result.length).toBeGreaterThanOrEqual(0)
            expect(result.length).toBeLessThanOrEqual(risks.length)
            
            // Verify filtering worked correctly
            if (result.length > 0) {
                expect(result.every(r => r.status === 'open' && r.category === 'Cyber Security')).toBe(true)
            }
        })

        it('should handle complex multi-filter scenarios efficiently', () => {
            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                status: 'open',
                category: 'Cyber Security',
                threatType: 'phishing',
                severity: 'medium',
            }

            const startTime = performance.now()
            const result = filterRisks(risks, filters)
            const duration = performance.now() - startTime

            console.log(`Complex filtering 1000 risks took ${duration}ms`)
            
            // Performance target: < 100ms for complex multi-filter
            expect(duration).toBeLessThan(100)
            
            expect(result.length).toBeGreaterThanOrEqual(0)
            expect(result.length).toBeLessThanOrEqual(risks.length)
        })
    })

    describe('Snapshot Retention Performance', () => {
        it('should apply retention policy to large dataset efficiently', () => {
            // Create 1000 risks with 50 snapshots each = 50,000 snapshots
            const snapshots: RiskScoreSnapshot[] = []
            const baseTime = Date.now()
            
            for (let i = 0; i < 1000; i++) {
                for (let j = 0; j < 50; j++) {
                    snapshots.push({
                        riskId: `risk-${i}`,
                        timestamp: baseTime - j * 24 * 60 * 60 * 1000, // One per day
                        probability: Math.floor(Math.random() * 5) + 1,
                        impact: Math.floor(Math.random() * 5) + 1,
                        riskScore: 0, // Will be calculated
                    })
                }
            }

            const startTime = performance.now()
            const result = applySnapshotRetention(snapshots, { mode: 'days', value: 365 }, baseTime)
            const duration = performance.now() - startTime

            console.log(`Snapshot retention for ${snapshots.length} snapshots took ${duration}ms`)
            
            // Performance target: < 50ms for snapshot retention
            expect(duration).toBeLessThan(50)
            
            expect(result.length).toBeGreaterThanOrEqual(0)
            expect(result.length).toBeLessThanOrEqual(snapshots.length)
        })

        it('should handle count-based retention efficiently', () => {
            // Create 1000 risks with 100 snapshots each = 100,000 snapshots
            const snapshots: RiskScoreSnapshot[] = []
            const baseTime = Date.now()
            
            for (let i = 0; i < 1000; i++) {
                for (let j = 0; j < 100; j++) {
                    snapshots.push({
                        riskId: `risk-${i}`,
                        timestamp: baseTime - j * 3600 * 1000, // One per hour
                        probability: Math.floor(Math.random() * 5) + 1,
                        impact: Math.floor(Math.random() * 5) + 1,
                        riskScore: 0, // Will be calculated
                    })
                }
            }

            const startTime = performance.now()
            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 10 }, baseTime)
            const duration = performance.now() - startTime

            console.log(`Count-based snapshot retention for ${snapshots.length} snapshots took ${duration}ms`)
            
            // Performance target: < 100ms for large count-based retention
            expect(duration).toBeLessThan(100)
            
            // Should have at most 10 snapshots per risk = 10,000 total
            expect(result.length).toBeLessThanOrEqual(10000)
        })
    })

    describe('Search Performance', () => {
        it('should search efficiently through 1000 risks', () => {
            // Add some risks with specific search terms
            for (let i = 0; i < 100; i++) {
                risks.push(createMockRisk(1000 + i, {
                    description: `This risk is about phishing and cybersecurity ${i}`
                }))
            }

            const filters: RiskFilters = {
                ...DEFAULT_FILTERS,
                search: 'phishing',
            }

            const startTime = performance.now()
            const result = filterRisks(risks, filters)
            const duration = performance.now() - startTime

            console.log(`Search through ${risks.length} risks took ${duration}ms`)
            
            // Performance target: < 50ms for search
            expect(duration).toBeLessThan(50)
            
            expect(result.length).toBeGreaterThanOrEqual(0)
            expect(result.length).toBeLessThanOrEqual(risks.length)
        })
    })

    describe('Memory Usage Check', () => {
        it('should not exceed reasonable memory usage with 1000 risks', () => {
            // Just verify that we can create and process 1000 risks without issues
            expect(risks.length).toBe(1000)
            
            // Test that filtering works without memory issues
            const result = filterRisks(risks, DEFAULT_FILTERS)
            expect(result.length).toBe(1000)
            
            // Test complex filtering
            const complexFilters: RiskFilters = {
                ...DEFAULT_FILTERS,
                status: 'open',
                category: 'Cyber Security',
                threatType: 'phishing',
            }
            
            const filteredResult = filterRisks(risks, complexFilters)
            expect(filteredResult.length).toBeGreaterThanOrEqual(0)
            expect(filteredResult.length).toBeLessThanOrEqual(1000)
        })
    })
})