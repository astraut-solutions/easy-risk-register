import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface SectionHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...props
}: SectionHeaderProps) => (
  <header
    className={cn('flex flex-col gap-4 text-text-mid md:flex-row md:items-center', className)}
    {...props}
  >
    <div className="flex-1 space-y-3">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">
          {eyebrow}
        </p>
      )}
      <div>
        <h1 className="text-3xl font-semibold text-text-high">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-base text-text-low">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
)

export default SectionHeader
