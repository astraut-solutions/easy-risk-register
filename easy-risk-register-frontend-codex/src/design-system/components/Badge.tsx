import type { HTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  subtle?: boolean
}

const toneStyles: Record<BadgeTone, { solid: string; subtle: string }> = {
  neutral: {
    solid: 'bg-text-mid text-white',
    subtle: 'border border-border-subtle bg-surface-secondary text-text-mid',
  },
  success: {
    solid: 'bg-status-success text-white',
    subtle: 'border border-status-success/30 bg-status-success/10 text-status-success',
  },
  warning: {
    solid: 'bg-status-warning text-white',
    subtle: 'border border-status-warning/30 bg-status-warning/10 text-status-warning',
  },
  danger: {
    solid: 'bg-status-danger text-white',
    subtle: 'border border-status-danger/30 bg-status-danger/10 text-status-danger',
  },
  info: {
    solid: 'bg-status-info text-white',
    subtle: 'border border-status-info/30 bg-status-info/10 text-status-info',
  },
  brand: {
    solid: 'bg-brand-primary text-white',
    subtle: 'border border-brand-primary/40 bg-brand-primary-light text-brand-primary',
  },
}

export const Badge = ({ className, tone = 'neutral', subtle = true, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
      subtle ? toneStyles[tone].subtle : toneStyles[tone].solid,
      className,
    )}
    {...props}
  />
)

export default Badge
