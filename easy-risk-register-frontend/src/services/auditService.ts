import { apiGetJson } from './apiClient'

export type AuditActorRole = 'owner' | 'admin' | 'member' | 'viewer'

export type AuditEvent = {
  id: string
  riskId: string | null
  type: string
  occurredAt: string
  actorUserId: string
  actorRole: AuditActorRole
  payload: Record<string, unknown>
}

type ApiAuditEvent = {
  id: unknown
  riskId: unknown
  type: unknown
  occurredAt: unknown
  actorUserId: unknown
  actorRole: unknown
  payload: unknown
}

type ApiRiskActivityResponse = {
  items: unknown
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeActorRole(value: unknown): AuditActorRole | null {
  if (value === 'owner' || value === 'admin' || value === 'member' || value === 'viewer') return value
  return null
}

function normalizePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function mapApiAuditEvent(input: ApiAuditEvent): AuditEvent | null {
  const id = normalizeString(input.id)
  const type = normalizeString(input.type)
  const occurredAt = normalizeString(input.occurredAt)
  const actorUserId = normalizeString(input.actorUserId)
  const actorRole = normalizeActorRole(input.actorRole)

  if (!id || !type || !occurredAt || !actorUserId || !actorRole) return null

  return {
    id,
    riskId: normalizeString(input.riskId),
    type,
    occurredAt,
    actorUserId,
    actorRole,
    payload: normalizePayload(input.payload),
  }
}

export async function listRiskActivity(
  riskId: string,
  { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<AuditEvent[]> {
  const query = new URLSearchParams()
  query.set('limit', String(limit))
  query.set('offset', String(offset))

  const response = await apiGetJson<ApiRiskActivityResponse>(`/api/risks/${riskId}/activity?${query.toString()}`)
  const rawItems = (response as any)?.items
  if (!Array.isArray(rawItems)) return []

  return rawItems
    .map((row: unknown) => mapApiAuditEvent(row as ApiAuditEvent))
    .filter((row: AuditEvent | null): row is AuditEvent => Boolean(row))
}

