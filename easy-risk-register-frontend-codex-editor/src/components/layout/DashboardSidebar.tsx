import { cn } from '../../utils/cn'

export type SidebarNavItem = {
  id: string
  label: string
  description: string
}

interface DashboardSidebarProps {
  items: SidebarNavItem[]
  activeItem: string
  onSelect: (id: string) => void
}

export const DashboardSidebar = ({
  items,
  activeItem,
  onSelect,
}: DashboardSidebarProps) => {
  return (
    <aside className="hidden lg:flex lg:w-72 xl:w-80">
      <div className="rr-panel sticky top-6 flex h-fit min-h-[480px] w-full flex-col gap-6 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-low">
            Workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-high">
            Risk cockpit
          </h2>
          <p className="mt-1 text-sm text-text-low">
            Navigate between the analytic overview and the structured
            spreadsheet view without endless scrolling.
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
                  'rounded-2xl border px-4 py-3 text-left transition hover:border-brand-primary/60 hover:bg-brand-primary-light/50',
                  isActive
                    ? 'border-brand-primary bg-brand-primary-light/60 shadow-card-soft'
                    : 'border-border-subtle bg-surface-secondary',
                )}
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

        <div className="mt-auto rounded-2xl border border-dashed border-border-subtle bg-surface-secondary/70 p-4 text-sm text-text-low">
          Tip: Use the New risk button in the header to open a focused modal.
          After saving, the modal closes automatically for a smoother workflow.
        </div>
      </div>
    </aside>
  )
}

export default DashboardSidebar
