import { Fragment, useCallback, useMemo, useRef, useState } from 'react'

import type { Risk, RiskSeverity } from '../../types/risk'
import { getRiskSeverity } from '../../utils/riskCalculations'
import { Badge } from '../../design-system'

interface RiskMatrixProps {
  risks: Risk[]
  onSelect?: (selection: { probability: number; impact: number; severity: RiskSeverity; riskIds: string[] }) => void
}

const probabilityScale = [5, 4, 3, 2, 1]
const impactScale = [1, 2, 3, 4, 5]
const GRID_COLS = impactScale.length

// Enhanced risk matrix with better color coding and interactivity
export const RiskMatrix = ({ risks, onSelect }: RiskMatrixProps) => {
  const [activeCellKey, setActiveCellKey] = useState<string | null>(null)
  const [focusedCellKey, setFocusedCellKey] = useState<string>(() => `${probabilityScale[0]}-${impactScale[0]}`)
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const cells = useMemo(
    () =>
      probabilityScale.map((probability) =>
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
      ),
    [risks],
  )

  const focusCell = useCallback(
    (key: string) => {
      const el = cellRefs.current[key]
      if (!el) return
      el.focus()
      setFocusedCellKey(key)
      setActiveCellKey(key)
    },
    [setFocusedCellKey],
  )

  const handleCellAction = useCallback(
    (cell: { probability: number; impact: number; severity: RiskSeverity | null; risks: Risk[] }) => {
      if (!cell.risks.length) return
      onSelect?.({
        probability: cell.probability,
        impact: cell.impact,
        severity: cell.severity ?? 'low',
        riskIds: cell.risks.map((risk) => risk.id),
      })
    },
    [onSelect],
  )

  const keyToPosition = useCallback((key: string) => {
    const [probabilityRaw, impactRaw] = key.split('-')
    const probability = Number(probabilityRaw)
    const impact = Number(impactRaw)
    const row = probabilityScale.indexOf(probability)
    const col = impactScale.indexOf(impact)
    return { row, col }
  }, [])

  const positionToKey = useCallback((row: number, col: number) => {
    const probability = probabilityScale[row]
    const impact = impactScale[col]
    return `${probability}-${impact}`
  }, [])

  // Get color based on risk severity
  const getCellColor = (severity: string | null) => {
    if (!severity) return 'bg-surface-secondary/80 border-border-faint'
    
    switch (severity) {
      case 'high':
        return 'bg-risk-high/10 border-status-danger/30 border-dashed'
      case 'medium':
        return 'bg-risk-medium/10 border-status-warning/30 border-solid'
      case 'low':
        return 'bg-risk-low/10 border-status-success/30 border-dotted'
      default:
        return 'bg-surface-secondary/80 border-border-faint'
    }
  }

  const activeCell = useMemo(() => {
    if (!activeCellKey) return null
    for (const row of cells) {
      const found = row.find((cell) => cell.key === activeCellKey)
      if (found) return found
    }
    return null
  }, [activeCellKey, cells])

  const activeCellSummary = useMemo(() => {
    if (!activeCell) return 'Hover or focus a cell to see details.'
    const count = activeCell.risks.length
    const severity = activeCell.severity ?? 'none'
    const accepted = activeCell.acceptedCount
    const nextReview = activeCell.nextReview ? new Date(activeCell.nextReview).toLocaleDateString() : null

    const parts = [
      `Likelihood ${activeCell.probability}/5, Impact ${activeCell.impact}/5`,
      `${count} risk${count === 1 ? '' : 's'}`,
      `severity: ${severity}`,
    ]

    if (accepted) parts.push(`${accepted} accepted`)
    if (nextReview) parts.push(`next review ${nextReview}`)

    return parts.join(' • ')
  }, [activeCell])

  return (
    <div className="rr-panel space-y-4 p-5" role="region" aria-labelledby="risk-matrix-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="risk-matrix-title" className="text-lg font-semibold text-text-high">Risk matrix</h3>
          <p className="text-xs text-text-low">Interactive visualization of risks by likelihood and impact</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-text-low" aria-label="Severity legend">
          <Badge tone="danger">High (H)</Badge>
          <Badge tone="warning">Medium (M)</Badge>
          <Badge tone="success">Low (L)</Badge>
          <span className="text-[11px] text-text-low">Cells also use border styles (dashed/solid/dotted).</span>
        </div>
      </div>

      <div
        className="rounded-2xl border border-border-faint bg-surface-secondary/30 px-3 py-2 text-xs text-text-low"
        role="status"
        aria-live="polite"
      >
        <span className="font-semibold text-text-high">Cell summary:</span> {activeCellSummary}
      </div>

      <div
        className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-2"
        role="grid"
        aria-label="Risk matrix grid showing risk distribution by likelihood and impact"
        aria-labelledby="risk-matrix-title"
        aria-rowcount={probabilityScale.length + 1}
        aria-colcount={impactScale.length + 1}
      >
        <div role="row" className="contents">
          <div
            className="text-center text-xs text-text-low font-semibold"
            role="columnheader"
            aria-label="Likelihood and impact axes"
          />
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
        </div>

        {cells.map((row, rowIndex) => (
          <Fragment key={`prob-row-${probabilityScale[rowIndex]}`}>
            <div role="row" className="contents">
            <div
              className="flex items-center justify-center text-xs text-text-low font-semibold"
              role="rowheader"
              aria-label={`Likelihood level ${probabilityScale[rowIndex]}`}
            >
              Likelihood {probabilityScale[rowIndex]}
            </div>
            {row.map((cell) => (
              <button
                key={cell.key}
                type="button"
                ref={(el) => {
                  cellRefs.current[cell.key] = el
                }}
                tabIndex={focusedCellKey === cell.key ? 0 : -1}
                onClick={() => handleCellAction(cell)}
                onMouseEnter={() => setActiveCellKey(cell.key)}
                onMouseLeave={() => setActiveCellKey((current) => (current === cell.key ? null : current))}
                onFocus={() => {
                  setActiveCellKey(cell.key)
                  setFocusedCellKey(cell.key)
                }}
                onKeyDown={(event) => {
                  const { key } = event
                  if (key === 'Enter' || key === ' ') {
                    handleCellAction(cell)
                    return
                  }

                  if (
                    key !== 'ArrowLeft' &&
                    key !== 'ArrowRight' &&
                    key !== 'ArrowUp' &&
                    key !== 'ArrowDown' &&
                    key !== 'Home' &&
                    key !== 'End' &&
                    key !== 'PageUp' &&
                    key !== 'PageDown'
                  ) {
                    return
                  }

                  event.preventDefault()
                  const { row, col } = keyToPosition(cell.key)
                  if (row < 0 || col < 0) return

                  const next = { row, col }
                  if (key === 'ArrowLeft') next.col = Math.max(0, col - 1)
                  if (key === 'ArrowRight') next.col = Math.min(GRID_COLS - 1, col + 1)
                  if (key === 'ArrowUp') next.row = Math.max(0, row - 1)
                  if (key === 'ArrowDown') next.row = Math.min(probabilityScale.length - 1, row + 1)
                  if (key === 'Home') next.col = 0
                  if (key === 'End') next.col = GRID_COLS - 1
                  if (key === 'PageUp') next.row = 0
                  if (key === 'PageDown') next.row = probabilityScale.length - 1

                  focusCell(positionToKey(next.row, next.col))
                }}
                className={`min-h-[76px] rounded-xl border p-2 text-center text-text-high transition-all hover:shadow-md focus-visible:outline focus-visible:outline-brand-primary/30 ${getCellColor(cell.severity)} ${cell.risks.length ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
                role="gridcell"
                aria-label={`Risk cell: Likelihood ${cell.probability}, Impact ${cell.impact}, ${cell.risks.length} risk(s), ${cell.severity ? cell.severity : 'no'} severity${cell.acceptedCount ? `, ${cell.acceptedCount} accepted` : ''}${cell.nextReview ? `, next review ${new Date(cell.nextReview).toLocaleDateString()}` : ''}`}
                aria-describedby="risk-matrix-instructions"
                aria-disabled={!cell.risks.length}
              >
                <div className="text-xl font-bold">
                  {cell.risks.length ? cell.risks.length : '-'}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-text-low" aria-hidden="true">
                  {cell.severity === 'high' ? 'H' : cell.severity === 'medium' ? 'M' : cell.severity === 'low' ? 'L' : '-'}
                  {cell.severity ? ` • ${cell.severity}` : ' • none'}
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
            </div>
          </Fragment>
        ))}
      </div>

      <div id="risk-matrix-instructions" className="text-xs text-text-low text-center pt-2">
        Use Arrow keys to move between cells. Press Enter to drill down to the filtered list for a populated cell.
      </div>
    </div>
  )
}
