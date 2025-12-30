import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge, Button } from '../../design-system'
import type { WorkspaceRole } from '../../stores/authStore'
import { useAuthStore } from '../../stores/authStore'
import type { ApiError } from '../../services/apiClient'
import type { AuditEvent } from '../../services/auditService'
import { listRiskActivity } from '../../services/auditService'
import { downloadJsonFile } from '../../utils/download'

type RiskActivityLogPanelProps = {
  riskId: string | null
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function formatMaybeDateTime(value?: string) {
  if (!value) return '-'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return '-'
  return dateTimeFormatter.format(new Date(parsed))
}

function titleCase(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function friendlyEventType(type: string) {
  switch (type) {
    case 'risk.created':
      return 'Risk created'
    case 'risk.updated':
      return 'Risk updated'
    case 'risk.deleted':
      return 'Risk deleted'
    case 'checklist_item.completed':
      return 'Checklist item completed'
    case 'checklist_item.uncompleted':
      return 'Checklist item marked not completed'
    default:
      return type
  }
}

function isExportRole(role: WorkspaceRole | null) {
  return role === 'owner' || role === 'admin'
}

function isViewRole(role: WorkspaceRole | null) {
  return role === 'owner' || role === 'admin' || role === 'member'
}

function shortUserId(value: string) {
  const trimmed = value.trim()
  if (trimmed.length <= 10) return trimmed
  return `${trimmed.slice(0, 8)}…`
}

function summarizeEvent(event: AuditEvent) {
  if (event.type === 'risk.updated') {
    const updatedFields = Array.isArray((event.payload as any)?.updatedFields)
      ? (event.payload as any).updatedFields.filter((v: unknown) => typeof v === 'string')
      : []
    if (updatedFields.length) return `Updated: ${updatedFields.join(', ')}`
  }

  if (event.type === 'checklist_item.completed' || event.type === 'checklist_item.uncompleted') {
    const checklistStatus = typeof (event.payload as any)?.checklistStatus === 'string' ? (event.payload as any).checklistStatus : null
    if (checklistStatus) return `Checklist status: ${checklistStatus.replace('_', ' ')}`
  }

  return null
}

export function RiskActivityLogPanel({ riskId }: RiskActivityLogPanelProps) {
  const workspaceRole = useAuthStore((s) => s.workspaceRole)
  const authStatus = useAuthStore((s) => s.status)

  const [items, setItems] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 100

  const canView = isViewRole(workspaceRole)
  const canExport = isExportRole(workspaceRole)

  const refresh = useCallback(async () => {
    if (authStatus !== 'authenticated') return
    if (!riskId) return
    if (!canView) return

    setLoading(true)
    setError(null)
    setOffset(0)

    try {
      const next = await listRiskActivity(riskId, { limit, offset: 0 })
      setItems(next)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr?.status === 403) {
        setItems([])
        setError('You do not have access to the audit trail in this workspace.')
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load activity log.')
      }
    } finally {
      setLoading(false)
    }
  }, [authStatus, canView, riskId])

  const loadMore = useCallback(async () => {
    if (authStatus !== 'authenticated') return
    if (!riskId) return
    if (!canView) return

    const nextOffset = offset + limit
    setLoading(true)
    setError(null)
    try {
      const next = await listRiskActivity(riskId, { limit, offset: nextOffset })
      setItems((prev) => [...prev, ...next])
      setOffset(nextOffset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load more activity.')
    } finally {
      setLoading(false)
    }
  }, [authStatus, canView, limit, offset, riskId])

  useEffect(() => {
    setItems([])
    setError(null)
    setOffset(0)
  }, [riskId])

  useEffect(() => {
    if (!riskId) return
    if (authStatus !== 'authenticated') return
    if (!canView) return
    void refresh()
  }, [authStatus, canView, refresh, riskId])

  const exportPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      riskId,
      workspaceRole,
      items,
    }),
    [items, riskId, workspaceRole],
  )

  if (!riskId) {
    return <p className="text-sm text-text-low">Save the risk first to view the audit trail.</p>
  }

  if (authStatus !== 'authenticated') {
    return <p className="text-sm text-text-low">Sign in to view the audit trail.</p>
  }

  if (!canView) {
    return <p className="text-sm text-text-low">Audit trail is not available for Viewer roles.</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-high">Activity log</p>
          <p className="mt-1 text-xs text-text-low">Append-only. Retained for at least 90 days (baseline).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canExport || items.length === 0}
            onClick={() => {
              if (!canExport) return
              const safeRiskId = riskId || 'risk'
              downloadJsonFile(`risk-${safeRiskId}-activity.json`, exportPayload)
            }}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {!canExport ? (
        <p className="text-xs text-text-low">Export is restricted to Owner/Admin.</p>
      ) : null}

      {error ? <p className="text-sm text-status-danger">{error}</p> : null}

      {loading && items.length === 0 ? <p className="text-sm text-text-low">Loading activity…</p> : null}

      {!loading && !error && items.length === 0 ? <p className="text-sm text-text-low">No activity recorded yet.</p> : null}

      {items.length ? (
        <ul className="space-y-2" aria-label="Audit events">
          {items.map((event) => {
            const summary = summarizeEvent(event)
            return (
              <li key={event.id} className="rounded-2xl border border-border-faint bg-surface-primary/40 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-high">{friendlyEventType(event.type)}</p>
                    <p className="mt-1 text-xs text-text-low">
                      {formatMaybeDateTime(event.occurredAt)} · {titleCase(event.actorRole)} · {shortUserId(event.actorUserId)}
                    </p>
                    {summary ? <p className="mt-1 text-xs text-text-low">{summary}</p> : null}
                  </div>
                  <Badge tone="neutral">{event.type}</Badge>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {items.length >= limit ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="ghost" onClick={() => void loadMore()} disabled={loading}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  )
}

