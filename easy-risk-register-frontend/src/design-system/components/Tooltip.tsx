import { useId, useState, type KeyboardEvent } from 'react'

import { cn } from '../../utils/cn'

export interface TooltipProps {
  content: string
  ariaLabel?: string
  className?: string
}

export const Tooltip = ({ content, ariaLabel, className }: TooltipProps) => {
  const tooltipId = useId()
  const [isOpen, setIsOpen] = useState(false)

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
    }
  }

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={ariaLabel ?? 'Show help'}
        aria-describedby={isOpen ? tooltipId : undefined}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full border border-border-faint bg-surface-primary text-[11px] font-semibold text-text-low',
          'hover:border-border-subtle hover:text-text-high',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20',
        )}
      >
        ?
      </button>

      {isOpen ? (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-border-faint bg-surface-primary p-3 text-xs text-text-mid shadow-[0_24px_48px_rgba(15,23,42,0.18)]',
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}

export default Tooltip

