import { motion } from 'framer-motion'

import type { RiskStats } from '../../types/risk'
import { Badge, StatCard } from '../../design-system'

interface RiskSummaryCardsProps {
  stats: RiskStats
}

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export const RiskSummaryCards = ({ stats }: RiskSummaryCardsProps) => {
  const accentMap = {
    brand: 'brand',
    high: 'danger',
    medium: 'warning',
    low: 'success',
  } as const

  const cards: Array<{
    label: string
    value: string | number
    description: string
    accent: keyof typeof accentMap
  }> = [
    {
      label: 'Total Risks',
      value: stats.total,
      description: 'All tracked risks across categories',
      accent: 'brand',
    },
    {
      label: 'High Severity',
      value: stats.bySeverity.high,
      description: 'Risks requiring immediate attention',
      accent: 'high',
    },
    {
      label: 'Open vs Mitigated',
      value: `${stats.byStatus.open}/${stats.byStatus.mitigated}`,
      description: 'Active vs mitigated risks',
      accent: 'medium',
    },
    {
      label: 'Average Score',
      value: stats.averageScore.toFixed(1),
      description: 'Mean probability x impact',
      accent: 'low',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="h-full"
          >
            <StatCard
              label={card.label}
              value={card.value}
              description={card.description}
              accent={accentMap[card.accent]}
              className="h-full"
            />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-text-low">
        <Badge tone="danger">High: {stats.bySeverity.high}</Badge>
        <Badge tone="warning">Medium: {stats.bySeverity.medium}</Badge>
        <Badge tone="success">Low: {stats.bySeverity.low}</Badge>
        <span className="ml-auto text-sm text-text-muted">
          Updated {formatter.format(new Date(stats.updatedAt))}
        </span>
      </div>
    </div>
  )
}
