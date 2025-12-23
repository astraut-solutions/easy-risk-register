import { forwardRef, useEffect, useId } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '../../utils/cn'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  description?: string
  headerAside?: ReactNode
  footer?: ReactNode
  footerClassName?: string
  size?: 'xsm' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  children?: ReactNode
}

const sizeClasses: Record<Required<ModalProps>['size'], string> = {
  xsm: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-[720px]',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      eyebrow,
      description,
      headerAside,
      footer,
      footerClassName,
      size = 'sm',
      children,
      className,
    },
    ref,
  ) => {
    const titleId = useId()
    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }

    useEffect(() => {
      if (!isOpen) return

      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.body.style.overflow = previousOverflow
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [isOpen, onClose])

    const isFullScreenSheet = size === 'full'

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 z-50 flex overflow-hidden bg-black/45 backdrop-blur-sm',
              isFullScreenSheet ? 'items-stretch justify-stretch p-0 sm:items-center sm:justify-center sm:p-8' : 'items-center justify-center p-4 sm:p-8',
            )}
            onClick={handleBackdropClick}
          >
            <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 32, opacity: 0 }}
              className={cn(
                'relative z-10 flex w-full flex-col overflow-hidden border border-border-subtle/60 bg-surface-primary shadow-[0px_18px_55px_rgba(15,23,42,0.28)]',
                isFullScreenSheet
                  ? 'h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[95vh] sm:rounded-[32px]'
                  : 'max-h-[95vh] rounded-[32px]',
                sizeClasses[size],
                className,
              )}
              ref={ref}
            >

              {title && (
                <div className="flex flex-col gap-3 border-b border-border-faint/70 bg-surface-secondary/15 px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      {eyebrow && (
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-low">
                          {eyebrow}
                        </p>
                      )}
                      <h3 id={titleId} className="text-xl font-semibold leading-snug text-text-high">
                        {title}
                      </h3>
                      {description && <p className="text-sm text-text-low">{description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {headerAside}
                      <span className="rounded-full border border-border-faint/60 bg-surface-primary/80 px-2.5 py-1 text-[11px] font-semibold text-text-low">
                        Esc
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="rounded-full border border-border-faint/60 px-3 py-1 text-text-low"
                      >
                        <span className="sr-only">Close</span>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          aria-hidden="true"
                        >
                          <path
                            d="M6 6l8 8M14 6l-8 8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 pt-3">
                {children}
              </div>
              {footer ? (
                <div
                  className={cn(
                    'border-t border-border-faint/70 bg-surface-primary/95 px-5 py-4',
                    footerClassName,
                  )}
                >
                  {footer}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
)

Modal.displayName = 'Modal'

export default Modal
