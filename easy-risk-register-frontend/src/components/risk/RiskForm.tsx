import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import type { RiskInput, RiskStatus } from '../../types/risk'
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations'
import { Button, Input, Select, Textarea } from '../../design-system'
import { cn } from '../../utils/cn'

export type RiskFormValues = RiskInput & { status: RiskStatus }

interface RiskFormProps {
  categories: string[]
  defaultValues?: Partial<RiskFormValues>
  mode?: 'create' | 'edit'
  onSubmit: (values: RiskFormValues) => void
  onCancel?: () => void
  className?: string
}

export const RiskForm = ({
  categories,
  defaultValues,
  mode = 'create',
  onSubmit,
  onCancel,
  className,
}: RiskFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
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
      ...defaultValues,
    },
  })

  const { probability = 3, impact = 3 } = watch()
  const riskScore = calculateRiskScore(probability, impact)
  const severity = getRiskSeverity(riskScore)

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
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className={cn('flex h-full min-h-full flex-col gap-4', className)}
      noValidate
    >
      <div className="flex flex-1 flex-col gap-4 pb-1">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="space-y-4 rounded-[20px] border border-border-faint/70 bg-surface-primary/95 p-4 shadow-[0_28px_56px_rgba(15,23,42,0.08)]">
            <div className="grid gap-2.5 md:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
              <Input
                label="Title"
                helperText="Keep it sharp so execs can scan quickly."
                error={errors.title?.message?.toString()}
                placeholder="Supply chain disruption"
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-2.5 text-sm focus:ring-brand-primary/30"
                {...register('title', { required: 'Title is required' })}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              <Controller
                name="category"
                control={control}
                defaultValue={categories[0] ?? 'Operational'}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <Select
                    label="Category"
                    error={errors.category?.message?.toString()}
                    options={categories.map(category => ({
                      value: category,
                      label: category,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    placeholder="Select a category"
                    aria-describedby={errors.category ? 'category-error' : undefined}
                  />
                )}
              />
            </div>

            <Textarea
              label="Description"
              error={errors.description?.message?.toString()}
              helperText="Capture context, trigger, and business impact in 2-3 sentences."
              placeholder="Describe the risk context and impact..."
              rows={3}
              className="rounded-xl border-border-faint bg-surface-secondary/10 px-4 py-2.5 text-sm focus:ring-brand-primary/30"
              {...register('description', { required: 'Description is required' })}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />

            <div className="grid gap-2.5 md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)]">
              <Controller
                name="status"
                control={control}
                defaultValue="open"
                rules={{ required: 'Status is required' }}
                render={({ field }) => (
                  <Select
                    label="Status"
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
                    aria-describedby={errors.status ? 'status-error' : undefined}
                  />
                )}
              />
              <div className="flex items-center rounded-2xl border border-dashed border-border-faint bg-surface-secondary/20 px-3.5 py-2.5 text-[11px] text-text-low">
                Probability x Impact updates instantly so you can gauge severity before committing changes.
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-[20px] border border-border-faint/60 bg-gradient-to-b from-surface-primary/90 to-surface-secondary/20 p-4 shadow-[0_28px_56px_rgba(15,23,42,0.08)]">
            <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
              <Textarea
                label="Mitigation plan"
                placeholder="Outline mitigation actions, owners, or milestones..."
                helperText="Optional, but it keeps downstream owners aligned."
                rows={2}
                className="rounded-xl border-border-faint bg-surface-secondary/10 px-3.5 py-2 text-sm focus:ring-brand-primary/30"
                {...register('mitigationPlan')}
              />
            </div>

            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,0.45fr)]">
              <div className="space-y-3">
                <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-text-high">
                    <span>Probability</span>
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
                    aria-label="Probability (1-5)"
                    aria-describedby="probability-help"
                  />
                  <p id="probability-help" className="mt-1.5 text-[11px] text-text-low">
                    Estimate likelihood from 1 (rare) to 5 (almost certain).
                  </p>
                </div>

                <div className="rounded-[18px] border border-border-faint bg-surface-primary/95 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-medium text-text-high">
                    <span>Impact</span>
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
                    Probability x Impact refresh with every adjustment so you always see the latest severity.
                  </p>
                </div>
                <dl className="space-y-1.5 pt-2.5 text-xs text-text-low">
                  <div className="flex justify-between">
                    <dt className="font-semibold text-text-high">Probability</dt>
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
