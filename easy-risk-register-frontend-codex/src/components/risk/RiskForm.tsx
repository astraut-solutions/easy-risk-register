import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import type { RiskInput, RiskStatus } from '../../types/risk'
import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations'
import { riskSeverityPalette } from '../../stores/riskStore'
import { Button } from '../../design-system'

export type RiskFormValues = RiskInput & { status: RiskStatus }

interface RiskFormProps {
  categories: string[]
  defaultValues?: Partial<RiskFormValues>
  mode?: 'create' | 'edit'
  onSubmit: (values: RiskFormValues) => void
  onCancel?: () => void
}

export const RiskForm = ({
  categories,
  defaultValues,
  mode = 'create',
  onSubmit,
  onCancel,
}: RiskFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
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

  const probability = watch('probability')
  const impact = watch('impact')
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
    <form onSubmit={handleSubmit(onFormSubmit)} className="rr-panel space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-text-high">
            {mode === 'create' ? 'Create new risk' : 'Update risk'}
          </h2>
          <p className="text-sm text-text-low">
            Provide details to calculate probability-impact scores in real time.
          </p>
        </div>
        <div
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${riskSeverityPalette[severity]}`}
        >
          Score {riskScore} x {severity.toUpperCase()}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="rr-label">Title</span>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            placeholder="Risk summary"
            className="rr-input"
          />
          {errors.title && (
            <span className="text-xs text-status-danger">{errors.title.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className="rr-label">Category</span>
          <select
            {...register('category', { required: 'Category is required' })}
            className="rr-select"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="rr-label">Description</span>
        <textarea
          rows={3}
          {...register('description', { required: 'Description is required' })}
          className="rr-textarea"
          placeholder="Describe the risk context and impact..."
        />
        {errors.description && (
          <span className="text-xs text-status-danger">{errors.description.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="rr-label">Mitigation plan</span>
        <textarea
          rows={2}
          {...register('mitigationPlan')}
          className="rr-textarea"
          placeholder="Outline mitigation actions, owners, or milestones..."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-3">
          <span className="rr-label">Probability ({probability})</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            {...register('probability', {
              required: true,
              valueAsNumber: true,
            })}
            className="w-full accent-brand-primary"
          />
        </label>

        <label className="flex flex-col gap-3">
          <span className="rr-label">Impact ({impact})</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            {...register('impact', {
              required: true,
              valueAsNumber: true,
            })}
            className="w-full accent-status-danger"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="rr-label">Status</span>
          <select {...register('status', { required: true })} className="rr-select">
            <option value="open">Open</option>
            <option value="mitigated">Mitigated</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-secondary p-4 text-sm text-text-low">
          Probability x Impact updates live to help you prioritize and visualize each risk before
          saving changes.
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {mode === 'edit' && onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Add risk' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
