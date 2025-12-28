import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { nanoid } from 'nanoid'

import type { RiskInput, RiskStatus, ReviewCadence, RiskResponse } from '../../types/risk'
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations'
import { Button, Input, Select, Textarea, Tooltip } from '../../design-system'
import { cn } from '../../utils/cn'
import { trackEvent } from '../../utils/analytics'
import { THREAT_TYPE_OPTIONS } from '../../constants/cyber'
import { PLAYBOOK_TEMPLATES } from '../../constants/playbooks'

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
  onSubmit: (values: RiskFormValues) => void | Promise<void>
  onAddCategory?: (category: string) => void
  onCancel?: () => void
  onSaveDraft?: (values: RiskFormValues) => void
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
  onSubmit,
  onAddCategory,
  onCancel,
  onSaveDraft,
  onDirtyChange,
  onMetaChange,
  formId,
  showActions = true,
  showTooltips = true,
  className,
}: RiskFormProps, ref) => {
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

  const missingRequiredFields = useMemo(() => {
    const missing: string[] = []
    if (!formValues.title?.trim()) missing.push('Title')
    if (!formValues.description?.trim()) missing.push('Description')
    if (!formValues.category?.trim()) missing.push('Category')
    if (!formValues.status?.trim()) missing.push('Status')
    return missing
  }, [formValues.category, formValues.description, formValues.status, formValues.title])

  const isPrimaryDisabled = isSubmitting || !isValid || missingRequiredFields.length > 0

  const severityMeta = useMemo(() => {
    switch (severity) {
      case 'low':
        return {
          label: 'Low',
          cardTone: 'border-status-success/30 bg-status-success/10',
          pillTone: 'border-status-success/40 bg-status-success/15 text-status-success',
          why: 'Score ≤ 3 is low severity.',
          nudge: 'Next: Confirm an owner and review cadence.',
        }
      case 'medium':
        return {
          label: 'Medium',
          cardTone: 'border-status-warning/30 bg-status-warning/10',
          pillTone: 'border-status-warning/40 bg-status-warning/15 text-status-warning',
          why: 'Score 4–6 is medium severity.',
          nudge: 'Next: Add mitigation steps and a target due date.',
        }
      case 'high':
      default:
        return {
          label: 'High',
          cardTone: 'border-status-danger/30 bg-status-danger/10',
          pillTone: 'border-status-danger/40 bg-status-danger/15 text-status-danger',
          why: 'Score > 6 is high severity.',
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
      missingRequiredFields,
      isPrimaryDisabled,
    })
  }, [isDirty, isPrimaryDisabled, isSubmitting, isValid, missingRequiredFields, onMetaChange])

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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="space-y-4 rounded-[20px] border border-border-faint/70 bg-surface-primary/95 p-4 shadow-[0_28px_56px_rgba(15,23,42,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text-high">Essentials</h3>
              <span className="text-xs font-medium text-text-low">Required fields marked *</span>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <Input
                label="Title *"
                helperText="Keep it sharp so execs can scan quickly."
                tooltip={
                  showTooltips
                    ? 'Use a short headline (5–10 words). Good titles make exports and dashboards scan-friendly.'
                    : undefined
                }
                error={errors.title?.message?.toString()}
                placeholder="Supply chain disruption"
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-3 text-sm focus:ring-brand-primary/30"
                autoFocus
                {...titleField}
              />
              <Controller
                name="category"
                control={control}
                  defaultValue={categories[0] ?? 'Operational'}
                  rules={{ required: 'Select a category.' }}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Select
                        label="Category *"
                        helperText="Use broad buckets for reporting and filtering."
                        tooltip={
                          showTooltips
                            ? 'Categories help sort and filter the register for reporting (e.g. Security, Compliance, Operational).'
                            : undefined
                        }
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

                    {onAddCategory && !isAddingCategory && (
                      <div className="flex items-center justify-end">
                        <Button type="button" size="sm" variant="ghost" onClick={handleStartAddCategory}>
                          Add category
                        </Button>
                      </div>
                    )}

                    {onAddCategory && isAddingCategory && (
                      <div className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3">
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                          <Input
                            label="New category"
                            value={newCategory}
                            onChange={(event) => {
                              setNewCategory(event.target.value)
                              setNewCategoryError(null)
                            }}
                            error={newCategoryError ?? undefined}
                            placeholder="e.g. Third-party, Privacy, Finance"
                            className="rounded-xl border-border-faint bg-surface-primary/70 px-4 py-3 text-sm focus:ring-brand-primary/30"
                          />
                          <Button type="button" size="sm" onClick={handleConfirmAddCategory}>
                            Add
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={handleCancelAddCategory}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

            <Controller
              name="threatType"
              control={control}
              defaultValue="other"
              render={({ field }) => (
                <Select
                  label="Threat type (optional)"
                  helperText="Used for cyber-focused filtering and reporting."
                  tooltip={
                    showTooltips
                      ? 'Threat type is a cyber lens for filtering and reporting (e.g. phishing, ransomware, data breach).'
                      : undefined
                  }
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

            <Textarea
              label="Description *"
              error={errors.description?.message?.toString()}
              helperText="Capture context, trigger, and business impact in 2-3 sentences."
              tooltip={
                showTooltips
                  ? 'Include the likely cause, what could go wrong, and the business impact. This helps reviewers understand why the score matters.'
                  : undefined
              }
              placeholder="Describe the risk context and impact..."
              rows={3}
              className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-3 text-sm focus:ring-brand-primary/30"
              {...descriptionField}
            />

              <div className="grid gap-3 md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]">
                <Controller
                  name="status"
                  control={control}
                  defaultValue="open"
                rules={{ required: 'Select a status.' }}
                render={({ field }) => (
                   <Select
                     label="Status *"
                     helperText="Keep open risks actionable; close only when resolved."
                     tooltip={
                       showTooltips
                         ? 'Status is for governance: Open = active work, Accepted = explicitly tolerated, Mitigated = controls in place, Closed = no longer relevant.'
                         : undefined
                     }
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
                <div className="flex items-center rounded-2xl border border-dashed border-border-faint bg-surface-secondary/20 px-4 py-3 text-[11px] text-text-low">
                  Likelihood x Impact updates instantly so you can gauge severity before committing changes.
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-text-high">
                    <span className="flex items-center gap-2">
                      <span>Likelihood *</span>
                      {showTooltips ? (
                        <Tooltip
                          content="Likelihood is how probable the scenario is over your chosen time window (e.g. next 12 months). Use incident history and control strength."
                          ariaLabel="Help: Likelihood"
                        />
                      ) : null}
                    </span>
                    <span className="rounded-full bg-surface-secondary/30 px-3 py-0.5 text-[11px] font-semibold text-text-high">
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
                    className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-brand-primary/20 via-brand-primary/10 to-brand-primary/5 accent-brand-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/25"
                    aria-label="Likelihood (1-5)"
                    aria-describedby="likelihood-help"
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={probability}
                    aria-valuetext={`${probability} of 5`}
                  />
                  <p id="likelihood-help" className="mt-2 text-[11px] text-text-low">
                    Estimate likelihood from 1 (rare) to 5 (almost certain).
                  </p>
                </div>

                <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-text-high">
                    <span className="flex items-center gap-2">
                      <span>Impact *</span>
                      {showTooltips ? (
                        <Tooltip
                          content="Impact is the severity if the risk occurs (financial, operational, legal, reputation). Use worst credible outcome, not average."
                          ariaLabel="Help: Impact"
                        />
                      ) : null}
                    </span>
                    <span className="rounded-full bg-surface-secondary/30 px-3 py-0.5 text-[11px] font-semibold text-text-high">
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
                    className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-status-danger/20 via-status-danger/10 to-status-danger/5 accent-status-danger focus:outline-none focus-visible:ring-4 focus-visible:ring-status-danger/25"
                    aria-label="Impact (1-5)"
                    aria-describedby="impact-help"
                    aria-valuemin={1}
                    aria-valuemax={5}
                    aria-valuenow={impact}
                    aria-valuetext={`${impact} of 5`}
                  />
                  <p id="impact-help" className="mt-2 text-[11px] text-text-low">
                    Gauge downstream effect from 1 (minimal) to 5 (critical).
                  </p>
                </div>
              </div>
            </section>

          <section className="flex flex-col gap-3 rounded-[20px] border border-border-faint/60 bg-gradient-to-b from-surface-primary/90 to-surface-secondary/20 p-4 shadow-[0_28px_56px_rgba(15,23,42,0.08)]">
            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-4 shadow-sm">
              <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                Details (optional)
              </summary>
              <div className="mt-3 space-y-3">
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
                              required: 'Describe the step (e.g., “Enable MFA for admin accounts”).',
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

            <details className="rounded-2xl bg-surface-secondary/10 p-4">
              <summary className="cursor-pointer select-none rounded-xl text-sm font-semibold text-text-high focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20">
                Incident response playbook (optional)
              </summary>

              <div className="mt-3 space-y-3">
                {!playbookEnabled ? (
                  <div className="space-y-3">
                    <label className="space-y-1">
                      <span className="block text-xs font-semibold text-text-low">Template</span>
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
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-text-low">
                        Playbooks are editable checklists you can use during an incident. Forgotten passphrase = data loss if encryption is enabled.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
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
                        Add playbook
                      </Button>
                    </div>
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

            <aside
              className={cn(
                'flex h-full flex-col gap-3 rounded-[18px] border bg-surface-primary p-4 text-text-high shadow-sm',
                severityMeta.cardTone,
              )}
              aria-label="Live score"
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-low">
                  Live score
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold" aria-label={`Risk score: ${riskScore}`}>
                      {riskScore}
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-3 py-0.5 text-xs font-semibold',
                        severityMeta.pillTone,
                      )}
                      aria-label={`Risk severity: ${severityMeta.label.toUpperCase()}`}
                    >
                      {severityMeta.label.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-text-low">
                    <span className="rounded-full border border-border-faint/70 bg-surface-primary/70 px-3 py-1">
                      Likelihood: <span className="text-text-high">{probability}/5</span>
                    </span>
                    <span className="rounded-full border border-border-faint/70 bg-surface-primary/70 px-3 py-1">
                      Impact: <span className="text-text-high">{impact}/5</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-low">
                  {severityMeta.why}{' '}
                  <span className="font-semibold text-text-high">
                    {riskScore} = {probability}×{impact}
                  </span>
                  .
                </p>
              </div>

              <div className="mt-auto rounded-2xl border border-border-faint/60 bg-surface-primary/70 p-3 text-xs text-text-low">
                <p className="font-semibold text-text-high">Recommended next step</p>
                <p className="mt-1">{severityMeta.nudge}</p>
              </div>
            </aside>

          </section>
        </div>
      </div>

      {showActions ? (
        <div className="-mx-1 mt-6 border-t border-border-faint/70 bg-surface-primary px-1 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] pt-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
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
          {isPrimaryDisabled ? (
            <p id="risk-form-submit-help" className="mt-2 text-xs text-text-low" aria-live="polite">
              {missingRequiredFields.length
                ? `Complete required fields: ${missingRequiredFields.join(', ')}.`
                : 'Complete required fields marked * to enable submission.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  )
})

RiskForm.displayName = 'RiskForm'
