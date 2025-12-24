import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'
import { Tooltip } from './Tooltip'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  tooltip?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = 'text', label, error, helperText, tooltip, id, name, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? name ?? generatedId
    const hasError = Boolean(error)
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label && (
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-text-high" htmlFor={inputId}>
              {label}
            </label>
            {tooltip ? <Tooltip content={tooltip} ariaLabel={`Help: ${label}`} /> : null}
          </div>
        )}
        <input
          type={type}
          id={inputId}
          name={name}
          className={cn(
            'w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-high placeholder:text-text-low focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-status-danger focus:ring-status-danger/20',
            className,
          )}
          ref={ref}
          aria-describedby={describedBy}
          aria-invalid={hasError}
          {...props}
        />
        {helperText && !hasError && (
          <p id={helperId} className="mt-2 text-sm text-text-low">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-2 text-sm text-status-danger">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
