import { useMemo, useState } from 'react'

import { Button, Input, Modal } from '../../design-system'
import { LOCAL_STORAGE_KEY } from '../../constants/risk'
import { useToast } from '../feedback/ToastProvider'
import { useRiskStore } from '../../stores/riskStore'
import {
  disablePassphraseEncryption,
  enablePassphraseEncryption,
  getEncryptionStatus,
  lockEncryptionSession,
  rotatePassphrase,
  unlockEncryptionSession,
  wipeEncryptedData,
} from '../../utils/encryptionManager'

export const EncryptionSettingsPanel = () => {
  const toast = useToast()
  const [statusTick, setStatusTick] = useState(0)
  const [modal, setModal] = useState<
    | null
    | 'unlock'
    | 'enable'
    | 'rotate'
    | 'disable'
    | 'wipe'
  >(null)

  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [nextPassphrase, setNextPassphrase] = useState('')
  const [confirmNextPassphrase, setConfirmNextPassphrase] = useState('')

  const status = useMemo(() => {
    void statusTick
    return getEncryptionStatus()
  }, [statusTick])

  const refresh = () => setStatusTick((tick) => tick + 1)

  const resetSecrets = () => {
    setPassphrase('')
    setConfirmPassphrase('')
    setCurrentPassphrase('')
    setNextPassphrase('')
    setConfirmNextPassphrase('')
  }

  const rehydrate = async () => {
    try {
      await useRiskStore.persist.rehydrate()
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3 border-t border-border-faint pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-high">Local encryption (optional)</p>
          {!status.available ? (
            <p className="text-sm text-text-low">
              Your browser does not support Web Crypto, so encryption is unavailable.
            </p>
          ) : status.enabled ? (
            <p className="text-sm text-text-low">
              Status: <span className="font-semibold text-text-high">{status.unlocked ? 'Enabled (unlocked)' : 'Enabled (locked)'}</span>
              {status.iterations ? (
                <span className="text-text-low"> · PBKDF2 iterations: {status.iterations.toLocaleString()}</span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-text-low">Status: <span className="font-semibold text-text-high">Disabled</span></p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status.available && status.enabled && status.unlocked ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                lockEncryptionSession()
                refresh()
                toast.notify({
                  title: 'Locked',
                  description: 'Encryption has been locked for this session.',
                  variant: 'info',
                })
              }}
            >
              Lock
            </Button>
          ) : null}

          {status.available && status.enabled && !status.unlocked ? (
            <Button size="sm" variant="secondary" onClick={() => setModal('unlock')}>
              Unlock
            </Button>
          ) : null}

          {status.available && !status.enabled ? (
            <Button size="sm" variant="secondary" onClick={() => setModal('enable')}>
              Enable
            </Button>
          ) : null}

          {status.available && status.enabled ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setModal('rotate')} disabled={!status.unlocked}>
                Rotate passphrase
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setModal('disable')} disabled={!status.unlocked}>
                Disable
              </Button>
            </>
          ) : null}

          {status.available && status.enabled && !status.unlocked ? (
            <Button size="sm" variant="destructive" onClick={() => setModal('wipe')}>
              Delete data
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-text-low">
        Encryption is local-only and uses browser crypto APIs. If you forget the passphrase, there is no recovery. Keep a backup export.
      </p>

      <Modal
        isOpen={modal === 'unlock'}
        onClose={() => {
          setModal(null)
          resetSecrets()
        }}
        title="Unlock encryption"
        eyebrow="Privacy controls"
        description="Unlocks your encrypted data for this browser session only."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="Passphrase"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            autoComplete="current-password"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const result = await unlockEncryptionSession(passphrase)
                if (!result.ok) {
                  toast.notify({
                    title: 'Incorrect passphrase',
                    description: 'Unable to unlock encrypted storage.',
                    variant: 'danger',
                  })
                  return
                }
                await rehydrate()
                refresh()
                setModal(null)
                resetSecrets()
                toast.notify({
                  title: 'Unlocked',
                  description: 'Your encrypted data is available for this session.',
                  variant: 'success',
                })
              }}
              disabled={!passphrase}
            >
              Unlock
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'enable'}
        onClose={() => {
          setModal(null)
          resetSecrets()
        }}
        title="Enable local encryption"
        eyebrow="Privacy controls"
        description="Sets a passphrase to encrypt stored data on this device. Forgotten passphrase = data loss."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="New passphrase"
            helperText="Use a strong passphrase you can remember."
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            autoComplete="new-password"
          />
          <Input
            type="password"
            label="Confirm passphrase"
            value={confirmPassphrase}
            onChange={(event) => setConfirmPassphrase(event.target.value)}
            autoComplete="new-password"
          />
          <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-text-low">
            You cannot recover data without the passphrase. Export backups before relying on encryption.
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                if (!passphrase || passphrase !== confirmPassphrase) return
                const result = await enablePassphraseEncryption({ passphrase, persistKey: LOCAL_STORAGE_KEY })
                if (!result.ok) {
                  toast.notify({
                    title: 'Unable to enable encryption',
                    description: 'Your browser may have blocked storage operations.',
                    variant: 'danger',
                  })
                  return
                }
                await rehydrate()
                refresh()
                setModal(null)
                resetSecrets()
                toast.notify({
                  title: 'Encryption enabled',
                  description: 'Data is now encrypted at rest using your passphrase.',
                  variant: 'success',
                })
              }}
              disabled={!passphrase || passphrase !== confirmPassphrase}
            >
              Enable
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'rotate'}
        onClose={() => {
          setModal(null)
          resetSecrets()
        }}
        title="Rotate passphrase"
        eyebrow="Privacy controls"
        description="Re-encrypts stored data with a new passphrase."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="Current passphrase"
            value={currentPassphrase}
            onChange={(event) => setCurrentPassphrase(event.target.value)}
            autoComplete="current-password"
          />
          <Input
            type="password"
            label="New passphrase"
            value={nextPassphrase}
            onChange={(event) => setNextPassphrase(event.target.value)}
            autoComplete="new-password"
          />
          <Input
            type="password"
            label="Confirm new passphrase"
            value={confirmNextPassphrase}
            onChange={(event) => setConfirmNextPassphrase(event.target.value)}
            autoComplete="new-password"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                if (!nextPassphrase || nextPassphrase !== confirmNextPassphrase) return
                const result = await rotatePassphrase({
                  currentPassphrase,
                  nextPassphrase,
                  persistKey: LOCAL_STORAGE_KEY,
                })
                if (!result.ok) {
                  toast.notify({
                    title: 'Unable to rotate',
                    description: 'Current passphrase was incorrect, or re-encryption failed.',
                    variant: 'danger',
                  })
                  return
                }
                await rehydrate()
                refresh()
                setModal(null)
                resetSecrets()
                toast.notify({
                  title: 'Passphrase rotated',
                  description: 'Data has been re-encrypted with the new passphrase.',
                  variant: 'success',
                })
              }}
              disabled={!currentPassphrase || !nextPassphrase || nextPassphrase !== confirmNextPassphrase}
            >
              Rotate
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'disable'}
        onClose={() => {
          setModal(null)
          resetSecrets()
        }}
        title="Disable encryption"
        eyebrow="Privacy controls"
        description="Decrypts and stores your data unencrypted on this device."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="Passphrase"
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            autoComplete="current-password"
          />
          <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-text-low">
            Disabling encryption keeps your data local, but it will no longer be protected at rest.
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                const confirmed = window.confirm('Disable encryption and store data unencrypted on this device?')
                if (!confirmed) return
                const result = await disablePassphraseEncryption({ passphrase, persistKey: LOCAL_STORAGE_KEY })
                if (!result.ok) {
                  toast.notify({
                    title: 'Unable to disable',
                    description: 'Passphrase was incorrect, or decryption failed.',
                    variant: 'danger',
                  })
                  return
                }
                await rehydrate()
                refresh()
                setModal(null)
                resetSecrets()
                toast.notify({
                  title: 'Encryption disabled',
                  description: 'Data is now stored unencrypted on this device.',
                  variant: 'warning',
                })
              }}
              disabled={!passphrase}
            >
              Disable
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'wipe'}
        onClose={() => {
          setModal(null)
          resetSecrets()
        }}
        title="Delete encrypted data"
        eyebrow="Privacy controls"
        description="Deletes stored risk data on this device. This cannot be undone."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-text-low">
            This is permanent. Use only if you forgot your passphrase or want to start fresh.
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                const confirmed = window.confirm(
                  'This will permanently delete your stored risk data. Continue?',
                )
                if (!confirmed) return
                wipeEncryptedData(LOCAL_STORAGE_KEY)
                refresh()
                setModal(null)
                resetSecrets()
                toast.notify({
                  title: 'Local data deleted',
                  description: 'Encrypted storage has been wiped on this device.',
                  variant: 'warning',
                })
                window.location.reload()
              }}
            >
              Delete data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

