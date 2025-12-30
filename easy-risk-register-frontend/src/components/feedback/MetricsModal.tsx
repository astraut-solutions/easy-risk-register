import { useMemo, useState } from 'react'

import { Button, Modal } from '../../design-system'
import {
  clearAnalyticsEvents,
  getAnalyticsEvents,
  getAnalyticsSummary,
  setAnalyticsEnabled,
} from '../../utils/analytics'

type MetricsModalProps = {
  isOpen: boolean
  onClose: () => void
}

const FEEDBACK_TEMPLATE = `Stakeholder feedback (Risk workspace)

1) Executive scanability
- Can you find the top risks in <10 seconds?
- Is the “severity” signal clear and trustworthy?

2) Risk owner usability
- Can you create a new risk quickly without confusion?
- Did anything feel hidden or overly verbose?

3) Friction points
- Where did you hesitate?
- What information did you need but couldn’t find?
`

export const MetricsModal = ({ isOpen, onClose }: MetricsModalProps) => {
  const [copied, setCopied] = useState(false)

  const payload = useMemo(() => {
    if (!isOpen) {
      return {
        summary: {
          totalEvents: 0,
          sessions: 0,
          sessionsWithCreatedRisk: 0,
          firstSessionCompletionRate: null,
          createdRisks: 0,
          updatedRisks: 0,
          deletedRisks: 0,
          templateApplies: 0,
          templateAdoptionRate: null,
          exportsCsv: 0,
          exportsPdf: 0,
          exportsPng: 0,
          submits: 0,
          abandons: 0,
          medianTimeToCreateMs: null,
          medianTimeToAbandonMs: null,
          medianTimeToFirstRiskMs: null,
          medianValidationErrorsPerAttempt: null,
        },
        events: [],
      }
    }
    const summary = getAnalyticsSummary()
    const events = getAnalyticsEvents()
    return { summary, events }
  }, [isOpen])

  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleCopyFeedback = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_TEMPLATE)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Metrics & feedback"
      eyebrow="Release readiness"
      description="Opt-in analytics to compare baseline vs post-change and collect stakeholder feedback."
      size="lg"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4">
          <h4 className="text-sm font-semibold text-text-high">Summary</h4>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-text-low">Median time-to-create</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.medianTimeToCreateMs === null
                  ? '-'
                  : `${Math.round(payload.summary.medianTimeToCreateMs / 1000)}s`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Median time-to-abandon</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.medianTimeToAbandonMs === null
                  ? '-'
                  : `${Math.round(payload.summary.medianTimeToAbandonMs / 1000)}s`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Median time-to-first-risk</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.medianTimeToFirstRiskMs === null
                  ? '-'
                  : `${Math.round(payload.summary.medianTimeToFirstRiskMs / 1000)}s`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Median validation errors</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.medianValidationErrorsPerAttempt ?? '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Events captured</dt>
              <dd className="mt-1 text-sm text-text-high">{payload.summary.totalEvents}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Sessions with a created risk</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.sessions === 0
                  ? '-'
                  : `${payload.summary.sessionsWithCreatedRisk}/${payload.summary.sessions} (${payload.summary.firstSessionCompletionRate ?? 0}%)`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Template adoption</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.createdRisks === 0
                  ? '-'
                  : `${payload.summary.templateAdoptionRate ?? 0}% (${payload.summary.templateApplies} template applies)`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-text-low">Exports (CSV / PDF / PNG)</dt>
              <dd className="mt-1 text-sm text-text-high">
                {payload.summary.exportsCsv} / {payload.summary.exportsPdf} / {payload.summary.exportsPng}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4">
          <h4 className="text-sm font-semibold text-text-high">Export</h4>
          <p className="mt-2 text-sm text-text-low">
            Copy the JSON and paste into a ticket or spreadsheet for comparison.
          </p>
          <textarea
            className="mt-3 h-56 w-full rounded-xl border border-border-faint bg-surface-primary px-3 py-2 font-mono text-xs text-text-high"
            value={json}
            readOnly
            aria-label="Analytics export JSON"
          />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                clearAnalyticsEvents()
              }}
            >
              Clear
            </Button>
            <Button type="button" variant="secondary" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4">
          <h4 className="text-sm font-semibold text-text-high">Stakeholder feedback</h4>
          <p className="mt-2 text-sm text-text-low">
            Use a consistent prompt when collecting exec scanability + risk owner usability feedback.
          </p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border-faint bg-surface-primary px-3 py-2 text-xs text-text-high">
            {FEEDBACK_TEMPLATE}
          </pre>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleCopyFeedback}>
              {copied ? 'Copied' : 'Copy template'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setAnalyticsEnabled(false)
              clearAnalyticsEvents()
              onClose()
            }}
          >
            Disable analytics
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default MetricsModal

