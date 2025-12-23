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

const getSeverityTone = (score: number): BadgeTone => {
  if (score <= 3) return 'success'
  if (score <= 6) return 'warning'
  return 'danger'
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
        aria-label="Risk register table showing all risks with their details"
      >
        <TableHeader className="bg-surface-secondary/60">
          <TableRow role="row">
            <TableHead role="columnheader">Risk</TableHead>
            <TableHead role="columnheader">Category</TableHead>
            <TableHead role="columnheader" className="text-center">Likelihood</TableHead>
            <TableHead role="columnheader" className="text-center">Impact</TableHead>
            <TableHead role="columnheader" className="text-center">Score</TableHead>
            <TableHead role="columnheader">Owner</TableHead>
            <TableHead role="columnheader">Due</TableHead>
            <TableHead role="columnheader">Next review</TableHead>
            <TableHead role="columnheader">Response</TableHead>
            <TableHead role="columnheader" className="text-center">Evidence</TableHead>
            <TableHead role="columnheader">Status</TableHead>
            <TableHead role="columnheader">Last updated</TableHead>
            <TableHead role="columnheader" className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow key={risk.id} role="row">
              <TableCell className="max-w-[240px]" role="cell">
                <p className="font-semibold text-text-high">{risk.title}</p>
                <p className="line-clamp-2 text-sm text-text-low">{risk.description}</p>
              </TableCell>
              <TableCell role="cell">
                <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs font-semibold" aria-label={`Category: ${risk.category}`}>
                  {risk.category}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-semibold text-text-high" role="cell">
                {risk.probability}
              </TableCell>
              <TableCell className="text-center font-semibold text-text-high" role="cell">
                {risk.impact}
              </TableCell>
              <TableCell className="text-center" role="cell">
                <Badge
                  tone={getSeverityTone(risk.riskScore)}
                  subtle={false}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  aria-label={`Risk score: ${risk.riskScore}, ${getSeverityTone(risk.riskScore)} severity`}
                >
                  {risk.riskScore}
                </Badge>
              </TableCell>
              <TableCell role="cell">
                <span className="text-sm text-text-high">{risk.owner || '—'}</span>
                {risk.ownerTeam ? (
                  <p className="text-xs text-text-low">{risk.ownerTeam}</p>
                ) : null}
              </TableCell>
              <TableCell role="cell" aria-label={`Due date: ${formatMaybeDate(risk.dueDate)}`}>
                {formatMaybeDate(risk.dueDate)}
              </TableCell>
              <TableCell role="cell" aria-label={`Next review: ${formatMaybeDate(risk.reviewDate)}`}>
                <span>{formatMaybeDate(risk.reviewDate)}</span>
                {risk.reviewCadence ? (
                  <span className="ml-1 text-xs text-text-low">({risk.reviewCadence})</span>
                ) : null}
              </TableCell>
              <TableCell role="cell" aria-label={`Response: ${risk.riskResponse}`}>
                <span className="capitalize">{risk.riskResponse}</span>
              </TableCell>
              <TableCell className="text-center" role="cell" aria-label={`Evidence count: ${risk.evidence.length}`}>
                <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs font-semibold">
                  {risk.evidence.length}
                </Badge>
              </TableCell>
              <TableCell role="cell" aria-label={`Status: ${risk.status}`}>
                <span className="capitalize">{risk.status}</span>
              </TableCell>
              <TableCell role="cell" aria-label={`Last updated: ${dateFormatter.format(new Date(risk.lastModified))}`}>
                {dateFormatter.format(new Date(risk.lastModified))}
              </TableCell>
              <TableCell className="text-right" role="cell">
                <div className="flex flex-wrap justify-end gap-2" role="group" aria-label={`Actions for risk ${risk.title}`}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => (onView ? onView(risk) : onEdit(risk))}
                    aria-label={`View or edit risk: ${risk.title}`}
                  >
                    View/Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(risk.id)}
                    aria-label={`Delete risk: ${risk.title}`}
                  >
                    Delete
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
