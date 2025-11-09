import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const baseStyles =
  'inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-card-strong/20',
  secondary:
    'border border-border-strong text-brand-primary hover:bg-brand-primary-light/40',
  ghost:
    'text-text-mid hover:text-text-high hover:bg-surface-tertiary border border-border-faint',
  destructive:
    'bg-status-danger text-white hover:bg-[#dc2626] focus-visible:ring-status-danger/20',
  subtle:
    'bg-surface-secondary text-text-high hover:bg-surface-tertiary border border-border-subtle',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 h-9',
  md: 'text-sm px-4 h-11',
  lg: 'text-base px-6 h-12',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], fullWidth && 'w-full', className)}
      {...props}
    />
  ),
)

Button.displayName = 'Button'

export default Button
