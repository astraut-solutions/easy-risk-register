import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  description?: string
  accent?: 'brand' | 'success' | 'warning' | 'danger'
  icon?: ReactNode
  className?: string
}

const accentStyles = {
  brand: 'text-brand-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
}

export const StatCard = ({
  label,
  value,
  description,
  accent = 'brand',
  icon,
  className,
  ...props
}: StatCardProps) => (
  <div
    className={cn(
      'rounded-2xl border border-border-faint bg-gradient-to-br from-surface-primary to-surface-secondary/60 p-6 shadow-card-soft',
      className,
    )}
    {...props}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-low">{label}</p>
        <p className={cn('mt-3 text-3xl font-semibold text-text-high', accentStyles[accent])}>
          {value}
        </p>
      </div>
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
          {icon}
        </div>
      )}
    </div>
    {description && <p className="mt-2 text-sm text-text-low">{description}</p>}
  </div>
)

export default StatCard
