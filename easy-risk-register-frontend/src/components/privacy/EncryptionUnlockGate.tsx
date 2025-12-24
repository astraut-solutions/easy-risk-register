import { useEffect, useMemo, useState } from 'react'

import { Button, Input, Modal } from '../../design-system'
import { useToast } from '../feedback/ToastProvider'
import { useRiskStore } from '../../stores/riskStore'
import { getEncryptionStatus, unlockEncryptionSession, wipeEncryptedData } from '../../utils/encryptionManager'
import { LOCAL_STORAGE_KEY } from '../../constants/risk'

type UnlockResult = { ok: true } | { ok: false; reason: string }

export const EncryptionUnlockGate = () => {
  const toast = useToast()
  const [passphrase, setPassphrase] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [statusTick, setStatusTick] = useState(0)

  const status = useMemo(() => {
    void statusTick
    return getEncryptionStatus()
  }, [statusTick])

  useEffect(() => {
    setPassphrase('')
  }, [status.enabled, status.unlocked])

  const needsUnlock = status.available && status.enabled && !status.unlocked

  const unlock = async (): Promise<UnlockResult> => {
    setIsUnlocking(true)
    try {
      const result = await unlockEncryptionSession(passphrase)
      if (!result.ok) {
        return { ok: false, reason: result.reason }
      }

      try {
        await useRiskStore.persist.rehydrate()
      } catch {
        // ignore
      }

      setStatusTick((tick) => tick + 1)
      return { ok: true }
    } finally {
      setIsUnlocking(false)
    }
  }

  if (!needsUnlock) return null

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        // Intentionally blocked: keep the app locked until unlock or wipe.
      }}
      title="Unlock encrypted data"
      eyebrow="Privacy controls"
      description="Local encryption is enabled. Enter your passphrase to unlock your saved risks. Forgotten passphrase = data loss."
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

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="destructive"
            onClick={() => {
              const confirmed = window.confirm(
                'This will permanently delete your stored risk data. Continue?',
              )
              if (!confirmed) return
              wipeEncryptedData(LOCAL_STORAGE_KEY)
              setStatusTick((tick) => tick + 1)
              toast.notify({
                title: 'Local data deleted',
                description: 'Encrypted storage has been wiped on this device.',
                variant: 'warning',
              })
              window.location.reload()
            }}
          >
            I forgot my passphrase (delete data)
          </Button>
          <Button
            onClick={async () => {
              const result = await unlock()
              if (result.ok) return
              toast.notify({
                title: 'Unable to unlock',
                description: 'Passphrase was incorrect.',
                variant: 'danger',
              })
            }}
            disabled={!passphrase || isUnlocking}
          >
            {isUnlocking ? 'Unlocking…' : 'Unlock'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
