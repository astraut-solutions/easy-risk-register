import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '../../utils/cn'

export type ToastVariant = 'success' | 'info' | 'warning' | 'danger'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type Toast = Required<Omit<ToastInput, 'description'>> & {
  id: string
  description?: string
}

type ToastContextValue = {
  notify: (input: ToastInput) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 6000

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-status-success/40 bg-status-success/10 text-status-success',
  info: 'border-status-info/40 bg-status-info/10 text-status-info',
  warning: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
  danger: 'border-status-danger/40 bg-status-danger/10 text-status-danger',
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)
  const timersRef = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (input: ToastInput) => {
      const id = `toast-${Date.now()}-${counterRef.current++}`
      const toast: Toast = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? 'info',
        durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
      }

      setToasts((current) => [toast, ...current].slice(0, 3))

      const timer = window.setTimeout(() => dismiss(id), toast.durationMs)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'rr-panel flex items-start justify-between gap-3 border p-4 shadow-card-strong',
              variantStyles[toast.variant],
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-high">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs text-text-mid">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-xs font-semibold text-text-mid transition hover:bg-surface-tertiary"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
