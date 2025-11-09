import { Fragment } from 'react'

import type { Risk } from '../../types/risk'
import { getRiskSeverity } from '../../utils/riskCalculations'
import { riskSeverityPalette } from '../../stores/riskStore'
import { Badge } from '../../design-system'

interface RiskMatrixProps {
  risks: Risk[]
  onSelect?: (riskIds: string[]) => void
}

const probabilityScale = [5, 4, 3, 2, 1]
const impactScale = [1, 2, 3, 4, 5]

export const RiskMatrix = ({ risks, onSelect }: RiskMatrixProps) => {
  const cells = probabilityScale.map((probability) =>
    impactScale.map((impact) => {
      const cellRisks = risks.filter(
        (risk) => risk.probability === probability && risk.impact === impact,
      )
      const severity =
        cellRisks.length > 0
          ? getRiskSeverity(cellRisks[cellRisks.length - 1].riskScore)
          : null

      return {
        key: `${probability}-${impact}`,
        probability,
        impact,
        risks: cellRisks,
        severity,
      }
    }),
  )

  return (
    <div className="rr-panel space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-text-high">Risk matrix</h3>
          <p className="text-xs text-text-low">Hover for counts - Click to drill down</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-low">
          <Badge tone="danger">High</Badge>
          <Badge tone="warning">Medium</Badge>
          <Badge tone="success">Low</Badge>
        </div>
      </div>

      <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-2">
        <div />
        {impactScale.map((impact) => (
          <div key={`impact-${impact}`} className="text-center text-xs text-text-low">
            Impact {impact}
          </div>
        ))}

        {cells.map((row, rowIndex) => (
          <Fragment key={`prob-row-${probabilityScale[rowIndex]}`}>
            <div className="flex items-center justify-center text-xs text-text-low">
              Prob {probabilityScale[rowIndex]}
            </div>
            {row.map((cell) => (
              <button
                key={cell.key}
                type="button"
                onClick={() => cell.risks.length && onSelect?.(cell.risks.map((risk) => risk.id))}
                className={`min-h-[72px] rounded-xl border border-border-faint bg-surface-secondary/80 p-2 text-center text-text-high transition hover:border-brand-primary focus-visible:outline focus-visible:outline-brand-primary/30 ${
                  cell.severity ? riskSeverityPalette[cell.severity] : 'text-text-low'
                }`}
              >
                <div className="text-xl font-semibold">
                  {cell.risks.length ? cell.risks.length : '-'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-text-low">
                  {cell.severity ? cell.severity : 'empty'}
                </div>
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
