import { cn } from '../../utils/cn'
import { useAuthStore } from '../../stores/authStore'

export type SidebarNavItem = {
  id: string
  label: string
  description: string
}

interface DashboardSidebarProps {
  items: SidebarNavItem[]
  activeItem: string
  onSelect: (id: string) => void
  onSettings: () => void
}

export const DashboardSidebar = ({
  items,
  activeItem,
  onSelect,
  onSettings,
}: DashboardSidebarProps) => {
  const authStatus = useAuthStore((s) => s.status)
  const workspaceName = useAuthStore((s) => s.workspaceName)
  const workspaceLabel =
    authStatus === 'authenticated' ? (workspaceName || 'Personal') : 'Personal (local)'

  return (
    <aside
      className="hidden shrink-0 lg:flex lg:w-72 lg:flex-none xl:w-80"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="rr-panel sticky top-6 flex h-fit min-h-[480px] w-full flex-col gap-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-low">
            Workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-high">{workspaceLabel}</h2>
          <p className="mt-1 text-sm text-text-low">
            {authStatus === 'authenticated' ? 'Signed in' : 'Local-only until you sign in'}
          </p>
        </div>

        <nav className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive = item.id === activeItem
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left transition hover:border-brand-primary/60 hover:bg-brand-primary-light/50 relative',
                  isActive
                    ? 'border-brand-primary bg-brand-primary-light/60 shadow-card-soft'
                    : 'border-border-subtle bg-surface-secondary',
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label} ${isActive ? '(current page)' : ''}`}
              >
                <p
                  className={cn(
                    'text-base font-semibold text-text-high',
                    isActive && 'text-brand-primary',
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-text-low">{item.description}</p>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <button
            type="button"
            onClick={onSettings}
            className="rounded-2xl border border-border-subtle bg-surface-secondary px-4 py-3 text-left text-sm font-semibold text-text-high transition hover:border-brand-primary/60 hover:bg-brand-primary-light/50"
            aria-label="Open settings"
          >
            Settings
          </button>
        </div>
      </div>
    </aside>
  )
}

export default DashboardSidebar

