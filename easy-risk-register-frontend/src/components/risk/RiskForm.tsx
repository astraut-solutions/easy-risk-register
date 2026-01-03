import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { nanoid } from 'nanoid'

import type { RiskInput, RiskStatus, ReviewCadence, RiskResponse } from '../../types/risk'
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations'
import { Badge, Button, Input, Select, Textarea, Tooltip } from '../../design-system'
import { cn } from '../../utils/cn'
import { trackEvent } from '../../utils/analytics'
import { COMPLIANCE_CHECKLIST_TEMPLATES, THREAT_TYPE_OPTIONS } from '../../constants/cyber'
import { PLAYBOOK_TEMPLATES } from '../../constants/playbooks'
import { selectRiskById, useRiskStore } from '../../stores/riskStore'
import { RiskActivityLogPanel } from './RiskActivityLogPanel'

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export type RiskFormValues = RiskInput & { status: RiskStatus }

export type RiskFormHandle = {
  getValues: () => RiskFormValues
  markClean: () => void
  submit: () => void
}

interface RiskFormProps {
  categories: string[]
  defaultValues?: Partial<RiskFormValues>
  mode?: 'create' | 'edit'
  riskId?: string
  onSubmit: (values: RiskFormValues) => void | Promise<void>
  onLoadChecklists?: (riskId: string) => void | Promise<unknown>
  onAttachChecklistTemplate?: (riskId: string, templateId: string) => void | Promise<unknown>
  onToggleChecklistItem?: (riskId: string, checklistId: string, itemId: string) => void | Promise<void>
  onAddCategory?: (category: string) => void
  onCancel?: () => void
  onSaveDraft?: (values: RiskFormValues) => void
  writeBlockedReason?: string | null
  onDirtyChange?: (isDirty: boolean) => void
  onMetaChange?: (meta: {
    isDirty: boolean
    isSubmitting: boolean
    isValid: boolean
    missingRequiredFields: string[]
    isPrimaryDisabled: boolean
  }) => void
  formId?: string
  showActions?: boolean
  showTooltips?: boolean
  className?: string
}

export const RiskForm = forwardRef<RiskFormHandle, RiskFormProps>(({
  categories,
  defaultValues,
  mode = 'create',
  riskId,
  onSubmit,
  onLoadChecklists,
  onAttachChecklistTemplate,
  onToggleChecklistItem,
  onAddCategory,
  onCancel,
  onSaveDraft,
  writeBlockedReason,
  onDirtyChange,
  onMetaChange,
  formId,
  showActions = true,
  showTooltips = true,
  className,
}: RiskFormProps, ref) => {
  const liveRisk = useRiskStore((state) => (riskId ? selectRiskById(riskId)(state) : undefined))

  const [checklistsLoading, setChecklistsLoading] = useState(false)
  const [checklistsError, setChecklistsError] = useState<string | null>(null)
  const [checklistsTouched, setChecklistsTouched] = useState(false)
  const [checklistActionPending, setChecklistActionPending] = useState(false)
  const [selectedChecklistTemplateId, setSelectedChecklistTemplateId] = useState(
    () => COMPLIANCE_CHECKLIST_TEMPLATES[0]?.id ?? '',
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }),
    [],
  )

  const formatMaybeDate = useCallback(
    (value?: string) => {
      if (!value) return '-'
      const parsed = Date.parse(value)
      if (Number.isNaN(parsed)) return '-'
      return dateFormatter.format(new Date(parsed))
    },
    [dateFormatter],
  )

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<RiskFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      probability: 3,
      impact: 3,
      category: categories[0] ?? 'Operational',
      threatType: 'other',
      templateId: undefined,
      mitigationPlan: '',
      status: 'open',
      owner: '',
      ownerTeam: '',
      dueDate: '',
      reviewDate: '',
      reviewCadence: undefined,
      riskResponse: 'treat',
      ownerResponse: '',
      securityAdvisorComment: '',
      vendorResponse: '',
      notes: '',
      evidence: [],
      mitigationSteps: [],
      playbook: { title: '', steps: [], lastModified: '' },
      ...defaultValues,
    },
  })

  const formValues = watch()
  const { probability = 3, impact = 3 } = formValues
  const riskScore = calculateRiskScore(probability, impact)
  const severity = getRiskSeverity(riskScore)

  // const missingRequiredFields = useMemo(() => {
  //   const missing: string[] = []
  //   if (!formValues.title?.trim()) missing.push('Title')
  //   if (!formValues.description?.trim()) missing.push('Description')
  //   if (!formValues.category?.trim()) missing.push('Category')
  //   if (!formValues.status?.trim()) missing.push('Status')
  //   return missing
  // }, [formValues.category, formValues.description, formValues.status, formValues.title])

  const isPrimaryDisabled = Boolean(writeBlockedReason) || isSubmitting || !isValid

  const severityMeta = useMemo(() => {
    switch (severity) {
      case 'low':
        return {
          label: 'Low',
          cardTone: 'border-status-success/30 bg-status-success/10',
          pillTone: 'border-status-success/40 bg-status-success/15 text-status-success',
          why: 'Scores 1-8 are low severity.',
          nudge: 'Next: Confirm an owner and review cadence.',
        }
      case 'medium':
        return {
          label: 'Medium',
          cardTone: 'border-status-warning/30 bg-status-warning/10',
          pillTone: 'border-status-warning/40 bg-status-warning/15 text-status-warning',
          why: 'Scores 9-15 are medium severity.',
          nudge: 'Next: Add mitigation steps and a target due date.',
        }
      case 'high':
      default:
        return {
          label: 'High',
          cardTone: 'border-status-danger/30 bg-status-danger/10',
          pillTone: 'border-status-danger/40 bg-status-danger/15 text-status-danger',
          why: 'Scores 16-25 are high severity.',
          nudge: 'Next: Assign an owner and set a due date.',
        }
    }
  }, [severity])

  const generatedFormId = useId()
  const resolvedFormId = formId ?? generatedFormId

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    onMetaChange?.({
      isDirty,
      isSubmitting,
      isValid,
      missingRequiredFields: [],
      isPrimaryDisabled,
    })
  }, [isDirty, isPrimaryDisabled, isSubmitting, isValid, onMetaChange])

  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null)

  const evidenceArray = useFieldArray({
    control,
    name: 'evidence',
    keyName: '_key',
  })

  const mitigationStepsArray = useFieldArray({
    control,
    name: 'mitigationSteps',
    keyName: '_key',
  })

  const playbookStepsArray = useFieldArray({
    control,
    name: 'playbook.steps' as any,
    keyName: '_key',
  })

  const [playbookEnabled, setPlaybookEnabled] = useState(() => Boolean(defaultValues?.playbook))
  const [selectedPlaybookTemplateId, setSelectedPlaybookTemplateId] = useState(
    () => PLAYBOOK_TEMPLATES[0]?.id ?? '',
  )

  const normalizedCategorySet = useMemo(() => {
    return new Set(categories.map((category) => category.trim().toLowerCase()))
  }, [categories])

  const toDateInputValue = (iso?: string) => {
    if (!iso) return ''
    const parsed = Date.parse(iso)
    if (Number.isNaN(parsed)) return ''
    return new Date(parsed).toISOString().split('T')[0]
  }

  const isValidHttpUrl = (value: string) => {
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues.title ?? '',
        description: defaultValues.description ?? '',
        probability: defaultValues.probability ?? 3,
        impact: defaultValues.impact ?? 3,
        category: defaultValues.category ?? categories[0] ?? 'Operational',
        threatType: defaultValues.threatType ?? 'other',
        templateId: defaultValues.templateId,
        mitigationPlan: defaultValues.mitigationPlan ?? '',
        status: defaultValues.status ?? 'open',
        owner: defaultValues.owner ?? '',
        ownerTeam: defaultValues.ownerTeam ?? '',
        dueDate: toDateInputValue(defaultValues.dueDate),
        reviewDate: toDateInputValue(defaultValues.reviewDate),
        reviewCadence: defaultValues.reviewCadence,
        riskResponse: defaultValues.riskResponse ?? 'treat',
        ownerResponse: defaultValues.ownerResponse ?? '',
        securityAdvisorComment: defaultValues.securityAdvisorComment ?? '',
        vendorResponse: defaultValues.vendorResponse ?? '',
        notes: defaultValues.notes ?? '',
        evidence: defaultValues.evidence ?? [],
        mitigationSteps: defaultValues.mitigationSteps ?? [],
        playbook: defaultValues.playbook ?? { title: '', steps: [], lastModified: '' },
      })
      setPlaybookEnabled(Boolean(defaultValues.playbook))
    }
  }, [categories, defaultValues, reset])

  useEffect(() => {
    setChecklistsTouched(false)
    setChecklistsError(null)
  }, [riskId])

  useEffect(() => {
    if (mode !== 'edit') return
    if (!riskId) return
    if (!onLoadChecklists) return
    if (checklistsTouched) return

    setChecklistsLoading(true)
    setChecklistsError(null)

    Promise.resolve(onLoadChecklists(riskId))
      .then(() => setChecklistsTouched(true))
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to load checklists.'
        setChecklistsError(message)
      })
      .finally(() => setChecklistsLoading(false))
  }, [checklistsTouched, mode, onLoadChecklists, riskId])

  const collectErrorPaths = (value: unknown, prefix = ''): string[] => {
    if (!value || typeof value !== 'object') return []

    if ('message' in (value as Record<string, unknown>)) {
      return prefix ? [prefix] : []
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry, index) => collectErrorPaths(entry, `${prefix}[${index}]`))
    }

    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key
      return collectErrorPaths(entry, nextPrefix)
    })
  }

  const onFormInvalid = (formErrors: unknown) => {
    const fields = collectErrorPaths(formErrors)
    trackEvent('risk_modal_validation_error', {
      mode,
      errorCount: fields.length,
      fields,
    })
  }

  const onFormSubmit = useCallback(async (values: RiskFormValues) => {
    const nowIso = new Date().toISOString()
    const playbook = playbookEnabled
      ? {
        title: (values as any).playbook?.title ?? '',
        steps: Array.isArray((values as any).playbook?.steps) ? (values as any).playbook.steps : [],
        lastModified: nowIso,
      }
      : undefined

    await onSubmit({
      ...values,
      probability: Number(values.probability),
      impact: Number(values.impact),
      ...(playbook ? { playbook } : { playbook: undefined }),
    })

    if (mode === 'create') {
      reset({
        title: '',
        description: '',
        probability: 3,
        impact: 3,
        category: categories[0] ?? 'Operational',
        threatType: 'other',
        templateId: undefined,
        mitigationPlan: '',
        status: 'open',
        owner: '',
        ownerTeam: '',
        dueDate: '',
        reviewDate: '',
        reviewCadence: undefined,
        riskResponse: 'treat',
        ownerResponse: '',
        securityAdvisorComment: '',
        vendorResponse: '',
        notes: '',
        evidence: [],
        mitigationSteps: [],
        playbook: { title: '', steps: [], lastModified: '' },
      })
      setPlaybookEnabled(false)
    }
  }, [categories, mode, onSubmit, playbookEnabled, reset])

  const checklistSummary = useMemo(() => {
    const checklists = liveRisk?.checklists ?? []
    const items = checklists.flatMap((checklist) => checklist.items ?? [])
    const completed = items.filter((item) => Boolean(item.completedAt)).length
    return { completed, total: items.length }
  }, [liveRisk?.checklists])

  const handleAttachChecklist = useCallback(async () => {
    if (!riskId) return
    if (!onAttachChecklistTemplate) return
    if (!selectedChecklistTemplateId) return

    setChecklistActionPending(true)
    setChecklistsError(null)

    try {
      await onAttachChecklistTemplate(riskId, selectedChecklistTemplateId)
      setChecklistsTouched(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to attach checklist.'
      setChecklistsError(message)
    } finally {
      setChecklistActionPending(false)
    }
  }, [onAttachChecklistTemplate, riskId, selectedChecklistTemplateId])

  const handleToggleChecklistItem = useCallback(
    async (checklistId: string, itemId: string) => {
      if (!riskId) return
      if (!onToggleChecklistItem) return

      setChecklistActionPending(true)
      setChecklistsError(null)
      try {
        await onToggleChecklistItem(riskId, checklistId, itemId)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update checklist item.'
        setChecklistsError(message)
      } finally {
        setChecklistActionPending(false)
      }
    },
    [onToggleChecklistItem, riskId],
  )

  const handleSaveDraft = () => {
    if (!onSaveDraft) return
    const values = getValues()
    onSaveDraft(values)
    reset(values)
  }

  useImperativeHandle(
    ref,
    () => ({
      getValues: () => getValues(),
      markClean: () => reset(getValues()),
      submit: () => {
        void handleSubmit(onFormSubmit)()
      },
    }),
    [getValues, handleSubmit, onFormSubmit, reset],
  )

  const handleStartAddCategory = () => {
    if (!onAddCategory) return
    setNewCategory('')
    setNewCategoryError(null)
    setIsAddingCategory(true)
  }

  const handleCancelAddCategory = () => {
    setNewCategory('')
    setNewCategoryError(null)
    setIsAddingCategory(false)
  }

  const handleConfirmAddCategory = () => {
    if (!onAddCategory) return

    const normalized = newCategory.trim()
    if (!normalized) {
      setNewCategoryError('Category name is required.')
      return
    }

    if (normalizedCategorySet.has(normalized.toLowerCase())) {
      setNewCategoryError('Category already exists.')
      return
    }

    onAddCategory(normalized)
    setValue('category', normalized, { shouldDirty: true, shouldValidate: true })
    handleCancelAddCategory()
  }

  const reviewCadenceOptions: Array<{ value: ReviewCadence; label: string }> = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semiannual', label: 'Semiannual' },
    { value: 'annual', label: 'Annual' },
    { value: 'ad-hoc', label: 'Ad hoc' },
  ]

  const riskResponseOptions: Array<{ value: RiskResponse; label: string }> = [
    { value: 'treat', label: 'Treat (mitigate)' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'tolerate', label: 'Tolerate' },
    { value: 'terminate', label: 'Terminate' },
  ]

  const titleField = register('title', {
    required: 'Add a short, specific title (e.g., “Supply chain disruption”).',
  })
  const descriptionField = register('description', {
    required: 'Add 2–3 sentences describing context and business impact.',
  })
  const mitigationPlanField = register('mitigationPlan')

  return (
    <form
      id={resolvedFormId}
      onSubmit={handleSubmit(onFormSubmit, onFormInvalid)}
      className={cn('flex h-full min-h-full flex-col gap-4', className)}
      noValidate
    >
      <div className="flex flex-1 flex-col gap-4 pb-1">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)]">
          <div className="rounded-2xl border border-border-subtle bg-surface-primary p-5 shadow-sm">
            <div className="grid gap-5">
              <Input
                label="Title *"
                tooltip="Keep it sharp so execs can scan quickly. Use a short headline (5–10 words). Good titles make exports and dashboards scan-friendly."
                error={errors.title?.message?.toString()}
                placeholder="Supply chain disruption"
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-3 text-sm focus:ring-brand-primary/30"
                autoFocus
                {...titleField}
              />
              <details className="mt-3 rounded-2xl border border-border-faint bg-surface-secondary/10 p-4 shadow-sm">
                <summary className="cursor-pointer select-none text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Details (optional)
                </summary>
                <p className="mt-3 text-sm text-text-low">
                  Capture extra context, links, or notes that help reviewers understand the scenario before diving into mitigation.
                </p>
              </details>

              <div className="grid gap-5 md:grid-cols-3">
                <Controller
                  name="category"
                  control={control}
                  defaultValue={categories[0] ?? 'Operational'}
                  rules={{ required: 'Select a category.' }}
                  render={({ field }) => (
                    <div className="relative space-y-2">
                      <Select
                        label="Category *"
                        labelAction={
                          onAddCategory ? (
                            <button
                              type="button"
                              onClick={handleStartAddCategory}
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-surface-secondary/20 text-brand-primary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20"
                              aria-label="Add new category"
                            >
                              <PlusIcon className="h-3 w-3" />
                            </button>
                          ) : undefined
                        }
                        tooltip="Use broad buckets. Categories help sort and filter the register for reporting (e.g. Security, Compliance, Operational)."
                        error={errors.category?.message?.toString()}
                        options={categories.map((category) => ({
                          value: category,
                          label: category,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        required
                        placeholder="Select a category"
                      />

                      {onAddCategory && isAddingCategory && (
                        <div className="absolute left-0 right-0 top-7 z-50 min-w-[300px] rounded-xl border border-border-faint bg-surface-primary p-4 shadow-xl">
                          <div className="grid gap-3">
                            <Input
                              label="New category"
                              value={newCategory}
                              onChange={(event) => {
                                setNewCategory(event.target.value)
                                setNewCategoryError(null)
                              }}
                              error={newCategoryError ?? undefined}
                              placeholder="e.g. Privacy"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="ghost" onClick={handleCancelAddCategory}>
                                Cancel
                              </Button>
                              <Button type="button" size="sm" onClick={handleConfirmAddCategory}>
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  defaultValue="open"
                  rules={{ required: 'Select a status.' }}
                  render={({ field }) => (
                    <Select
                      label="Status *"
                      tooltip="Keep open risks actionable. Status is for governance: Open = active work, Accepted = explicitly tolerated, Mitigated = controls in place, Closed = no longer relevant."
                      error={errors.status?.message?.toString()}
                      options={[
                        { value: 'open', label: 'Open' },
                        { value: 'accepted', label: 'Accepted' },
                        { value: 'mitigated', label: 'Mitigated' },
                        { value: 'closed', label: 'Closed' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      required
                    />
                  )}
                />

                <Controller
                  name="threatType"
                  control={control}
                  defaultValue="other"
                  render={({ field }) => (
                    <Select
                      label="Threat type (optional)"
                      tooltip="Used for cyber reporting. Threat type is a cyber lens for filtering and reporting (e.g. phishing, ransomware, data breach)."
                      options={THREAT_TYPE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      value={field.value ?? 'other'}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder="Select a threat type"
                    />
                  )}
                />
              </div>

              <Textarea
                label="Description *"
                error={errors.description?.message?.toString()}
                tooltip="Capture context, trigger, and business impact in 2-3 sentences. Include the likely cause, what could go wrong, and the business impact. This helps reviewers understand why the score matters."
                placeholder="Describe the risk context and impact..."
                rows={3}
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-3 text-sm focus:ring-brand-primary/30"
                {...descriptionField}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-primary p-5 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
              <div className="flex flex-col gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border-faint bg-surface-secondary/20 p-5">
                    <div className="flex items-center justify-between font-medium text-text-high">
                      <span className="flex items-center gap-2 text-sm">
                        <span>Likelihood *</span>
                        {showTooltips ? (
                          <Tooltip
                            content="Likelihood is how probable the scenario is over your chosen time window (e.g. next 12 months). Use incident history and control strength."
                            ariaLabel="Help: Likelihood"
                          />
                        ) : null}
                      </span>
                      <span className="rounded-full bg-surface-primary px-3 py-1 text-xs font-semibold text-text-high shadow-sm">
                        {probability} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      {...register('probability', {
                        required: true,
                        valueAsNumber: true,
                      })}
                      className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-secondary/50 accent-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
                      style={{
                        backgroundImage: `linear-gradient(to right, #2563eb 0%, #2563eb ${(probability - 1) * 25}%, transparent ${(probability - 1) * 25}%, transparent 100%)`
                      }}
                      aria-label="Likelihood (1-5)"
                      aria-describedby="likelihood-help"
                      aria-valuemin={1}
                      aria-valuemax={5}
                      aria-valuenow={probability}
                      aria-valuetext={`${probability} of 5`}
                    />
                    <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-text-muted">
                      <span>Rare</span>
                      <span>Certain</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-faint bg-surface-secondary/20 p-5">
                    <div className="flex items-center justify-between font-medium text-text-high">
                      <span className="flex items-center gap-2 text-sm">
                        <span>Impact *</span>
                        {showTooltips ? (
                          <Tooltip
                            content="Impact is the severity if the risk occurs (financial, operational, legal, reputation). Use worst credible outcome, not average."
                            ariaLabel="Help: Impact"
                          />
                        ) : null}
                      </span>
                      <span className="rounded-full bg-surface-primary px-3 py-1 text-xs font-semibold text-text-high shadow-sm">
                        {impact} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      {...register('impact', {
                        required: true,
                        valueAsNumber: true,
                      })}
                      className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-secondary/50 accent-status-danger focus:outline-none focus:ring-4 focus:ring-status-danger/20"
                      style={{
                        backgroundImage: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(impact - 1) * 25}%, transparent ${(impact - 1) * 25}%, transparent 100%)`
                      }}
                      aria-label="Impact (1-5)"
                      aria-describedby="impact-help"
                      aria-valuemin={1}
                      aria-valuemax={5}
                      aria-valuenow={impact}
                      aria-valuetext={`${impact} of 5`}
                    />
                    <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-text-muted">
                      <span>Minimal</span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Score Panel */}
              <aside
                className={cn(
                  'flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-colors lg:h-full lg:justify-center',
                  severityMeta.cardTone,
                )}
                aria-label="Live score"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-low/80">
                      Live Risk Score
                    </p>
                    <Tooltip
                      content={severityMeta.nudge}
                      ariaLabel="Recommendation"
                    />
                  </div>

                  <div className="mt-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight text-text-high" aria-label={`Risk score: ${riskScore}`}>
                        {riskScore}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          severityMeta.pillTone,
                        )}
                        aria-label={`Risk severity: ${severityMeta.label.toUpperCase()}`}
                      >
                        {severityMeta.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-text-low">
                      {probability} (L) × {impact} (I)
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-text-low">{severityMeta.why}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-low">
                    Recommended next step:{' '}
                    <span className="font-normal normal-case text-text-high">
                      {severityMeta.nudge.replace(/^Next:\s*/i, '')}
                    </span>
                  </p>
                </div>
              </aside>
            </div>
          </div>

          {/* Plan Section - Collapsible */}
          <details open className="group space-y-4 rounded-2xl border border-border-subtle bg-surface-primary p-2 shadow-sm transition-all hover:shadow-md open:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-surface-secondary/30 px-4 py-3 text-sm font-semibold text-text-high transition-colors hover:bg-surface-secondary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20 group-open:bg-transparent group-open:px-0 group-open:py-0 group-open:text-base group-open:mb-6">
              <span className="flex items-center gap-2">
                Plan (optional)
                <span className="ml-2 rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-low group-open:hidden">
                  {mitigationPlanField ? 'Active' : 'Empty'}
                </span>
              </span>
              <ChevronIcon className="h-5 w-5 text-text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-4">
              <Textarea
                label="Mitigation plan (optional)"
                placeholder="Outline mitigation actions, owners, or milestones..."
                helperText="Keeps downstream owners aligned."
                tooltip={
                  showTooltips
                    ? 'Capture the main mitigation approach. Use Mitigation steps below for actionable tasks with owners and dates.'
                    : undefined
                }
                rows={2}
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-3 text-sm focus:ring-brand-primary/30"
                {...mitigationPlanField}
              />

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Accountability (optional)
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    label="Owner (optional)"
                    helperText="Who is accountable for next actions."
                    tooltip={
                      showTooltips
                        ? 'Set a single accountable owner (person or role). This makes reminders and reporting actionable.'
                        : undefined
                    }
                    placeholder="Name or role (e.g. SecOps lead)"
                    {...register('owner')}
                  />
                  <Input
                    label="Owner team (optional)"
                    helperText="Helps routing and reporting."
                    tooltip={
                      showTooltips
                        ? 'Use a team name to help triage and reporting (e.g. IT, Finance, Operations). Optional for small teams.'
                        : undefined
                    }
                    placeholder="Team (optional)"
                    {...register('ownerTeam')}
                  />
                  <Input
                    type="date"
                    label="Due date (optional)"
                    helperText="Target date for mitigation or decision."
                    tooltip={
                      showTooltips
                        ? 'Use for the next meaningful milestone (mitigation completed, acceptance decision, or control uplift).'
                        : undefined
                    }
                    {...register('dueDate')}
                  />
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Review cadence (optional)
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    label="Next review date (optional)"
                    helperText="Set a concrete date for the next review."
                    tooltip={
                      showTooltips
                        ? 'Review dates help ensure risks are revisited. Pair with a cadence if you have a regular governance rhythm.'
                        : undefined
                    }
                    {...register('reviewDate')}
                  />
                  <Controller
                    name="reviewCadence"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Cadence (optional)"
                        helperText="How often this risk should be reviewed."
                        tooltip={
                          showTooltips
                            ? 'Cadence is a hint for how often to re-assess likelihood, impact, and controls (weekly → annual).'
                            : undefined
                        }
                        options={reviewCadenceOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        placeholder="Select cadence (optional)"
                      />
                    )}
                  />
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Responses (optional)
                </summary>
                <div className="mt-3 grid gap-3">
                  <Controller
                    name="riskResponse"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Response (optional)"
                        helperText="Choose a default response strategy."
                        tooltip={
                          showTooltips
                            ? 'Response is the high-level strategy: Treat (reduce), Transfer (insure/contract), Tolerate (accept), Terminate (stop the activity).'
                            : undefined
                        }
                        options={riskResponseOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        value={field.value ?? 'treat'}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    )}
                  />

                  <Textarea
                    label="Owner response (optional)"
                    helperText="One sentence capturing the owner's stance."
                    rows={2}
                    placeholder="Short owner response (optional)"
                    {...register('ownerResponse')}
                  />
                  <Textarea
                    label="Security advisor comment (optional)"
                    helperText="Note security guidance or constraints."
                    rows={2}
                    placeholder="Short security advisor comment (optional)"
                    {...register('securityAdvisorComment')}
                  />
                  <Textarea
                    label="Vendor response (optional)"
                    helperText="Record vendor confirmation or commitments."
                    rows={2}
                    placeholder="Short vendor response (optional)"
                    {...register('vendorResponse')}
                  />
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Mitigation steps (optional)
                </summary>
                <div className="mt-3 space-y-3">
                  {mitigationStepsArray.fields.length === 0 ? (
                    <p className="text-xs text-text-low">
                      Track mitigation as actionable steps with owners and due dates.
                    </p>
                  ) : null}

                  {mitigationStepsArray.fields.map((field, index) => {
                    const base = `mitigationSteps.${index}` as const
                    const stepErrors = (errors.mitigationSteps as any)?.[index]

                    return (
                      <div key={(field as any)._key} className="rounded-2xl bg-surface-primary/60 p-4">
                        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                          <div className="pt-8">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded accent-brand-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20"
                              aria-label="Mark step done"
                              // eslint-disable-next-line react-hooks/incompatible-library
                              checked={(watch(`${base}.status`) as any) === 'done'}
                              onChange={(event) => {
                                const nextStatus = event.target.checked ? 'done' : 'open'
                                setValue(`${base}.status`, nextStatus as any, { shouldDirty: true })
                                setValue(
                                  `${base}.completedAt`,
                                  event.target.checked ? new Date().toISOString() : undefined,
                                  { shouldDirty: true },
                                )
                              }}
                            />
                          </div>
                          <div className="grid gap-3">
                            <Input
                              label="Step (required)"
                              helperText="Required for each step. Keep it short and actionable."
                              placeholder="Describe the mitigation action"
                              error={stepErrors?.description?.message?.toString()}
                              {...register(`${base}.description`, {
                                required: 'Describe the step (e.g., "Enable MFA for admin accounts").',
                              })}
                            />
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                label="Owner (optional)"
                                helperText="Who will execute this step."
                                placeholder="Who owns this step?"
                                {...register(`${base}.owner`)}
                              />
                              <Input
                                type="date"
                                label="Due date (optional)"
                                helperText="Target completion date."
                                {...register(`${base}.dueDate`)}
                              />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={index === 0}
                                  onClick={() => mitigationStepsArray.move(index, index - 1)}
                                >
                                  Up
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={index === mitigationStepsArray.fields.length - 1}
                                  onClick={() => mitigationStepsArray.move(index, index + 1)}
                                >
                                  Down
                                </Button>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => mitigationStepsArray.remove(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>

                        <input type="hidden" {...register(`${base}.id`)} />
                        <input type="hidden" {...register(`${base}.status`)} />
                        <input type="hidden" {...register(`${base}.createdAt`)} />
                        <input type="hidden" {...register(`${base}.completedAt`)} />
                      </div>
                    )
                  })}

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      mitigationStepsArray.append({
                        id: nanoid(10),
                        description: '',
                        owner: '',
                        dueDate: '',
                        status: 'open',
                        createdAt: new Date().toISOString(),
                      } as any)
                    }
                  >
                    Add step
                  </Button>
                </div>
              </details>
            </div>
          </details>

          {/* Evidence & Extras Section - Collapsible */}
          <details className="group space-y-4 rounded-2xl border border-border-subtle bg-surface-primary p-2 shadow-sm transition-all hover:shadow-md open:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-surface-secondary/30 px-4 py-3 text-sm font-semibold text-text-high transition-colors hover:bg-surface-secondary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20 group-open:bg-transparent group-open:px-0 group-open:py-0 group-open:text-base group-open:mb-6">
              Evidence & Extras (optional)
              <ChevronIcon className="h-5 w-5 text-text-muted transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-4">
              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Evidence (optional)
                </summary>
                <div className="mt-3 space-y-3">
                  {evidenceArray.fields.length === 0 ? (
                    <p className="text-xs text-text-low">
                      Add links to tickets, docs, or other evidence that supports the risk decision.
                    </p>
                  ) : null}

                  {evidenceArray.fields.map((field, index) => {
                    const base = `evidence.${index}` as const
                    return (
                      <div key={(field as any)._key} className="rounded-2xl bg-surface-primary/60 p-4">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)]">
                          <Controller
                            name={`${base}.type`}
                            control={control}
                            defaultValue={(field as any).type ?? 'link'}
                            render={({ field: typeField }) => (
                              <Select
                                label="Type"
                                options={[
                                  { value: 'link', label: 'Link' },
                                  { value: 'ticket', label: 'Ticket' },
                                  { value: 'doc', label: 'Doc' },
                                  { value: 'other', label: 'Other' },
                                ]}
                                value={typeField.value ?? 'link'}
                                onChange={typeField.onChange}
                                onBlur={typeField.onBlur}
                                name={typeField.name}
                              />
                            )}
                          />
                          <Input
                            label="URL (required)"
                            placeholder="https://..."
                            error={
                              (errors.evidence as any)?.[index]?.url?.message?.toString()
                            }
                            {...register(`${base}.url`, {
                              required: 'Paste a valid URL (include https://).',
                              validate: (value) =>
                                isValidHttpUrl(String(value)) || 'Enter a valid http(s) URL.',
                            })}
                          />
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                          <Input
                            label="Description (optional)"
                            helperText="Add context so reviewers know why this link matters."
                            placeholder="Optional context for this evidence link"
                            {...register(`${base}.description`)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => evidenceArray.remove(index)}
                            aria-label="Remove evidence"
                          >
                            Remove
                          </Button>
                        </div>
                        <input
                          type="hidden"
                          {...register(`${base}.addedAt`)}
                        />
                      </div>
                    )
                  })}

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      evidenceArray.append({
                        type: 'link',
                        url: '',
                        description: '',
                        addedAt: new Date().toISOString(),
                      } as any)
                    }
                  >
                    Add evidence
                  </Button>
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Incident response playbook (optional)
                </summary>

                <div className="mt-3 space-y-3">
                  {!playbookEnabled ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border-faint bg-surface-secondary/20 p-3">
                        <div className="flex-1 min-w-[200px]">
                          <span className="mb-1 block text-xs font-semibold text-text-low">Use template</span>
                          <select
                            className="rr-select w-full"
                            value={selectedPlaybookTemplateId}
                            onChange={(event) => setSelectedPlaybookTemplateId(event.target.value)}
                            aria-label="Select playbook template"
                          >
                            {PLAYBOOK_TEMPLATES.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button type="button" className="mb-2 text-xs text-brand-primary hover:underline" onClick={() => {/* TODO: Implement browse */ }}>
                          Browse templates
                        </button>
                        <Button
                          type="button"
                          className="mb-0.5"
                          variant="ghost"
                          onClick={() => setSelectedPlaybookTemplateId(PLAYBOOK_TEMPLATES[0].id)}
                          aria-label="Clear selection"
                        >
                          Clear
                        </Button>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            const template = PLAYBOOK_TEMPLATES.find((item) => item.id === selectedPlaybookTemplateId)
                            const now = new Date().toISOString()
                            setValue('playbook', {
                              title: template?.title ?? 'Incident response playbook',
                              steps: (template?.steps ?? []).map((description) => ({
                                id: nanoid(10),
                                description,
                                createdAt: now,
                              })),
                              lastModified: now,
                            } as any)
                            setPlaybookEnabled(true)
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-text-low">
                        Playbooks are editable checklists you can use during an incident.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        label="Playbook title"
                        placeholder="e.g. Privacy incident response"
                        {...register('playbook.title' as any, {
                          required: 'Provide a playbook title.',
                        })}
                      />

                      <div className="space-y-2">
                        {playbookStepsArray.fields.length ? (
                          playbookStepsArray.fields.map((field, index) => {
                            void field
                            const base = `playbook.steps.${index}` as const
                            const completedAt = (formValues as any).playbook?.steps?.[index]?.completedAt as
                              | string
                              | undefined

                            return (
                              <div
                                key={(field as any)._key ?? (field as any).id ?? index}
                                className="rounded-2xl border border-border-faint bg-surface-primary/70 p-3"
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(completedAt)}
                                    onChange={(event) => {
                                      const next = event.target.checked ? new Date().toISOString() : undefined
                                      setValue(`${base}.completedAt` as any, next, { shouldDirty: true })
                                    }}
                                    className="mt-1 h-4 w-4"
                                    aria-label="Mark playbook step complete"
                                  />
                                  <div className="flex-1 space-y-2">
                                    <Input
                                      label={`Step ${index + 1}`}
                                      placeholder="Describe the response action"
                                      {...register(`${base}.description` as any, {
                                        required: 'Describe the step.',
                                      })}
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-xs text-text-low">
                                        {completedAt ? `Completed ${new Date(completedAt).toLocaleString()}` : 'Open'}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          disabled={index === 0}
                                          onClick={() => playbookStepsArray.move(index, index - 1)}
                                        >
                                          Up
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          disabled={index === playbookStepsArray.fields.length - 1}
                                          onClick={() => playbookStepsArray.move(index, index + 1)}
                                        >
                                          Down
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => playbookStepsArray.remove(index)}
                                        >
                                          Remove
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <input type="hidden" {...register(`${base}.id` as any)} />
                                <input type="hidden" {...register(`${base}.createdAt` as any)} />
                                <input type="hidden" {...register(`${base}.completedAt` as any)} />
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-text-low">No steps yet.</p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              playbookStepsArray.append({
                                id: nanoid(10),
                                description: '',
                                createdAt: new Date().toISOString(),
                              } as any)
                            }
                          >
                            Add step
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const confirmed = window.confirm('Remove the playbook from this risk?')
                              if (!confirmed) return
                              setValue('playbook', { title: '', steps: [], lastModified: '' } as any, {
                                shouldDirty: true,
                              })
                              setPlaybookEnabled(false)
                            }}
                          >
                            Remove playbook
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Compliance checklist (optional)
                </summary>

                <div className="mt-3 space-y-3">
                  {mode !== 'edit' || !riskId ? (
                    <p className="text-sm text-text-low">Save the risk first to attach a checklist.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">
                            Status: {(liveRisk?.checklistStatus ?? 'not_started').replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-text-low">
                            Overall progress: {checklistSummary.completed}/{checklistSummary.total}
                          </span>
                        </div>
                        {checklistsLoading ? (
                          <span className="text-xs text-text-low">Loading…</span>
                        ) : null}
                      </div>

                      {checklistsError ? (
                        <p className="text-sm text-status-danger">{checklistsError}</p>
                      ) : null}

                      {(liveRisk?.checklists ?? []).length ? (
                        <div className="space-y-3">
                          {(liveRisk?.checklists ?? []).map((checklist) => {
                            const total = checklist.items.length
                            const completed = checklist.items.filter((item) => Boolean(item.completedAt)).length
                            const completedDates = checklist.items
                              .map((item) => (item.completedAt ? Date.parse(item.completedAt) : NaN))
                              .filter((ms) => Number.isFinite(ms))
                            const derivedStartedAt =
                              completedDates.length ? new Date(Math.min(...completedDates)).toISOString() : undefined
                            const derivedCompletedAt =
                              total > 0 && completed === total && completedDates.length
                                ? new Date(Math.max(...completedDates)).toISOString()
                                : undefined

                            return (
                              <div key={checklist.id} className="rounded-2xl border border-border-faint bg-surface-primary/40 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-text-high">{checklist.title}</p>
                                    {checklist.description ? (
                                      <p className="mt-1 text-xs text-text-low">{checklist.description}</p>
                                    ) : null}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {checklist.status ? (
                                      <Badge tone="neutral" className="capitalize">
                                        {checklist.status.replace('_', ' ')}
                                      </Badge>
                                    ) : null}
                                    <Badge tone="neutral">
                                      {completed}/{total}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                  <div className="text-xs text-text-low">Attached: {formatMaybeDate(checklist.attachedAt)}</div>
                                  <div className="text-xs text-text-low">Started: {formatMaybeDate(checklist.startedAt ?? derivedStartedAt)}</div>
                                  <div className="text-xs text-text-low">Completed: {formatMaybeDate(checklist.completedAt ?? derivedCompletedAt)}</div>
                                </div>

                                {checklist.items.length ? (
                                  <ul className="mt-3 space-y-2">
                                    {checklist.items.map((item) => (
                                      <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border-faint bg-surface-secondary/10 p-2">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(item.completedAt)}
                                          disabled={checklistActionPending}
                                          onChange={() => handleToggleChecklistItem(checklist.id, item.id)}
                                          className="mt-1 h-4 w-4"
                                          aria-label={`Mark checklist item as ${item.completedAt ? 'not completed' : 'completed'}: ${item.description}`}
                                        />
                                        <div className="flex-1">
                                          <p className="text-sm text-text-high">{item.description}</p>
                                          <p className="mt-0.5 text-xs text-text-low">
                                            {item.completedAt ? `Completed ${formatMaybeDate(item.completedAt)}` : 'Not completed'}
                                          </p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-2 text-sm text-text-low">No items found.</p>
                                )}
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
                            {COMPLIANCE_CHECKLIST_TEMPLATES.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={
                            !selectedChecklistTemplateId ||
                            checklistActionPending ||
                            (liveRisk?.checklists ?? []).some((entry) => entry.templateId === selectedChecklistTemplateId)
                          }
                          onClick={handleAttachChecklist}
                        >
                          Attach
                        </Button>
                      </div>

                      <p className="text-xs text-text-low">
                        Assistive only — not legal advice. Record what you did and when, then export reports as needed.
                      </p>
                    </>
                  )}
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Activity log (audit trail)
                </summary>
                <div className="mt-3">
                  <RiskActivityLogPanel riskId={mode === 'edit' ? riskId ?? null : null} />
                </div>
              </details>

              <details className="rounded-2xl bg-surface-secondary/10 p-4">
                <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                  Notes (optional)
                </summary>
                <div className="mt-3">
                  <Textarea
                    label="Notes (optional)"
                    helperText="Use for audit context, assumptions, or decision rationale."
                    rows={3}
                    placeholder="Optional long-form notes"
                    {...register('notes')}
                  />
                </div>
              </details>




            </div>
          </details>
        </div>
      </div>

      {showActions ? (
        <div className="mt-4 border-t border-border-faint/70 bg-surface-primary px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isPrimaryDisabled && (
                <p id="risk-form-submit-help" className="text-xs text-text-low truncate" aria-live="polite">
                  {writeBlockedReason
                    ? writeBlockedReason
                    : 'Complete required fields marked * to enable submission.'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onCancel ? (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              ) : null}
              {mode === 'create' && onSaveDraft ? (
                <Button type="button" variant="secondary" onClick={handleSaveDraft}>
                  Save draft
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={isPrimaryDisabled}
                className="px-6"
                aria-label={mode === 'create' ? 'Add new risk' : 'Update risk'}
                aria-describedby={isPrimaryDisabled ? 'risk-form-submit-help' : undefined}
              >
                {mode === 'create' ? 'Add risk' : 'Update risk'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  )
})

RiskForm.displayName = 'RiskForm'
