import type { Risk } from '../../types/risk'
import { Button, Badge } from '../../design-system'
import { cn } from '../../utils/cn'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

interface RiskCardProps {
  risk: Risk
  onEdit: (risk: Risk) => void
  onDelete: (id: string) => void
  onView?: (risk: Risk) => void
}

export const RiskCard = ({ risk, onEdit, onDelete, onView }: RiskCardProps) => {
  // Risk score color coding implementation based on risk score value
  const getRiskSeverityTone = (score: number) => {
    if (score <= 3) return 'success' // Low
    if (score <= 6) return 'warning' // Medium
    return 'danger' // High
  }

  const severityTone = getRiskSeverityTone(risk.riskScore)

  return (
    <div
      className={cn(
        'rounded-2xl border border-border-subtle bg-surface-primary hover:shadow-card-soft transition-shadow overflow-hidden group',
        'flex h-full flex-col p-6'
      )}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-text-high group-hover:text-brand-primary transition-colors">
            {risk.title}
          </h3>
          <Badge
            tone={severityTone}
            subtle={false}
            className="text-sm font-semibold px-3 py-1 rounded-full border"
          >
            {risk.riskScore}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-text-low line-clamp-2">{risk.description}</p>
      </div>

      <div className="mt-auto space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3 border-t border-border-faint pt-4">
          <Badge tone="neutral" className="text-xs font-medium px-2 py-1 rounded-lg">
            {risk.category}
          </Badge>
          <span className="text-xs text-text-low">
            {dateFormatter.format(new Date(risk.lastModified))}
          </span>
          <span className="ml-auto text-xs font-semibold capitalize text-text-low">
            {risk.status}
          </span>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-faint pt-4">
          {onView && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onView(risk)}>
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
      </div>
    </div>
  )
}
