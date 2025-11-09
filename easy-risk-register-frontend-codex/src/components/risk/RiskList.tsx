import type { Risk } from '../../types/risk'
import { getRiskSeverity } from '../../utils/riskCalculations'
import { riskSeverityPalette } from '../../stores/riskStore'
import { Button } from '../../design-system'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

interface RiskListProps {
  risks: Risk[]
  onEdit: (risk: Risk) => void
  onDelete: (id: string) => void
}

export const RiskList = ({ risks, onEdit, onDelete }: RiskListProps) => {
  if (!risks.length) {
    return (
      <div className="rr-panel p-12 text-center">
        <p className="text-lg font-semibold text-text-high">No risks yet</p>
        <p className="mt-2 text-sm text-text-low">
          Use the form on the left to add your first risk and start tracking mitigation plans.
        </p>
      </div>
    )
  }

  return (
    <div className="rr-panel overflow-hidden">
      <table className="w-full border-collapse text-sm text-text-mid">
        <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-text-low">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Score</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk) => {
            const severity = getRiskSeverity(risk.riskScore)
            return (
              <tr
                key={risk.id}
                className="border-t border-border-faint bg-surface-primary hover:bg-surface-secondary/60"
              >
                <td className="px-4 py-4">
                  <p className="font-semibold text-text-high">{risk.title}</p>
                  <p className="text-xs text-text-low">{risk.description}</p>
                </td>
                <td className="px-4 py-4">{risk.category}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${riskSeverityPalette[severity]}`}
                  >
                    {risk.riskScore}
                  </span>
                </td>
                <td className="px-4 py-4 capitalize">{risk.status}</td>
                <td className="px-4 py-4">
                  {dateFormatter.format(new Date(risk.lastModified))}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-2">
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
