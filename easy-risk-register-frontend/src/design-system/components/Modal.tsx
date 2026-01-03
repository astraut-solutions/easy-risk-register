import { forwardRef, useCallback, useEffect, useId, useRef } from 'react'
import type { MutableRefObject, MouseEvent, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '../../utils/cn'
import { Button } from './Button'

const focusableSelectors = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

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
    const containerRef = useRef<HTMLDivElement | null>(null)
    const previouslyFocusedElement = useRef<HTMLElement | null>(null)
    const setContainerRef = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref],
    )
    const titleId = useId()
    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    }

    useEffect(() => {
      if (!isOpen) {
        return undefined
      }

      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      previouslyFocusedElement.current = document.activeElement as HTMLElement | null

      const getFocusableElements = () => {
        if (!containerRef.current) {
          return [] as HTMLElement[]
        }

        const nodes = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors),
        )

        return nodes.filter(
          (element) =>
            !element.closest('[aria-hidden="true"]') &&
            element.getAttribute('aria-hidden') !== 'true',
        )
      }

      const focusFirst = () => {
        const focusable = getFocusableElements()
        if (focusable.length) {
          focusable[0].focus()
        } else {
          containerRef.current?.focus()
        }
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          return
        }

        if (event.key !== 'Tab') {
          return
        }

        const focusable = getFocusableElements()
        if (!focusable.length) {
          event.preventDefault()
          return
        }

        const lastIndex = focusable.length - 1
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement)

        let nextIndex
        if (event.shiftKey) {
          nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1
        } else {
          nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1
        }

        focusable[nextIndex]?.focus()
        event.preventDefault()
      }

      focusFirst()
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.body.style.overflow = previousOverflow
        document.removeEventListener('keydown', handleKeyDown)
        previouslyFocusedElement.current?.focus?.()
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
              isFullScreenSheet
                ? 'items-stretch justify-stretch p-0 sm:items-center sm:justify-center sm:p-8'
                : 'items-center justify-center p-4 sm:p-8',
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
              tabIndex={-1}
              className={cn(
                'relative z-10 flex w-full flex-col overflow-hidden border border-border-subtle/60 bg-surface-primary shadow-[0px_18px_55px_rgba(15,23,42,0.28)]',
                isFullScreenSheet
                  ? 'h-[100dvh] max-h-[100dvh] rounded-none sm:h-auto sm:max-h-[95vh] sm:rounded-[32px]'
                  : 'max-h-[95vh] rounded-[32px]',
                sizeClasses[size],
                className,
              )}
              ref={setContainerRef}
            >
              {title && (
                <div className="flex flex-col gap-3 border-b border-border-faint/70 bg-surface-secondary/15 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
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
                    <div className="flex shrink-0 items-center gap-3">
                      {headerAside}
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
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 pt-3">{children}</div>
              {footer ? (
                <div
                  className={cn('border-t border-border-faint/70 bg-surface-primary/95 px-5 py-4', footerClassName)}
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
