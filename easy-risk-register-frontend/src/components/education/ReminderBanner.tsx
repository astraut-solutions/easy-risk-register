import { Button } from '../../design-system'

export interface ReminderBannerProps {
  overdue: number
  dueSoon: number
  onView: () => void
  onDismiss: () => void
}

export const ReminderBanner = ({ overdue, dueSoon, onView, onDismiss }: ReminderBannerProps) => {
  const message =
    overdue > 0
      ? `${overdue} risk${overdue === 1 ? '' : 's'} overdue for due/review dates.`
      : `${dueSoon} risk${dueSoon === 1 ? '' : 's'} coming due within 7 days.`

  return (
    <div
      className="rr-panel border border-status-warning/30 bg-status-warning/10 p-4"
      role="region"
      aria-label="Risk reminder"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-high">Reminder</p>
          <p className="mt-1 text-sm text-text-low">{message}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onView} aria-label="View risks">
            View risks
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss reminder">
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReminderBanner

