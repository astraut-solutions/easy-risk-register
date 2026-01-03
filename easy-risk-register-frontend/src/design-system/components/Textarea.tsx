import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'
import { Tooltip } from './Tooltip'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  tooltip?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, tooltip, id, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id ?? props.name ?? generatedId
    const hasError = Boolean(error)
    const helperId = helperText ? `${textareaId}-helper` : undefined
    const errorId = error ? `${textareaId}-error` : undefined

    return (
      <div className="w-full">
        {label && (
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-text-high" htmlFor={textareaId}>
              {label}
            </label>
            {tooltip ? <Tooltip content={tooltip} ariaLabel={`Help: ${label}`} /> : null}
          </div>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-high placeholder:text-text-low focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
            hasError && 'border-status-danger focus:ring-status-danger/20',
            className
          )}
          ref={ref}
          aria-describedby={[helperId, errorId].filter(Boolean).join(' ') || undefined}
          aria-invalid={hasError}
          {...props}
        />
        {helperText && !hasError && (
          <p id={helperId} className="mt-2 text-sm text-text-low">{helperText}</p>
        )}
        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-status-danger"
            role="status"
            aria-live="assertive"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export default Textarea
