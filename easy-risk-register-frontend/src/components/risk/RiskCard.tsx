import type { Risk } from '../../types/risk'
import { Button, Badge } from '../../design-system'
import { cn } from '../../utils/cn'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

const formatMaybeDate = (value?: string) => {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return '—'
  return dateFormatter.format(new Date(parsed))
}

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
      role="article"
      aria-label={`Risk card: ${risk.title}`}
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
            aria-label={`Risk score: ${risk.riskScore}, ${getRiskSeverityTone(risk.riskScore)} severity`}
            data-testid="risk-score-badge"
          >
            {risk.riskScore}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-text-low line-clamp-2">{risk.description}</p>
      </div>

      <div className="mt-auto space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3 border-t border-border-faint pt-4">
          <Badge
            tone="neutral"
            className="text-xs font-medium px-2 py-1 rounded-lg"
            aria-label={`Category: ${risk.category}`}
            data-testid="risk-category-badge"
          >
            {risk.category}
          </Badge>
          <Badge
            tone="neutral"
            className="text-xs font-medium px-2 py-1 rounded-lg capitalize"
            aria-label={`Response: ${risk.riskResponse}`}
          >
            {risk.riskResponse}
          </Badge>
          <Badge
            tone="neutral"
            className="text-xs font-medium px-2 py-1 rounded-lg"
            aria-label={`Evidence count: ${risk.evidence.length}`}
          >
            Evidence {risk.evidence.length}
          </Badge>
          <span className="text-xs text-text-low" aria-label={`Last modified: ${dateFormatter.format(new Date(risk.lastModified))}`}>
            {dateFormatter.format(new Date(risk.lastModified))}
          </span>
          <span className="ml-auto text-xs font-semibold capitalize text-text-low" aria-label={`Status: ${risk.status}`}>
            {risk.status}
          </span>
        </div>

        <div className="grid gap-2 rounded-2xl border border-border-faint bg-surface-secondary/10 p-3 text-xs text-text-low">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-high">Owner</span>
            <span className="text-text-low">{risk.owner || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-high">Due</span>
            <span className="text-text-low">{formatMaybeDate(risk.dueDate)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-text-high">Next review</span>
            <span className="text-text-low">{formatMaybeDate(risk.reviewDate)}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border-faint pt-4">
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
      </div>
    </div>
  )
}
