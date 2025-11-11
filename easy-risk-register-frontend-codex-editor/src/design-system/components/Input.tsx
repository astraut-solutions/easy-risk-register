import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const hasError = Boolean(error)
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-high mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-high placeholder:text-text-low focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-status-danger focus:ring-status-danger/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !hasError && (
          <p className="mt-2 text-sm text-text-low">{helperText}</p>
        )}
        {error && (
          <p className="mt-2 text-sm text-status-danger">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input