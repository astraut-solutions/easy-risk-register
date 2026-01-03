import { cn } from '../utils/cn'
import type { EncryptionStatus } from '../utils/encryptionManager'

interface TrustStripProps {
  isOnline: boolean
  readOnlyMode: boolean
  readOnlyReason?: string | null
  workspaceLabel: string
  encryptionStatus: EncryptionStatus
}

const indicatorClass = (tone: 'success' | 'warning' | 'danger') =>
  cn(
    'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
    tone === 'success' && 'border-status-success/40 text-text-high',
    tone === 'warning' && 'border-status-warning/40 text-brand-primary',
    tone === 'danger' && 'border-status-danger/40 text-status-danger',
  )

const getOnlineTone = (isOnline: boolean, readOnlyMode: boolean) => {
  if (!isOnline) return 'danger'
  if (readOnlyMode) return 'warning'
  return 'success'
}

const getEncryptionTone = (status: EncryptionStatus) => {
  if (!status.available) return 'danger'
  if (!status.enabled) return 'warning'
  return status.unlocked ? 'success' : 'warning'
}

const OnlineIndicator = ({
  isOnline,
  readOnlyMode,
  readOnlyReason,
}: {
  isOnline: boolean
  readOnlyMode: boolean
  readOnlyReason?: string | null
}) => {
  const tone = getOnlineTone(isOnline, readOnlyMode)
  const label = isOnline ? (readOnlyMode ? 'Read-only' : 'Online') : 'Offline'
  const hint = !isOnline
    ? 'Offline (reconnect to save changes).'
    : readOnlyMode
      ? readOnlyReason ?? 'Read-only mode is active.'
      : 'Changes save immediately.'

  return (
    <span className={indicatorClass(tone)} title={hint} role="status" aria-live="polite">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          tone === 'success' && 'bg-status-success',
          tone === 'warning' && 'bg-status-warning',
          tone === 'danger' && 'bg-status-danger',
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

const WorkspaceIndicator = ({ label }: { label: string }) => (
  <span className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-secondary/60 px-3 py-1 text-xs font-semibold text-text-high">
    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-primary" />
    {label}
  </span>
)

const EncryptionIndicator = ({ status }: { status: EncryptionStatus }) => {
  const tone = getEncryptionTone(status)
  const label = !status.available
    ? 'Encryption unavailable'
    : !status.enabled
      ? 'Encryption off'
      : status.unlocked
        ? 'Encryption unlocked'
        : 'Encryption locked'
  const hint = !status.available
    ? 'Your browser does not support the Web Crypto APIs required for local encryption.'
    : !status.enabled
      ? 'Encryption is disabled. Enable it in Settings > Privacy.'
      : status.unlocked
        ? 'Encrypted fields can be read and edited.'
        : 'Encrypted fields are locked until you unlock encryption.'

  return (
    <span
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        tone === 'success' && 'border-status-success/40 text-text-high',
        tone === 'warning' && 'border-status-warning/40 text-brand-primary',
        tone === 'danger' && 'border-status-danger/40 text-status-danger',
      )}
      title={hint}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          tone === 'success' && 'bg-status-success',
          tone === 'warning' && 'bg-status-warning',
          tone === 'danger' && 'bg-status-danger',
        )}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

export const TrustStrip = ({
  isOnline,
  readOnlyMode,
  readOnlyReason,
  workspaceLabel,
  encryptionStatus,
}: TrustStripProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-text-low">
      <OnlineIndicator isOnline={isOnline} readOnlyMode={readOnlyMode} readOnlyReason={readOnlyReason} />
      <WorkspaceIndicator label={`Workspace: ${workspaceLabel}`} />
      <EncryptionIndicator status={encryptionStatus} />
    </div>
  )
}

export default TrustStrip
