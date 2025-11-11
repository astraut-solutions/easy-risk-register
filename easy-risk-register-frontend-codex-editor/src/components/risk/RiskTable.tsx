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
      <div className="rr-panel p-12 text-center">
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
    <div className="rr-panel overflow-hidden p-0">
      <Table className="[&_th]:whitespace-nowrap">
        <TableHeader className="bg-surface-secondary/60">
          <TableRow>
            <TableHead>Risk</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Probability</TableHead>
            <TableHead className="text-center">Impact</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {risks.map((risk) => (
            <TableRow key={risk.id}>
              <TableCell className="max-w-[240px]">
                <p className="font-semibold text-text-high">{risk.title}</p>
                <p className="line-clamp-2 text-sm text-text-low">{risk.description}</p>
              </TableCell>
              <TableCell>
                <Badge tone="neutral" className="rounded-full px-3 py-1 text-xs font-semibold">
                  {risk.category}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-semibold text-text-high">
                {risk.probability}
              </TableCell>
              <TableCell className="text-center font-semibold text-text-high">
                {risk.impact}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  tone={getSeverityTone(risk.riskScore)}
                  subtle={false}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {risk.riskScore}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">{risk.status}</TableCell>
              <TableCell>{dateFormatter.format(new Date(risk.lastModified))}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {onView && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onView(risk)}
                    >
                      View
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(risk)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(risk.id)}
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
