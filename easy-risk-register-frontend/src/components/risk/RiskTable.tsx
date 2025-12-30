import type { Risk } from '../../types/risk'
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
    <div className="rr-panel overflow-x-auto p-0" role="region" aria-labelledby="risk-table-title">
      <h3 id="risk-table-title" className="sr-only">Risk Table</h3>
      <Table
        className="[&_th]:whitespace-nowrap"
        role="table"
        aria-label="Risk register table showing key risk details"
      >
        <TableHeader className="bg-surface-secondary/60">
          <TableRow role="row">
            <TableHead role="columnheader">Risk</TableHead>
            <TableHead role="columnheader">Category</TableHead>
            <TableHead role="columnheader" className="text-center">Score</TableHead>
            <TableHead role="columnheader">Owner</TableHead>
            <TableHead role="columnheader">Due</TableHead>
            <TableHead role="columnheader">Status</TableHead>
            <TableHead role="columnheader">Last updated</TableHead>
            <TableHead role="columnheader" className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
              <TableRow key={risk.id} role="row">
              <TableCell className="max-w-[320px]" role="cell">
                {onView ? (
                  <button
                    type="button"
                    onClick={() => onView(risk)}
                    className="text-left font-semibold text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary rounded-md"
                    aria-label={`Edit risk: ${risk.title}`}
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
              <TableCell role="cell">
                <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs font-semibold" aria-label={`Category: ${risk.category}`}>
                  {risk.category}
                </Badge>
              </TableCell>
              <TableCell className="text-center" role="cell">
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
              <TableCell role="cell">
                <span className="text-sm text-text-high">{risk.owner || '-'}</span>
                {risk.ownerTeam ? (
                  <p className="text-xs text-text-low">{risk.ownerTeam}</p>
                ) : null}
              </TableCell>
              <TableCell role="cell" aria-label={`Due date: ${formatMaybeDate(risk.dueDate)}`}>
                {formatMaybeDate(risk.dueDate)}
              </TableCell>
              <TableCell role="cell" aria-label={`Status: ${risk.status}`}>
                <span className="capitalize">{risk.status}</span>
              </TableCell>
              <TableCell role="cell" aria-label={`Last updated: ${dateFormatter.format(new Date(risk.lastModified))}`}>
                {dateFormatter.format(new Date(risk.lastModified))}
              </TableCell>
              <TableCell className="text-center" role="cell">
                <div className="flex items-center justify-center gap-2" role="group" aria-label={`Actions for risk ${risk.title}`}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(risk)}
                    aria-label={`View or edit risk: ${risk.title}`}
                    className="h-9 w-9 p-0"
                  >
                    <span className="sr-only">View/Edit</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path
                        d="M12.5 3.5l4 4L7 17H3v-4L12.5 3.5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(risk.id)}
                    aria-label={`Delete risk: ${risk.title}`}
                    className="h-9 w-9 p-0"
                  >
                    <span className="sr-only">Delete</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    >
                      <path d="M4.5 6.5h11" strokeLinecap="round" />
                      <path d="M8 6.5v-2h4v2" strokeLinecap="round" strokeLinejoin="round" />
                      <path
                        d="M6.5 6.5l.7 10h5.6l.7-10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M8.5 9v5" strokeLinecap="round" />
                      <path d="M11.5 9v5" strokeLinecap="round" />
                    </svg>
                  </Button>
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
