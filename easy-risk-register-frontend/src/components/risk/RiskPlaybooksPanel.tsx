import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button, Input, Select, Textarea } from '../../design-system'
import type { PlaybookStepSection, PlaybookTemplate, RiskPlaybook, RiskPlaybookStep } from '../../types/playbooks'
import { playbookService } from '../../services/playbookService'

const SECTION_OPTIONS: Array<{ value: PlaybookStepSection; label: string }> = [
  { value: 'roles', label: 'Roles' },
  { value: 'immediate_actions', label: 'Immediate actions' },
  { value: 'communications', label: 'Communications' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'other', label: 'Other' },
]

const titleCaseSection = (section: PlaybookStepSection) =>
  SECTION_OPTIONS.find((opt) => opt.value === section)?.label ?? section

function formatMaybeDate(value?: string | null) {
  if (!value) return '-'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return '-'
  return new Date(parsed).toLocaleString()
}

type RiskPlaybooksPanelProps = {
  riskId: string
}

export function RiskPlaybooksPanel({ riskId }: RiskPlaybooksPanelProps) {
  const [templates, setTemplates] = useState<PlaybookTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  const [playbooks, setPlaybooks] = useState<RiskPlaybook[]>([])
  const [playbooksLoading, setPlaybooksLoading] = useState(false)
  const [playbooksError, setPlaybooksError] = useState<string | null>(null)

  const [actionPending, setActionPending] = useState(false)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const [editingPlaybookId, setEditingPlaybookId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState<string>('')
  const [draftDescription, setDraftDescription] = useState<string>('')

  const [newStepText, setNewStepText] = useState<string>('')
  const [newStepSection, setNewStepSection] = useState<PlaybookStepSection>('immediate_actions')

  const templateOptions = useMemo(
    () => templates.map((tpl) => ({ value: tpl.id, label: tpl.title })),
    [templates],
  )

  const refreshAll = useCallback(async () => {
    setTemplatesError(null)
    setPlaybooksError(null)

    setTemplatesLoading(true)
    setPlaybooksLoading(true)

    try {
      const [nextTemplates, nextPlaybooks] = await Promise.all([
        playbookService.listTemplates(),
        playbookService.listRiskPlaybooks(riskId),
      ])
      setTemplates(nextTemplates)
      setPlaybooks(nextPlaybooks)
      setSelectedTemplateId((prev) => prev || nextTemplates[0]?.id || '')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load playbooks.'
      setPlaybooksError(message)
    } finally {
      setTemplatesLoading(false)
      setPlaybooksLoading(false)
    }
  }, [riskId])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  const startEditing = (playbook: RiskPlaybook) => {
    setEditingPlaybookId(playbook.id)
    setDraftTitle(playbook.title ?? '')
    setDraftDescription(playbook.description ?? '')
  }

  const stopEditing = () => {
    setEditingPlaybookId(null)
    setDraftTitle('')
    setDraftDescription('')
    setNewStepText('')
    setNewStepSection('immediate_actions')
  }

  const attachTemplate = async () => {
    if (!selectedTemplateId) return
    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.attachTemplate(riskId, selectedTemplateId)
      await refreshAll()
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to attach template.')
    } finally {
      setActionPending(false)
    }
  }

  const savePlaybookMeta = async (playbookId: string) => {
    const title = draftTitle.trim()
    if (!title) {
      setPlaybooksError('Playbook title is required.')
      return
    }

    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.updatePlaybook(riskId, playbookId, { title, description: draftDescription })
      await refreshAll()
      setEditingPlaybookId(playbookId)
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to update playbook.')
    } finally {
      setActionPending(false)
    }
  }

  const deletePlaybook = async (playbook: RiskPlaybook) => {
    const confirmed = window.confirm(`Delete playbook "${playbook.title}"? This cannot be undone.`)
    if (!confirmed) return

    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.deletePlaybook(riskId, playbook.id)
      stopEditing()
      await refreshAll()
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to delete playbook.')
    } finally {
      setActionPending(false)
    }
  }

  const toggleStepCompleted = async (step: RiskPlaybookStep, completed: boolean) => {
    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.updateStep(riskId, step.id, { completed })
      await refreshAll()
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to update step.')
    } finally {
      setActionPending(false)
    }
  }

  const updateStepDescription = async (step: RiskPlaybookStep, description: string) => {
    const trimmed = description.trim()
    if (!trimmed) return

    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.updateStep(riskId, step.id, { description: trimmed })
      await refreshAll()
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to update step.')
    } finally {
      setActionPending(false)
    }
  }

  const deleteStep = async (step: RiskPlaybookStep) => {
    const confirmed = window.confirm('Delete this step?')
    if (!confirmed) return

    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.deleteStep(riskId, step.id)
      await refreshAll()
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to delete step.')
    } finally {
      setActionPending(false)
    }
  }

  const addStep = async (playbookId: string) => {
    const description = newStepText.trim()
    if (!description) return

    setActionPending(true)
    setPlaybooksError(null)
    try {
      await playbookService.addStep(riskId, playbookId, { description, section: newStepSection })
      setNewStepText('')
      await refreshAll()
    } catch (error) {
      setPlaybooksError(error instanceof Error ? error.message : 'Unable to add step.')
    } finally {
      setActionPending(false)
    }
  }

  const loading = templatesLoading || playbooksLoading

  return (
    <div className="rr-panel space-y-3 p-4" aria-label="Incident response playbooks">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-text-high">Incident response playbooks</h4>
          <p className="mt-1 text-xs text-text-low">
            Templates are assistive only and do not replace legal or professional advice.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={() => void refreshAll()} disabled={loading || actionPending}>
          Refresh
        </Button>
      </div>

      {templatesError ? <p className="text-sm text-status-danger">{templatesError}</p> : null}
      {playbooksError ? <p className="text-sm text-status-danger">{playbooksError}</p> : null}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Select
          label="Attach playbook template"
          options={templateOptions.length ? templateOptions : [{ value: '', label: 'No templates available' }]}
          value={selectedTemplateId}
          onChange={setSelectedTemplateId}
          disabled={loading || actionPending || !templateOptions.length}
          placeholder="Choose a template"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => void attachTemplate()}
          disabled={
            loading ||
            actionPending ||
            !selectedTemplateId ||
            playbooks.some((playbook) => playbook.templateId === selectedTemplateId)
          }
        >
          Attach
        </Button>
      </div>

      {loading ? <p className="text-sm text-text-low">Loading playbooks…</p> : null}

      {!loading && !playbooks.length ? (
        <p className="text-sm text-text-low">No playbooks attached yet.</p>
      ) : null}

      <div className="space-y-3">
        {playbooks.map((playbook) => {
          const isEditing = editingPlaybookId === playbook.id
          const steps = Array.isArray(playbook.steps) ? [...playbook.steps] : []
          steps.sort((a, b) => Number(a.position) - Number(b.position))

          const grouped = steps.reduce<Record<string, RiskPlaybookStep[]>>((acc, step) => {
            const key = step.section ?? 'other'
            acc[key] = acc[key] || []
            acc[key].push(step)
            return acc
          }, {})

          const sectionOrder: PlaybookStepSection[] = ['roles', 'immediate_actions', 'communications', 'recovery', 'other']

          return (
            <div key={playbook.id} className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-text-low">Template: {playbook.templateTitle}</p>
                  <p className="mt-1 text-xs text-text-low">Attached: {formatMaybeDate(playbook.attachedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isEditing ? (
                    <Button type="button" variant="secondary" onClick={() => startEditing(playbook)} disabled={actionPending}>
                      Edit
                    </Button>
                  ) : (
                    <Button type="button" variant="ghost" onClick={stopEditing} disabled={actionPending}>
                      Done
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={() => void deletePlaybook(playbook)} disabled={actionPending}>
                    Delete
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-3 grid gap-3">
                  <Input
                    label="Title"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    disabled={actionPending}
                  />
                  <Textarea
                    label="Description"
                    value={draftDescription}
                    onChange={(event) => setDraftDescription(event.target.value)}
                    rows={3}
                    disabled={actionPending}
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => void savePlaybookMeta(playbook.id)} disabled={actionPending}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-base font-semibold text-text-high">{playbook.title}</p>
                  {playbook.description ? <p className="mt-1 text-sm text-text-low">{playbook.description}</p> : null}
                </div>
              )}

              <div className="mt-3 space-y-3">
                {sectionOrder.map((section) => {
                  const items = grouped[section] || []
                  if (!items.length) return null
                  return (
                    <div key={section}>
                      <p className="text-xs font-semibold text-text-high">{titleCaseSection(section)}</p>
                      <ul className="mt-2 space-y-2">
                        {items.map((step) => {
                          const completed = Boolean(step.completedAt)
                          return (
                            <li key={step.id} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4"
                                checked={completed}
                                disabled={actionPending}
                                onChange={(event) => void toggleStepCompleted(step, event.target.checked)}
                                aria-label={`Mark playbook step as ${completed ? 'not completed' : 'completed'}: ${step.description}`}
                              />
                              <div className="flex-1">
                                <p className="text-sm text-text-high">{step.description}</p>
                                {completed ? (
                                  <p className="mt-0.5 text-xs text-text-low">Completed: {formatMaybeDate(step.completedAt)}</p>
                                ) : null}
                              </div>
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      const next = window.prompt('Edit step', step.description)
                                      if (typeof next === 'string') void updateStepDescription(step, next)
                                    }}
                                    disabled={actionPending}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => void deleteStep(step)}
                                    disabled={actionPending}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}

                {isEditing ? (
                  <div className="rounded-2xl border border-border-faint bg-surface-primary/70 p-3">
                    <p className="text-xs font-semibold text-text-high">Add step</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-end">
                      <Input
                        label="Description"
                        placeholder="Describe the step"
                        value={newStepText}
                        onChange={(event) => setNewStepText(event.target.value)}
                        disabled={actionPending}
                      />
                      <Select
                        label="Section"
                        options={SECTION_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                        value={newStepSection}
                        onChange={(value) => setNewStepSection(value as PlaybookStepSection)}
                        disabled={actionPending}
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button type="button" variant="secondary" onClick={() => void addStep(playbook.id)} disabled={actionPending || !newStepText.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
