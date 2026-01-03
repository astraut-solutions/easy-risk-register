import type { Risk } from '../../types/risk'
import { useEffect, useState, useRef } from 'react'
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system'
import type { BadgeTone } from '../../design-system'
import { getRiskSeverity } from '../../utils/riskCalculations'

interface RiskTableProps {
  risks: Risk[]
  onEdit: (risk: Risk) => void
  onDelete: (id: string) => void
  onView?: (risk: Risk) => void
  emptyState?: {
    title: string
    description: string
  }
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatMaybeDate = (value?: string) => {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return '—'
  return dateFormatter.format(new Date(parsed))
}

const getSeverityTone = (risk: Risk): BadgeTone => {
  const severity = risk.severity ?? getRiskSeverity(risk.riskScore)
  return severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'success'
}

export const RiskTable = ({
  risks,
  onEdit,
  onDelete,
  onView,
  emptyState,
}: RiskTableProps) => {
  const [openActionsMenuForId, setOpenActionsMenuForId] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!openActionsMenuForId) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // If we clicked on the trigger for the SAME menu, let the individual click handler handle the toggle
      if (triggerRef.current?.contains(event.target as Node)) {
        return
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionsMenuForId(null)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenActionsMenuForId(null)
    }

    document.addEventListener('mousedown', handleClickOutside, { capture: true })
    document.addEventListener('touchstart', handleClickOutside, { capture: true })
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true })
      document.removeEventListener('touchstart', handleClickOutside, { capture: true })
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openActionsMenuForId])

  if (!risks.length) {
    return (
      <div className="rr-panel p-8 text-center">
        <p className="text-lg font-semibold text-text-high">
          {emptyState?.title ?? 'No risks available'}
        </p>
        <p className="mt-2 text-sm text-text-low">
          {emptyState?.description ??
            'Use the New risk button to start capturing risks in this workspace.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rr-panel overflow-visible p-0" role="region" aria-labelledby="risk-table-title">
      <h3 id="risk-table-title" className="sr-only">Risk Table</h3>
      <Table
        className="[&_th]:whitespace-normal"
        role="table"
        aria-label="Risk register table showing key risk details"
      >
        <TableHeader className="bg-surface-secondary/60">
          <TableRow role="row">
            <TableHead role="columnheader" scope="col">Risk</TableHead>
            <TableHead role="columnheader" scope="col" className="w-[140px]">Category</TableHead>
            <TableHead role="columnheader" scope="col" className="text-center w-[100px]">Score</TableHead>
            <TableHead role="columnheader" scope="col" className="w-[120px]">Owner</TableHead>
            <TableHead role="columnheader" scope="col" className="w-[100px]">Due</TableHead>
            <TableHead role="columnheader" scope="col" className="w-[100px]">Status</TableHead>
            <TableHead role="columnheader" scope="col" className="w-[120px]">Last updated</TableHead>
            <TableHead role="columnheader" scope="col" className="text-center w-[70px] px-2">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow key={risk.id} role="row">
              <TableCell className="max-w-[280px]" role="cell">
                {onView ? (
                  <button
                    type="button"
                    onClick={() => onView(risk)}
                    className="text-left font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary rounded-md"
                    aria-label={`Open risk details: ${risk.title}`}
                  >
                    {risk.title}
                  </button>
                ) : (
                  <p className="font-semibold text-text-high">{risk.title}</p>
                )}
                <p className="line-clamp-2 text-sm text-text-low">
                  {risk.e2eeLocked ? 'Encrypted (locked)' : risk.description}
                </p>
              </TableCell>
              <TableCell className="w-[140px]" role="cell">
                <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs font-semibold" aria-label={`Category: ${risk.category}`}>
                  {risk.category}
                </Badge>
              </TableCell>
              <TableCell className="text-center w-[100px]" role="cell">
                <Badge
                  tone={getSeverityTone(risk)}
                  subtle={false}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  aria-label={`Risk score: ${risk.riskScore}, ${(risk.severity ?? getRiskSeverity(risk.riskScore))} severity`}
                >
                  {risk.riskScore}
                </Badge>
                <p className="mt-1 text-[11px] font-semibold text-text-muted" aria-hidden="true">
                  {risk.probability}×{risk.impact} · {(risk.severity ?? getRiskSeverity(risk.riskScore)).toUpperCase()}
                </p>
              </TableCell>
              <TableCell className="w-[120px]" role="cell">
                <span className="text-sm text-text-high">{risk.owner || '-'}</span>
                {risk.ownerTeam ? (
                  <p className="text-xs text-text-low">{risk.ownerTeam}</p>
                ) : null}
              </TableCell>
              <TableCell className="w-[100px]" role="cell" aria-label={`Due date: ${formatMaybeDate(risk.dueDate)}`}>
                {formatMaybeDate(risk.dueDate)}
              </TableCell>
              <TableCell className="w-[100px]" role="cell" aria-label={`Status: ${risk.status}`}>
                <span className="capitalize">{risk.status}</span>
              </TableCell>
              <TableCell className="w-[120px]" role="cell" aria-label={`Last updated: ${dateFormatter.format(new Date(risk.lastModified))}`}>
                {dateFormatter.format(new Date(risk.lastModified))}
              </TableCell>
              <TableCell className="text-center w-[70px] px-2" role="cell">
                <div
                  className="relative flex items-center justify-center gap-2"
                  role="group"
                  aria-label={`Actions for risk ${risk.title}`}
                >
                  <Button
                    ref={openActionsMenuForId === risk.id ? triggerRef : undefined}
                    id={`risk-actions-trigger-${risk.id}`}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setOpenActionsMenuForId((current) => (current === risk.id ? null : risk.id))
                    }
                    aria-label={`More actions for risk: ${risk.title}`}
                    aria-haspopup="menu"
                    aria-expanded={openActionsMenuForId === risk.id}
                    aria-controls={`risk-actions-menu-${risk.id}`}
                    className={`h-9 w-9 p-0 text-text-high ${openActionsMenuForId === risk.id ? 'ring-2 ring-brand-primary/30' : ''
                      }`}
                  >
                    <span className="sr-only">More</span>
                    <svg
                      className="h-5 w-5 text-text-high"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path d="M4.5 10h0.01" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 10h0.01" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15.5 10h0.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>

                  {openActionsMenuForId === risk.id ? (
                    <div
                      ref={menuRef}
                      id={`risk-actions-menu-${risk.id}`}
                      role="menu"
                      aria-label={`More actions for risk ${risk.title}`}
                      className="absolute right-0 bottom-full z-50 mb-2 w-32 overflow-hidden rounded-2xl border border-border-faint bg-surface-primary shadow-[0_18px_35px_rgba(15,23,42,0.15)]"
                    >
                      {onView ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-high hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20"
                          onClick={() => {
                            setOpenActionsMenuForId(null)
                            onView(risk)
                          }}
                        >
                          View
                        </button>
                      ) : null}
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text-high hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20"
                        onClick={() => {
                          setOpenActionsMenuForId(null)
                          onEdit(risk)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-status-danger hover:bg-status-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-danger/25"
                        onClick={() => {
                          setOpenActionsMenuForId(null)
                          onDelete(risk.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default RiskTable
