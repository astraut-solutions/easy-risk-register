import { useMemo, useState } from 'react'

import { Button, Input, Modal } from '../../design-system'
import type { CyberRiskTemplate } from '../../constants/cyber'
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations'
import { cn } from '../../utils/cn'

type Props = {
  isOpen: boolean
  onClose: () => void
  templates: CyberRiskTemplate[]
  selectedTemplateId: string
  onSelectTemplateId: (templateId: string) => void
  onApplySelected: () => void
}

export function CyberTemplatePickerModal({
  isOpen,
  onClose,
  templates,
  selectedTemplateId,
  onSelectTemplateId,
  onApplySelected,
}: Props) {
  const [search, setSearch] = useState('')

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return templates

    return templates.filter((template) => {
      const haystack = `${template.label} ${template.description}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [search, templates])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  )

  const preview = useMemo(() => {
    if (!selectedTemplate) return null

    const probability = typeof selectedTemplate.risk.probability === 'number' ? selectedTemplate.risk.probability : 3
    const impact = typeof selectedTemplate.risk.impact === 'number' ? selectedTemplate.risk.impact : 3
    const riskScore = calculateRiskScore(probability, impact)
    const severity = getRiskSeverity(riskScore)

    return {
      probability,
      impact,
      riskScore,
      severity,
      title: selectedTemplate.risk.title ?? selectedTemplate.label,
      category: selectedTemplate.risk.category ?? 'Security',
      mitigationPlan: selectedTemplate.risk.mitigationPlan ?? '',
      mitigationStepsCount: Array.isArray(selectedTemplate.risk.mitigationSteps)
        ? selectedTemplate.risk.mitigationSteps.length
        : 0,
    }
  }, [selectedTemplate])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cyber templates"
      eyebrow="New risk"
      description="Pick a starter template. Applying it will prefill the new risk form."
      size="xl"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onApplySelected} disabled={!selectedTemplate}>
            Use template
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Search templates"
          placeholder="Search by name or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">Templates</p>
            <div className="max-h-[50vh] space-y-2 overflow-auto pr-1">
              {filteredTemplates.map((template) => {
                const isSelected = template.id === selectedTemplateId
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelectTemplateId(template.id)}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-3 text-left text-sm transition focus:outline-none focus:ring-4 focus:ring-brand-primary/20',
                      isSelected
                        ? 'border-brand-primary bg-brand-primary-light/40 text-brand-primary'
                        : 'border-border-faint bg-surface-secondary/15 text-text-high hover:bg-surface-secondary/25',
                    )}
                    aria-pressed={isSelected}
                  >
                    <p className="font-semibold">{template.label}</p>
                    <p className="mt-1 text-xs text-text-low">{template.description}</p>
                  </button>
                )
              })}

              {!filteredTemplates.length ? (
                <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4 text-sm text-text-low">
                  No templates match your search.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">Preview</p>
            {selectedTemplate && preview ? (
              <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-high">{preview.title}</p>
                    <p className="mt-1 text-sm text-text-low">{selectedTemplate.description}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-border-faint bg-surface-primary/70 px-3 py-2 text-xs text-text-low">
                    <span className="font-semibold text-text-high">{preview.riskScore}</span>{' '}
                    <span className="uppercase tracking-wide">{preview.severity}</span>
                    <div className="mt-1 flex gap-2">
                      <span>Likelihood {preview.probability}/5</span>
                      <span>Impact {preview.impact}/5</span>
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">Category</dt>
                    <dd className="mt-1 text-text-high">{preview.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">Mitigation steps</dt>
                    <dd className="mt-1 text-text-high">{preview.mitigationStepsCount}</dd>
                  </div>
                </dl>

                {preview.mitigationPlan ? (
                  <div className="mt-4 rounded-2xl border border-border-faint bg-surface-primary/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">Mitigation plan</p>
                    <p className="mt-2 text-sm text-text-high">{preview.mitigationPlan}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-4 text-sm text-text-low">
                Select a template to preview its suggested scoring and mitigation plan.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

