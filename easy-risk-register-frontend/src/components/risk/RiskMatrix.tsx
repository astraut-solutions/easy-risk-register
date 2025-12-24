import { Fragment } from 'react'

import type { Risk } from '../../types/risk'
import { getRiskSeverity } from '../../utils/riskCalculations'
import { Badge } from '../../design-system'

interface RiskMatrixProps {
  risks: Risk[]
  onSelect?: (riskIds: string[]) => void
}

const probabilityScale = [5, 4, 3, 2, 1]
const impactScale = [1, 2, 3, 4, 5]

// Enhanced risk matrix with better color coding and interactivity
export const RiskMatrix = ({ risks, onSelect }: RiskMatrixProps) => {
  const cells = probabilityScale.map((probability) =>
    impactScale.map((impact) => {
      const cellRisks = risks.filter(
        (risk) => risk.probability === probability && risk.impact === impact,
      )

      const acceptedCount = cellRisks.filter((risk) => risk.status === 'accepted').length
      const nextReview = cellRisks
        .map((risk) => (risk.reviewDate ? Date.parse(risk.reviewDate) : NaN))
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => a - b)[0]

      const severity =
        cellRisks.length > 0
          ? getRiskSeverity(cellRisks.reduce((max, risk) => Math.max(max, risk.riskScore), 0))
          : null

      return {
        key: `${probability}-${impact}`,
        probability,
        impact,
        risks: cellRisks,
        acceptedCount,
        nextReview: Number.isFinite(nextReview) ? nextReview : null,
        severity,
      }
    }),
  )

  // Get color based on risk severity
  const getCellColor = (severity: string | null) => {
    if (!severity) return 'bg-surface-secondary/80 border-border-faint'
    
    switch (severity) {
      case 'high':
        return 'bg-risk-high/10 border-status-danger/30'
      case 'medium':
        return 'bg-risk-medium/10 border-status-warning/30'
      case 'low':
        return 'bg-risk-low/10 border-status-success/30'
      default:
        return 'bg-surface-secondary/80 border-border-faint'
    }
  }

  return (
    <div className="rr-panel space-y-4 p-5" role="region" aria-labelledby="risk-matrix-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="risk-matrix-title" className="text-lg font-semibold text-text-high">Risk matrix</h3>
          <p className="text-xs text-text-low">Interactive visualization of risks by likelihood and impact</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-low">
          <Badge tone="danger">High</Badge>
          <Badge tone="warning">Medium</Badge>
          <Badge tone="success">Low</Badge>
        </div>
      </div>

      <div
        className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-2"
        role="grid"
        aria-label="Risk matrix grid showing risk distribution by likelihood and impact"
        aria-labelledby="risk-matrix-title"
      >
        <div role="gridcell" />
        {impactScale.map((impact) => (
          <div
            key={`impact-${impact}`}
            className="text-center text-xs text-text-low font-semibold"
            role="columnheader"
            aria-label={`Impact level ${impact}`}
          >
            Impact {impact}
          </div>
        ))}

        {cells.map((row, rowIndex) => (
          <Fragment key={`prob-row-${probabilityScale[rowIndex]}`}>
            <div
              className="flex items-center justify-center text-xs text-text-low font-semibold"
              role="rowheader"
              aria-label={`Likelihood level ${probabilityScale[rowIndex]}`}
            >
              Like {probabilityScale[rowIndex]}
            </div>
            {row.map((cell) => (
              <button
                key={cell.key}
                type="button"
                onClick={() => cell.risks.length && onSelect?.(cell.risks.map((risk) => risk.id))}
                className={`min-h-[72px] rounded-xl border p-2 text-center text-text-high transition-all hover:scale-105 hover:shadow-md focus-visible:outline focus-visible:outline-brand-primary/30 ${getCellColor(cell.severity)}`}
                role="gridcell"
                aria-label={`Risk cell: Likelihood ${cell.probability}, Impact ${cell.impact}, ${cell.risks.length} risk(s), ${cell.severity ? cell.severity : 'no'} severity${cell.acceptedCount ? `, ${cell.acceptedCount} accepted` : ''}${cell.nextReview ? `, next review ${new Date(cell.nextReview).toLocaleDateString()}` : ''}`}
                aria-describedby="risk-matrix-instructions"
                disabled={!cell.risks.length}
              >
                <div className="text-xl font-bold">
                  {cell.risks.length ? cell.risks.length : '-'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-text-low">
                  {cell.severity ? cell.severity : 'none'}
                </div>
                {cell.acceptedCount ? (
                  <div className="mt-1 text-[10px] text-text-low">{cell.acceptedCount} accepted</div>
                ) : null}
                {cell.nextReview ? (
                  <div className="mt-1 text-[10px] text-text-low">
                    Next review {new Date(cell.nextReview).toLocaleDateString()}
                  </div>
                ) : null}
              </button>
            ))}
          </Fragment>
        ))}
      </div>

      <div id="risk-matrix-instructions" className="text-xs text-text-low text-center pt-2">
        Click on any cell to filter risks by likelihood and impact level
      </div>
    </div>
  )
}
