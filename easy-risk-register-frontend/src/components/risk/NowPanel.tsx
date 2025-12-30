import { cn } from '../../utils/cn'

export type NowPanelItem = {
  id: 'overdue_reviews' | 'due_soon' | 'high_risks' | 'recently_changed'
  label: string
  value: number
  description: string
  accent?: 'brand' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  onClick?: () => void
}

const accentStyles = {
  brand: 'text-brand-primary',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
}

export function NowPanel({ items }: { items: NowPanelItem[] }) {
  if (!items.length) return null

  return (
    <div className="rr-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-high">Now</p>
          <p className="mt-1 text-xs text-text-low">Quick shortcuts to what needs attention.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const accent = item.accent ?? 'brand'
          const clickable = Boolean(item.onClick) && !item.disabled
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              disabled={!clickable}
              aria-disabled={!clickable}
              className={cn(
                'flex h-full min-h-[140px] flex-col justify-between rounded-2xl border border-border-faint bg-gradient-to-br from-surface-primary to-surface-secondary/60 p-5 text-left shadow-sm transition',
                clickable
                  ? 'hover:border-brand-primary/40 hover:bg-brand-primary-light/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20'
                  : 'opacity-80',
              )}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-low">
                  {item.label}
                </p>
                <p className={cn('mt-3 text-3xl font-semibold text-text-high', accentStyles[accent])}>
                  {item.value}
                </p>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-text-low">{item.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

