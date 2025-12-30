import { useMemo, useState } from 'react'

import { Button, Input, Modal } from '../../design-system'
import { useToast } from '../feedback/ToastProvider'
import { useAuthStore } from '../../stores/authStore'
import { useRiskStore } from '../../stores/riskStore'
import { apiPatchJson } from '../../services/apiClient'
import { riskService } from '../../services/riskService'
import {
  bootstrapE2eeFromEncryptedRisk,
  disableE2eeForWorkspace,
  enableE2eeForWorkspace,
  getE2eeKdfConfig,
  getE2eeSessionKey,
  getE2eeStatus,
  lockE2eeSession,
  rotateE2eeConfig,
  unlockE2eeSession,
} from '../../utils/e2eeManager'
import { buildRiskEncryptedFieldsV1, normalizeRiskEncryptedFieldsV1 } from '../../utils/e2eeRiskFields'

type ModalKey = null | 'unlock' | 'enable' | 'bootstrap' | 'rotate' | 'disable'

async function runWithConcurrency<T>(items: readonly T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items]
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const item = queue.shift()
      if (item === undefined) return
      await worker(item)
    }
  })
  await Promise.all(workers)
}

export const EndToEndEncryptionSettingsPanel = () => {
  const toast = useToast()
  const workspaceId = useAuthStore((s) => s.workspaceId)
  const authStatus = useAuthStore((s) => s.status)
  const risks = useRiskStore((s) => s.risks)

  const [modal, setModal] = useState<ModalKey>(null)
  const [statusTick, setStatusTick] = useState(0)
  const [working, setWorking] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [nextPassphrase, setNextPassphrase] = useState('')
  const [confirmNextPassphrase, setConfirmNextPassphrase] = useState('')

  const status = useMemo(() => {
    void statusTick
    return getE2eeStatus(workspaceId)
  }, [statusTick, workspaceId])

  const refresh = () => setStatusTick((tick) => tick + 1)

  const encryptedRisks = useMemo(
    () => risks.filter((risk) => Boolean(normalizeRiskEncryptedFieldsV1(risk.encryptedFields))),
    [risks],
  )

  const hasEncryptedData = encryptedRisks.length > 0

  const resetSecrets = () => {
    setPassphrase('')
    setConfirmPassphrase('')
    setCurrentPassphrase('')
    setNextPassphrase('')
    setConfirmNextPassphrase('')
  }

  const closeModal = () => {
    if (working) return
    setModal(null)
    setProgress(null)
    resetSecrets()
  }

  const ensureWorkspaceReady = () => {
    if (authStatus !== 'authenticated') {
      toast.notify({
        title: 'Sign in required',
        description: 'End-to-end encryption requires a signed-in workspace session.',
        variant: 'warning',
      })
      return false
    }
    if (!workspaceId) {
      toast.notify({
        title: 'Workspace unavailable',
        description: 'Select a workspace before enabling end-to-end encryption.',
        variant: 'warning',
      })
      return false
    }
    return true
  }

  const encryptRiskOnServer = async (risk: { id: string; description: string; mitigationPlan: string }) => {
    const key = getE2eeSessionKey(workspaceId)
    const kdf = getE2eeKdfConfig(workspaceId)
    if (!key || !kdf) throw new Error('E2EE locked or misconfigured')

    const encryptedFields = await buildRiskEncryptedFieldsV1({
      kdf,
      key,
      description: risk.description ?? '',
      mitigationPlan: risk.mitigationPlan ?? '',
    })

    await apiPatchJson(`/api/risks/${risk.id}`, { encryptedFields })
  }

  const decryptRiskOnServer = async (risk: { id: string; description: string; mitigationPlan: string }) => {
    await apiPatchJson(`/api/risks/${risk.id}`, {
      encryptedFields: {},
      description: risk.description ?? '',
      mitigationPlan: risk.mitigationPlan ?? '',
    })
  }

  return (
    <div className="space-y-3 border-t border-border-faint pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-text-high">End-to-end encryption (selected fields)</p>
          {!status.available ? (
            <p className="text-sm text-text-low">
              Your browser does not support Web Crypto, so end-to-end encryption is unavailable.
            </p>
          ) : status.enabled ? (
            <p className="text-sm text-text-low">
              Status:{' '}
              <span className="font-semibold text-text-high">{status.unlocked ? 'Enabled (unlocked)' : 'Enabled (locked)'}</span>
              {status.iterations ? (
                <span className="text-text-low"> · PBKDF2 iterations: {status.iterations.toLocaleString()}</span>
              ) : null}
            </p>
          ) : hasEncryptedData ? (
            <p className="text-sm text-text-low">
              Status: <span className="font-semibold text-text-high">Encrypted data detected</span>{' '}
              <span className="text-text-low">(unlock to view/edit)</span>
            </p>
          ) : (
            <p className="text-sm text-text-low">
              Status: <span className="font-semibold text-text-high">Disabled</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status.available && status.enabled && status.unlocked ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!ensureWorkspaceReady()) return
                lockE2eeSession(workspaceId)
                refresh()
                try {
                  await riskService.syncFromApi()
                } catch {
                  // best-effort
                }
                toast.notify({
                  title: 'Locked',
                  description: 'End-to-end encryption has been locked for this session.',
                  variant: 'info',
                })
              }}
              disabled={working}
            >
              Lock
            </Button>
          ) : null}

          {status.available && status.enabled && !status.unlocked ? (
            <Button size="sm" variant="secondary" onClick={() => setModal('unlock')} disabled={working}>
              Unlock
            </Button>
          ) : null}

          {status.available && !status.enabled && hasEncryptedData ? (
            <Button size="sm" variant="secondary" onClick={() => setModal('bootstrap')} disabled={working}>
              Unlock existing
            </Button>
          ) : null}

          {status.available && !status.enabled && !hasEncryptedData ? (
            <Button size="sm" variant="secondary" onClick={() => setModal('enable')} disabled={working}>
              Enable
            </Button>
          ) : null}

          {status.available && status.enabled ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setModal('rotate')} disabled={!status.unlocked || working}>
                Rotate passphrase
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setModal('disable')} disabled={!status.unlocked || working}>
                Disable
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-text-low">
        When enabled, selected risk fields are encrypted in the browser before being saved. If you forget the passphrase, there is no recovery.
      </p>

      <Modal
        isOpen={modal === 'unlock'}
        onClose={closeModal}
        title="Unlock end-to-end encryption"
        eyebrow="Privacy controls"
        description="Unlocks encrypted risk fields for this browser session only."
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
                if (!ensureWorkspaceReady()) return
                setWorking(true)
                try {
                  const result = await unlockE2eeSession({ workspaceId, passphrase })
                  if (!result.ok) {
                    toast.notify({
                      title: 'Unable to unlock',
                      description: 'Passphrase was incorrect.',
                      variant: 'danger',
                    })
                    return
                  }
                  refresh()
                  await riskService.syncFromApi()
                  closeModal()
                  toast.notify({
                    title: 'Unlocked',
                    description: 'Encrypted risk fields are available for this session.',
                    variant: 'success',
                  })
                } finally {
                  setWorking(false)
                }
              }}
              disabled={!passphrase || working}
            >
              Unlock
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'bootstrap'}
        onClose={closeModal}
        title="Unlock existing encrypted risks"
        eyebrow="Privacy controls"
        description="This device does not have E2EE configured yet, but the workspace contains encrypted risks. Enter your passphrase to unlock and save E2EE settings on this device."
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
                if (!ensureWorkspaceReady()) return
                const seed = encryptedRisks.find((risk) => normalizeRiskEncryptedFieldsV1(risk.encryptedFields))
                if (!seed) {
                  toast.notify({
                    title: 'No encrypted risks found',
                    description: 'Sync the workspace and try again.',
                    variant: 'warning',
                  })
                  return
                }

                setWorking(true)
                try {
                  const result = await bootstrapE2eeFromEncryptedRisk({
                    workspaceId,
                    passphrase,
                    encryptedFields: seed.encryptedFields,
                  })
                  if (!result.ok) {
                    toast.notify({
                      title: 'Unable to unlock',
                      description: 'Passphrase was incorrect, or encrypted data is malformed.',
                      variant: 'danger',
                    })
                    return
                  }
                  refresh()
                  await riskService.syncFromApi()
                  closeModal()
                  toast.notify({
                    title: 'Unlocked',
                    description: 'Encrypted risk fields are available for this session.',
                    variant: 'success',
                  })
                } finally {
                  setWorking(false)
                }
              }}
              disabled={!passphrase || working}
            >
              Unlock
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'enable'}
        onClose={closeModal}
        title="Enable end-to-end encryption"
        eyebrow="Privacy controls"
        description="Encrypts selected risk fields before saving them to the database. Existing risks will be re-saved with encrypted fields."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            type="password"
            label="Passphrase"
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
            No recovery: losing the passphrase means losing access to encrypted fields.
          </div>

          {progress ? (
            <p className="text-xs text-text-low" aria-live="polite">
              Encrypting risks… {progress.done}/{progress.total}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                if (!ensureWorkspaceReady()) return
                if (!passphrase || passphrase !== confirmPassphrase) return

                setWorking(true)
                setProgress(null)
                try {
                  const enabled = await enableE2eeForWorkspace({ workspaceId, passphrase })
                  if (!enabled.ok) {
                    toast.notify({
                      title: 'Unable to enable',
                      description: 'Your browser may have blocked storage operations.',
                      variant: 'danger',
                    })
                    return
                  }

                  const candidates = risks.filter((risk) => !normalizeRiskEncryptedFieldsV1(risk.encryptedFields))
                  setProgress({ done: 0, total: candidates.length })
                  let done = 0

                  await runWithConcurrency(candidates, 3, async (risk) => {
                    await encryptRiskOnServer({
                      id: risk.id,
                      description: risk.description,
                      mitigationPlan: risk.mitigationPlan,
                    })
                    done += 1
                    setProgress({ done, total: candidates.length })
                  })

                  refresh()
                  await riskService.syncFromApi()
                  closeModal()
                  toast.notify({
                    title: 'End-to-end encryption enabled',
                    description: 'Selected risk fields are now encrypted in the database.',
                    variant: 'success',
                  })
                } catch (error) {
                  toast.notify({
                    title: 'Unable to enable',
                    description: error instanceof Error ? error.message : 'Unexpected error',
                    variant: 'danger',
                  })
                } finally {
                  setWorking(false)
                  setProgress(null)
                }
              }}
              disabled={!passphrase || passphrase !== confirmPassphrase || working}
            >
              Enable
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'rotate'}
        onClose={closeModal}
        title="Rotate E2EE passphrase"
        eyebrow="Privacy controls"
        description="Re-encrypts encrypted risk fields with a new passphrase."
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

          {progress ? (
            <p className="text-xs text-text-low" aria-live="polite">
              Re-encrypting risks… {progress.done}/{progress.total}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                if (!ensureWorkspaceReady()) return
                if (!currentPassphrase || !nextPassphrase || nextPassphrase !== confirmNextPassphrase) return

                setWorking(true)
                setProgress(null)
                try {
                  const rotated = await rotateE2eeConfig({
                    workspaceId,
                    currentPassphrase,
                    nextPassphrase,
                  })
                  if (!rotated.ok) {
                    toast.notify({
                      title: 'Unable to rotate',
                      description: 'Current passphrase was incorrect, or encryption setup failed.',
                      variant: 'danger',
                    })
                    return
                  }

                  const candidates = risks.filter((risk) => Boolean(normalizeRiskEncryptedFieldsV1(risk.encryptedFields)))
                  setProgress({ done: 0, total: candidates.length })
                  let done = 0

                  await runWithConcurrency(candidates, 3, async (risk) => {
                    await encryptRiskOnServer({
                      id: risk.id,
                      description: risk.description,
                      mitigationPlan: risk.mitigationPlan,
                    })
                    done += 1
                    setProgress({ done, total: candidates.length })
                  })

                  refresh()
                  await riskService.syncFromApi()
                  closeModal()
                  toast.notify({
                    title: 'Passphrase rotated',
                    description: 'Encrypted risk fields have been re-encrypted with the new passphrase.',
                    variant: 'success',
                  })
                } catch (error) {
                  toast.notify({
                    title: 'Unable to rotate',
                    description: error instanceof Error ? error.message : 'Unexpected error',
                    variant: 'danger',
                  })
                } finally {
                  setWorking(false)
                  setProgress(null)
                }
              }}
              disabled={!currentPassphrase || !nextPassphrase || nextPassphrase !== confirmNextPassphrase || working}
            >
              Rotate
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'disable'}
        onClose={closeModal}
        title="Disable end-to-end encryption"
        eyebrow="Privacy controls"
        description="Decrypts encrypted risk fields and stores them unencrypted in the database."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-3 text-sm text-text-low">
            Disabling E2EE restores plaintext for the selected fields in the database.
          </div>

          {progress ? (
            <p className="text-xs text-text-low" aria-live="polite">
              Decrypting risks… {progress.done}/{progress.total}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                if (!ensureWorkspaceReady()) return

                const confirmed = window.confirm(
                  'Disable end-to-end encryption? This will write decrypted plaintext back to the database for selected fields.',
                )
                if (!confirmed) return

                setWorking(true)
                setProgress(null)
                try {
                  const candidates = risks.filter((risk) => Boolean(normalizeRiskEncryptedFieldsV1(risk.encryptedFields)))
                  setProgress({ done: 0, total: candidates.length })
                  let done = 0

                  await runWithConcurrency(candidates, 3, async (risk) => {
                    await decryptRiskOnServer({
                      id: risk.id,
                      description: risk.description,
                      mitigationPlan: risk.mitigationPlan,
                    })
                    done += 1
                    setProgress({ done, total: candidates.length })
                  })

                  disableE2eeForWorkspace(workspaceId)
                  refresh()
                  await riskService.syncFromApi()
                  closeModal()
                  toast.notify({
                    title: 'End-to-end encryption disabled',
                    description: 'Selected fields are now stored as plaintext in the database.',
                    variant: 'warning',
                  })
                } catch (error) {
                  toast.notify({
                    title: 'Unable to disable',
                    description: error instanceof Error ? error.message : 'Unexpected error',
                    variant: 'danger',
                  })
                } finally {
                  setWorking(false)
                  setProgress(null)
                }
              }}
              disabled={working}
            >
              Disable
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
