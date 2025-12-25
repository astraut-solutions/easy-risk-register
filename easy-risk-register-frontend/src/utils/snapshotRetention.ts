import type { RiskScoreSnapshot, ScoreHistoryRetention } from '../types/visualization'

export const applySnapshotRetention = (
  snapshots: RiskScoreSnapshot[],
  retention: ScoreHistoryRetention,
  nowMs: number = Date.now(),
): RiskScoreSnapshot[] => {
  if (!snapshots.length) return snapshots

  if (retention.mode === 'days') {
    const days = Math.max(1, Math.min(Math.floor(retention.value), 10_000))
    const cutoff = nowMs - days * 24 * 60 * 60 * 1000
    return snapshots
      .filter((snapshot) => snapshot.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  const maxPerRisk = Math.max(1, Math.min(Math.floor(retention.value), 10_000))
  const grouped = new Map<string, RiskScoreSnapshot[]>()
  for (const snapshot of snapshots) {
    const bucket = grouped.get(snapshot.riskId)
    if (bucket) bucket.push(snapshot)
    else grouped.set(snapshot.riskId, [snapshot])
  }

  const trimmed: RiskScoreSnapshot[] = []
  for (const bucket of grouped.values()) {
    bucket.sort((a, b) => a.timestamp - b.timestamp)
    trimmed.push(...bucket.slice(-maxPerRisk))
  }

  trimmed.sort((a, b) => a.timestamp - b.timestamp)
  return trimmed
}

