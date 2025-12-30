import { useMemo, useState } from 'react'

import type { Risk } from '../../types/risk'
import { COMPLIANCE_CHECKLIST_TEMPLATES } from '../../constants/cyber'
import { Badge, Button, Modal } from '../../design-system'
import { RiskPlaybooksPanel } from './RiskPlaybooksPanel'

interface RiskDetailModalProps {
  risk: Risk | null
  isOpen: boolean
  onClose: () => void
  onEdit: (risk: Risk) => void
  onAttachChecklistTemplate: (riskId: string, templateId: string) => void | Promise<unknown>
  onToggleChecklistItem: (riskId: string, checklistId: string, itemId: string) => void | Promise<unknown>
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

const formatMaybeDate = (value?: string) => {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return '—'
  return dateFormatter.format(new Date(parsed))
}

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

export const RiskDetailModal = ({
  risk,
  isOpen,
  onClose,
  onEdit,
  onAttachChecklistTemplate,
  onToggleChecklistItem,
}: RiskDetailModalProps) => {
  const [selectedChecklistTemplateId, setSelectedChecklistTemplateId] = useState(
    () => COMPLIANCE_CHECKLIST_TEMPLATES[0]?.id ?? '',
  )

  const checklistTemplateOptions = useMemo(
    () =>
      COMPLIANCE_CHECKLIST_TEMPLATES.map((template) => ({
        id: template.id,
        title: template.title,
      })),
    [],
  )

  const checklistSummary = useMemo(() => {
    const items = (risk?.checklists ?? []).flatMap((checklist) => checklist.items ?? [])
    const completed = items.filter((item) => Boolean(item.completedAt)).length
    return { completed, total: items.length }
  }, [risk?.checklists])

  if (!risk) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Risk details"
      eyebrow="Risk workspace"
      description="Review the full record, including accountability, evidence, and mitigation tracking."
      size="lg"
    >
      <div className="space-y-5">
        <div className="rr-panel space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-text-high">{risk.title}</h3>
              <p className="mt-1 text-sm text-text-low">{risk.e2eeLocked ? 'Encrypted (locked)' : risk.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{risk.category}</Badge>
              <Badge tone="neutral" className="capitalize">
                {risk.status}
              </Badge>
              <Badge tone="neutral">{titleCase(risk.riskResponse)}</Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Owner</p>
              <p className="mt-1 text-sm text-text-low">{risk.owner || '—'}</p>
            </div>
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Due date</p>
              <p className="mt-1 text-sm text-text-low">{formatMaybeDate(risk.dueDate)}</p>
            </div>
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Next review</p>
              <p className="mt-1 text-sm text-text-low">
                {formatMaybeDate(risk.reviewDate)}
                {risk.reviewCadence ? ` • ${titleCase(risk.reviewCadence)}` : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Likelihood</p>
              <p className="mt-1 text-sm text-text-low">{risk.probability} / 5</p>
            </div>
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Impact</p>
              <p className="mt-1 text-sm text-text-low">{risk.impact} / 5</p>
            </div>
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Score</p>
              <p className="mt-1 text-sm text-text-low">{risk.riskScore}</p>
            </div>
          </div>
        </div>

        <div className="rr-panel space-y-3 p-4">
          <h4 className="text-sm font-semibold text-text-high">Responses</h4>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Owner response</p>
              <p className="mt-1 text-sm text-text-low whitespace-pre-wrap">
                {risk.ownerResponse || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Security advisor comment</p>
              <p className="mt-1 text-sm text-text-low whitespace-pre-wrap">
                {risk.securityAdvisorComment || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <p className="text-xs font-semibold text-text-high">Vendor response</p>
              <p className="mt-1 text-sm text-text-low whitespace-pre-wrap">
                {risk.vendorResponse || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rr-panel space-y-3 p-4">
          <h4 className="text-sm font-semibold text-text-high">Mitigation</h4>
          <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
            <p className="text-xs font-semibold text-text-high">Summary plan</p>
            <p className="mt-1 text-sm text-text-low whitespace-pre-wrap">
              {risk.e2eeLocked ? 'Encrypted (locked)' : risk.mitigationPlan || '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
            <p className="text-xs font-semibold text-text-high">Steps</p>
            {risk.mitigationSteps.length ? (
              <ul className="mt-2 space-y-2">
                {risk.mitigationSteps.map((step) => (
                  <li key={step.id} className="flex flex-wrap items-start gap-2 text-sm">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border-faint bg-surface-primary text-[10px] font-semibold text-text-low">
                      {step.status === 'done' ? '✓' : '•'}
                    </span>
                    <div className="flex-1">
                      <p className="text-text-high">{step.description}</p>
                      <p className="mt-0.5 text-xs text-text-low">
                        {step.owner ? `Owner: ${step.owner}` : 'Owner: —'}
                        {' • '}
                        {step.dueDate ? `Due: ${formatMaybeDate(step.dueDate)}` : 'Due: —'}
                      </p>
                    </div>
                    <Badge tone="neutral" className="capitalize">
                      {step.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-text-low">—</p>
            )}
          </div>
        </div>

        <div className="rr-panel space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-text-high">Compliance checklist</h4>
            <Badge tone="neutral" className="capitalize">
              {risk.checklistStatus.replace('_', ' ')}
            </Badge>
          </div>

          <p className="text-xs text-text-low">
            Track incident/compliance actions with timestamps (assistive guidance, not legal advice).
          </p>

          {risk.checklists.length ? (
            <div className="space-y-3">
              {risk.checklists.map((checklist) => {
                const total = checklist.items.length
                const done = checklist.items.filter((item) => Boolean(item.completedAt)).length
                return (
                  <div
                    key={checklist.id}
                    className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-text-high">{checklist.title}</p>
                        <p className="mt-0.5 text-xs text-text-low">
                          Progress: {done}/{total || 0}
                        </p>
                      </div>
                      <Badge tone="neutral">
                        {total && done === total ? 'Done' : done > 0 ? 'In progress' : 'Not started'}
                      </Badge>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {checklist.items.map((item) => (
                        <li key={item.id} className="flex items-start gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(item.completedAt)}
                            onChange={() =>
                              onToggleChecklistItem(risk.id, checklist.id, item.id)
                            }
                            className="mt-1 h-4 w-4"
                            aria-label={`Mark checklist item as ${item.completedAt ? 'not completed' : 'completed'}: ${item.description}`}
                          />
                          <div className="flex-1">
                            <p className="text-text-high">{item.description}</p>
                            {item.completedAt ? (
                              <p className="mt-0.5 text-xs text-text-low">
                                Completed {formatMaybeDate(item.completedAt)}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-low">No checklist attached yet.</p>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="space-y-1">
              <span className="block text-xs font-semibold text-text-low">Attach checklist</span>
              <select
                className="rr-select w-full"
                value={selectedChecklistTemplateId}
                onChange={(event) => setSelectedChecklistTemplateId(event.target.value)}
                aria-label="Select checklist template"
              >
                {checklistTemplateOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={
                !selectedChecklistTemplateId ||
                risk.checklists.some((checklist) => checklist.templateId === selectedChecklistTemplateId)
              }
              onClick={() => onAttachChecklistTemplate(risk.id, selectedChecklistTemplateId)}
              aria-label="Attach selected checklist template"
            >
              Attach
            </Button>
          </div>

          <p className="text-xs text-text-low" aria-live="polite">
            Overall progress: {checklistSummary.completed}/{checklistSummary.total || 0}
          </p>
        </div>

        <div className="rr-panel space-y-3 p-4">
          <h4 className="text-sm font-semibold text-text-high">Evidence</h4>
          {risk.evidence.length ? (
            <ul className="space-y-2">
              {risk.evidence.map((entry, index) => (
                <li
                  key={`${entry.url}-${entry.addedAt}-${index}`}
                  className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral" className="capitalize">
                        {entry.type}
                      </Badge>
                      <a
                        className="text-sm font-semibold text-brand-primary hover:underline break-all"
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {entry.url}
                      </a>
                    </div>
                    <span className="text-xs text-text-low">
                      Added {formatMaybeDate(entry.addedAt)}
                    </span>
                  </div>
                  {entry.description ? (
                    <p className="mt-2 text-sm text-text-low whitespace-pre-wrap">
                      {entry.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-low">—</p>
          )}
        </div>

        <RiskPlaybooksPanel riskId={risk.id} />

        <div className="rr-panel space-y-3 p-4">
          <h4 className="text-sm font-semibold text-text-high">Notes</h4>
          <p className="text-sm text-text-low whitespace-pre-wrap">{risk.notes || '-'}</p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => onEdit(risk)}>
            Edit
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default RiskDetailModal
