import { Button } from '../../design-system'

export interface ReminderBannerProps {
  overdue: number
  dueSoon: number
  onView: () => void
  onSnooze: (days: number) => void
  onDisable: () => void
}

export const ReminderBanner = ({ overdue, dueSoon, onView, onSnooze, onDisable }: ReminderBannerProps) => {
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
          <Button size="sm" variant="ghost" onClick={() => onSnooze(1)} aria-label="Snooze reminders for 1 day">
            Snooze 1 day
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSnooze(7)} aria-label="Snooze reminders for 7 days">
            Snooze 1 week
          </Button>
          <Button size="sm" variant="ghost" onClick={onDisable} aria-label="Disable reminders">
            Disable
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReminderBanner

