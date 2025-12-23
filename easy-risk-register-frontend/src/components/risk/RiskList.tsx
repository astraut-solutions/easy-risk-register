import type { Risk } from '../../types/risk'
import { RiskCard } from './RiskCard'

interface RiskListProps {
  risks: Risk[]
  onEdit: (risk: Risk) => void
  onDelete: (id: string) => void
  onView?: (risk: Risk) => void
  emptyState?: {
    title: string
    description: string
  }
}

export const RiskList = ({ risks, onEdit, onDelete, onView, emptyState }: RiskListProps) => {
  if (!risks.length) {
    const title =
      emptyState?.title ?? 'No risks yet'
    const description =
      emptyState?.description ??
      'Use the form on the left to add your first risk and start tracking mitigation plans.'

    return (
      <div className="rr-panel p-8 text-center">
        <p className="text-lg font-semibold text-text-high">{title}</p>
        <p className="mt-2 text-sm text-text-low">{description}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {risks.map((risk) => (
        <RiskCard
          key={risk.id}
          risk={risk}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  )
}
