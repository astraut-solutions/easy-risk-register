import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { nanoid } from 'nanoid'

import type { RiskInput, RiskStatus, ReviewCadence, RiskResponse } from '../../types/risk'
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations'
import { Button, Input, Select, Textarea } from '../../design-system'
import { cn } from '../../utils/cn'

export type RiskFormValues = RiskInput & { status: RiskStatus }

interface RiskFormProps {
  categories: string[]
  defaultValues?: Partial<RiskFormValues>
  mode?: 'create' | 'edit'
  onSubmit: (values: RiskFormValues) => void
  onAddCategory?: (category: string) => void
  onCancel?: () => void
  className?: string
}

export const RiskForm = ({
  categories,
  defaultValues,
  mode = 'create',
  onSubmit,
  onAddCategory,
  onCancel,
  className,
}: RiskFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RiskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      probability: 3,
      impact: 3,
      category: categories[0] ?? 'Operational',
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
      ...defaultValues,
    },
  })

  const { probability = 3, impact = 3 } = watch()
  const riskScore = calculateRiskScore(probability, impact)
  const severity = getRiskSeverity(riskScore)

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
      })
    }
  }, [categories, defaultValues, reset])

  const onFormSubmit = (values: RiskFormValues) => {
    onSubmit({
      ...values,
      probability: Number(values.probability),
      impact: Number(values.impact),
    })

    if (mode === 'create') {
      reset({
        title: '',
        description: '',
        probability: 3,
        impact: 3,
        category: categories[0] ?? 'Operational',
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
      })
    }
  }

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

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
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

            <div className="grid gap-2.5 md:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <Input
                label="Title *"
                helperText="Keep it sharp so execs can scan quickly."
                error={errors.title?.message?.toString()}
                placeholder="Supply chain disruption"
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-2.5 text-sm focus:ring-brand-primary/30"
                {...register('title', { required: 'Title is required' })}
              />
              <Controller
                name="category"
                control={control}
                defaultValue={categories[0] ?? 'Operational'}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Select
                      label="Category *"
                      helperText="Use broad buckets for reporting and filtering."
                      error={errors.category?.message?.toString()}
                      options={categories.map((category) => ({
                        value: category,
                        label: category,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
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
                        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                          <Input
                            label="New category"
                            value={newCategory}
                            onChange={(event) => {
                              setNewCategory(event.target.value)
                              setNewCategoryError(null)
                            }}
                            error={newCategoryError ?? undefined}
                            placeholder="e.g. Third-party, Privacy, Finance"
                            className="rounded-xl border-border-faint bg-surface-primary/70 px-4 py-2.5 text-sm focus:ring-brand-primary/30"
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

            <Textarea
              label="Description *"
              error={errors.description?.message?.toString()}
              helperText="Capture context, trigger, and business impact in 2-3 sentences."
              placeholder="Describe the risk context and impact..."
              rows={3}
              className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-2.5 text-sm focus:ring-brand-primary/30"
              {...register('description', { required: 'Description is required' })}
            />

            <div className="grid gap-2.5 md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]">
              <Controller
                name="status"
                control={control}
                defaultValue="open"
                rules={{ required: 'Status is required' }}
                render={({ field }) => (
                  <Select
                    label="Status *"
                    helperText="Keep open risks actionable; close only when resolved."
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
                  />
                )}
              />
              <div className="flex items-center rounded-2xl border border-dashed border-border-faint bg-surface-secondary/20 px-3.5 py-2.5 text-[11px] text-text-low">
                Likelihood x Impact updates instantly so you can gauge severity before committing changes.
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-[20px] border border-border-faint/60 bg-gradient-to-b from-surface-primary/90 to-surface-secondary/20 p-4 shadow-[0_28px_56px_rgba(15,23,42,0.08)]">
            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Details (optional)
              </summary>
              <div className="mt-3 space-y-3">
            <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <Textarea
                label="Mitigation plan"
                placeholder="Outline mitigation actions, owners, or milestones..."
                helperText="Optional. Keeps downstream owners aligned."
                rows={2}
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-3.5 py-2 text-sm focus:ring-brand-primary/30"
                {...register('mitigationPlan')}
              />
            </div>

            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Accountability
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  label="Owner"
                  helperText="Optional. Who is accountable for next actions."
                  placeholder="Name or role (e.g. SecOps lead)"
                  {...register('owner')}
                />
                <Input
                  label="Owner team"
                  helperText="Optional. Helps routing and reporting."
                  placeholder="Team (optional)"
                  {...register('ownerTeam')}
                />
                <Input
                  type="date"
                  label="Due date"
                  helperText="Optional. Target date for mitigation or decision."
                  {...register('dueDate')}
                />
              </div>
            </details>

            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Review cadence
              </summary>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  type="date"
                  label="Next review date"
                  helperText="Optional. Set a concrete date for the next review."
                  {...register('reviewDate')}
                />
                <Controller
                  name="reviewCadence"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Cadence"
                      helperText="Optional. How often this risk should be reviewed."
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

            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Responses
              </summary>
              <div className="mt-3 grid gap-3">
                <Controller
                  name="riskResponse"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Response"
                      helperText="Optional. Choose a default response strategy."
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
                  label="Owner response"
                  helperText="Optional. One sentence capturing the owner's stance."
                  rows={2}
                  placeholder="Short owner response (optional)"
                  {...register('ownerResponse')}
                />
                <Textarea
                  label="Security advisor comment"
                  helperText="Optional. Note security guidance or constraints."
                  rows={2}
                  placeholder="Short security advisor comment (optional)"
                  {...register('securityAdvisorComment')}
                />
                <Textarea
                  label="Vendor response"
                  helperText="Optional. Record vendor confirmation or commitments."
                  rows={2}
                  placeholder="Short vendor response (optional)"
                  {...register('vendorResponse')}
                />
              </div>
            </details>

            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Evidence
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
                    <div
                      key={(field as any)._key}
                      className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3"
                    >
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
                          label="URL"
                          placeholder="https://..."
                          error={
                            (errors.evidence as any)?.[index]?.url?.message?.toString()
                          }
                          {...register(`${base}.url`, {
                            required: 'URL is required.',
                            validate: (value) =>
                              isValidHttpUrl(String(value)) || 'Enter a valid http(s) URL.',
                          })}
                        />
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                        <Input
                          label="Description"
                          helperText="Optional. Add context so reviewers know why this link matters."
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

            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Mitigation steps
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
                    <div
                      key={(field as any)._key}
                      className="rounded-2xl border border-border-faint bg-surface-secondary/10 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                        <div className="pt-8">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-primary"
                            aria-label="Mark step done"
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
                            label="Step"
                            helperText="Required for each step. Keep it short and actionable."
                            placeholder="Describe the mitigation action"
                            error={stepErrors?.description?.message?.toString()}
                            {...register(`${base}.description`, {
                              required: 'Step description is required.',
                            })}
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <Input
                              label="Owner"
                              helperText="Optional. Who will execute this step."
                              placeholder="Who owns this step?"
                              {...register(`${base}.owner`)}
                            />
                            <Input
                              type="date"
                              label="Due date"
                              helperText="Optional. Target completion date."
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

            <details className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-high">
                Notes
              </summary>
              <div className="mt-3">
                <Textarea
                  label="Notes"
                  helperText="Optional. Use for audit context, assumptions, or decision rationale."
                  rows={3}
                  placeholder="Optional long-form notes"
                  {...register('notes')}
                />
              </div>
            </details>
              </div>
            </details>

            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,0.45fr)]">
              <div className="space-y-3">
                <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-text-high">
                    <span>Likelihood *</span>
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
                  />
                  <p id="likelihood-help" className="mt-1.5 text-[11px] text-text-low">
                    Estimate likelihood from 1 (rare) to 5 (almost certain).
                  </p>
                </div>

                <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-text-high">
                    <span>Impact *</span>
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
                  />
                  <p id="impact-help" className="mt-1.5 text-[11px] text-text-low">
                    Gauge downstream effect from 1 (minimal) to 5 (critical).
                  </p>
                </div>
              </div>

              <aside className="flex h-full flex-col justify-between rounded-[18px] border border-border-subtle bg-surface-primary p-3.5 text-text-high shadow-sm">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-text-low">
                    Live score
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold" aria-label={`Risk score: ${riskScore}`}>
                      {riskScore}
                    </span>
                    <span
                      className="rounded-full border border-border-faint bg-surface-primary/90 px-3 py-0.5 text-xs font-semibold"
                      aria-label={`Risk severity: ${severity.toUpperCase()}`}
                    >
                      {severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-text-low">
                    Likelihood x Impact refresh with every adjustment so you always see the latest severity.
                  </p>
                </div>
                <dl className="space-y-1.5 pt-2.5 text-xs text-text-low">
                  <div className="flex justify-between">
                    <dt className="font-semibold text-text-high">Likelihood</dt>
                    <dd>
                      {probability} / 5 <span className="text-text-low">({probability * 20}%)</span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-semibold text-text-high">Impact</dt>
                    <dd>
                      {impact} / 5 <span className="text-text-low">({impact * 20}%)</span>
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
              {mode === 'edit' && onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  aria-label="Cancel editing"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6"
                aria-label={mode === 'create' ? 'Add new risk' : 'Save risk changes'}
              >
                {mode === 'create' ? 'Add risk' : 'Save changes'}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}
