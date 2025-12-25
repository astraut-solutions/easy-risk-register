import { describe, it, expect, beforeEach } from 'vitest'
import { applySnapshotRetention } from '../../src/utils/snapshotRetention'
import type { RiskScoreSnapshot } from '../../src/types/visualization'

describe('snapshotRetention', () => {
    const baseTime = new Date('2025-01-01T00:00:00Z').getTime()

    const createSnapshot = (
        riskId: string,
        daysAgo: number,
        overrides?: Partial<RiskScoreSnapshot>,
    ): RiskScoreSnapshot => ({
        riskId,
        timestamp: baseTime - daysAgo * 24 * 60 * 60 * 1000,
        probability: 3,
        impact: 2,
        riskScore: 6,
        ...overrides,
    })

    describe('days retention mode', () => {
        it('should remove snapshots older than retention period', () => {
            const snapshots = [
                createSnapshot('risk-1', 10),
                createSnapshot('risk-1', 5),
                createSnapshot('risk-1', 1),
                createSnapshot('risk-2', 10),
                createSnapshot('risk-2', 2),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'days', value: 7 }, baseTime)

            // Snapshots from 10 days ago should be removed, recent ones retained
            expect(result).toHaveLength(3)
            expect(result.map((s) => s.riskId)).toEqual(['risk-1', 'risk-2', 'risk-2'])
            expect(result[0].timestamp).toBe(baseTime - 5 * 24 * 60 * 60 * 1000)
        })

        it('should return empty array when all snapshots are outside retention', () => {
            const snapshots = [
                createSnapshot('risk-1', 100),
                createSnapshot('risk-1', 50),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'days', value: 7 }, baseTime)

            expect(result).toEqual([])
        })

        it('should retain all snapshots within retention window', () => {
            const snapshots = [
                createSnapshot('risk-1', 1),
                createSnapshot('risk-1', 2),
                createSnapshot('risk-1', 3),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'days', value: 30 }, baseTime)

            expect(result).toEqual(snapshots)
        })

        it('should sort snapshots by timestamp after filtering', () => {
            const snapshots = [
                createSnapshot('risk-1', 3),
                createSnapshot('risk-1', 1),
                createSnapshot('risk-1', 2),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'days', value: 30 }, baseTime)

            expect(result).toHaveLength(3)
            for (let i = 0; i < result.length - 1; i += 1) {
                expect(result[i].timestamp).toBeLessThanOrEqual(result[i + 1].timestamp)
            }
        })
    })

    describe('count retention mode', () => {
        it('should keep only the last N snapshots per risk', () => {
            const snapshots = [
                createSnapshot('risk-1', 10),
                createSnapshot('risk-1', 5),
                createSnapshot('risk-1', 2),
                createSnapshot('risk-2', 8),
                createSnapshot('risk-2', 3),
                createSnapshot('risk-2', 1),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 2 }, baseTime)

            expect(result).toHaveLength(4) // 2 per risk
            const risk1Snapshots = result.filter((s) => s.riskId === 'risk-1')
            const risk2Snapshots = result.filter((s) => s.riskId === 'risk-2')

            expect(risk1Snapshots).toHaveLength(2)
            expect(risk2Snapshots).toHaveLength(2)

            // Should keep the most recent snapshots
            expect(risk1Snapshots[0].timestamp).toBe(baseTime - 5 * 24 * 60 * 60 * 1000)
            expect(risk1Snapshots[1].timestamp).toBe(baseTime - 2 * 24 * 60 * 60 * 1000)
        })

        it('should handle individual risk with fewer snapshots than limit', () => {
            const snapshots = [
                createSnapshot('risk-1', 3),
                createSnapshot('risk-1', 2),
                createSnapshot('risk-2', 5),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 5 }, baseTime)

            expect(result).toEqual(snapshots)
        })

        it('should handle edge case with value=1', () => {
            const snapshots = [
                createSnapshot('risk-1', 10),
                createSnapshot('risk-1', 5),
                createSnapshot('risk-1', 1),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 1 }, baseTime)

            expect(result).toHaveLength(1)
            expect(result[0].timestamp).toBe(baseTime - 1 * 24 * 60 * 60 * 1000)
        })

        it('should maintain sorted order per risk in count mode', () => {
            const snapshots = [
                createSnapshot('risk-1', 10),
                createSnapshot('risk-1', 1),
                createSnapshot('risk-1', 5),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 2 }, baseTime)

            expect(result).toHaveLength(2)
            expect(result[0].timestamp).toBe(baseTime - 5 * 24 * 60 * 60 * 1000)
            expect(result[1].timestamp).toBe(baseTime - 1 * 24 * 60 * 60 * 1000)
        })
    })

    describe('edge cases and validation', () => {
        it('should return empty array for empty snapshot list', () => {
            const result = applySnapshotRetention([], { mode: 'days', value: 30 }, baseTime)
            expect(result).toEqual([])
        })

        it('should clamp days value to valid range', () => {
            const snapshots = [
                createSnapshot('risk-1', 20000),
                createSnapshot('risk-1', 1),
            ]

            // Value > 10000 should be clamped to 10000
            const result = applySnapshotRetention(snapshots, { mode: 'days', value: 50000 }, baseTime)

            expect(result.length).toBeGreaterThan(0)
        })

        it('should clamp count value to valid range', () => {
            const snapshots = [
                createSnapshot('risk-1', 1),
                createSnapshot('risk-1', 2),
            ]

            // Value > 10000 should be clamped to 10000
            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 50000 }, baseTime)

            expect(result).toHaveLength(2)
        })

        it('should handle multiple risks with varying snapshot counts', () => {
            const snapshots = [
                // risk-1: 5 snapshots
                createSnapshot('risk-1', 10),
                createSnapshot('risk-1', 8),
                createSnapshot('risk-1', 5),
                createSnapshot('risk-1', 2),
                createSnapshot('risk-1', 1),
                // risk-2: 2 snapshots
                createSnapshot('risk-2', 10),
                createSnapshot('risk-2', 3),
                // risk-3: 3 snapshots
                createSnapshot('risk-3', 15),
                createSnapshot('risk-3', 7),
                createSnapshot('risk-3', 2),
            ]

            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 3 }, baseTime)

            expect(result).toHaveLength(8) // 3 + 2 + 3
            expect(result.filter((s) => s.riskId === 'risk-1')).toHaveLength(3)
            expect(result.filter((s) => s.riskId === 'risk-2')).toHaveLength(2)
            expect(result.filter((s) => s.riskId === 'risk-3')).toHaveLength(3)
        })
    })

    describe('performance with large datasets', () => {
        it('should handle ~1000 risks with bounded retention efficiently', () => {
            const snapshots: RiskScoreSnapshot[] = []
            const riskCount = 1000
            const snapshotsPerRisk = 100

            for (let i = 0; i < riskCount; i += 1) {
                for (let j = 0; j < snapshotsPerRisk; j += 1) {
                    snapshots.push(
                        createSnapshot(`risk-${i}`, Math.floor(j / 10), {
                            probability: Math.min(5, Math.max(1, Math.floor(Math.random() * 5) + 1)),
                            impact: Math.min(5, Math.max(1, Math.floor(Math.random() * 5) + 1)),
                        }),
                    )
                }
            }

            const startTime = performance.now()
            const result = applySnapshotRetention(snapshots, { mode: 'count', value: 10 }, baseTime)
            const duration = performance.now() - startTime

            // Each risk should have at most 10 snapshots
            expect(result.length).toBeLessThanOrEqual(riskCount * 10)

            // Should complete in reasonable time (< 100ms for JS performance)
            expect(duration).toBeLessThan(100)
        })
    })
})
