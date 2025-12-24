import type { StateStorage } from 'zustand/middleware'

import {
  decryptFromStorage,
  encryptForStorage,
  getEncryptionStatus,
  migrateLegacyAutoEncryptionIfPresent,
} from './encryptionManager'

export class RiskRegisterPersistStorage implements StateStorage {
  private readonly persistKey: string
  private legacyMigrated = false

  constructor(persistKey: string) {
    this.persistKey = persistKey
  }

  private async ensureLegacyMigrated() {
    if (this.legacyMigrated) return
    this.legacyMigrated = true
    await migrateLegacyAutoEncryptionIfPresent(this.persistKey)
  }

  getItem: StateStorage['getItem'] = async (name: string) => {
    if (typeof window === 'undefined') return null
    if (name !== this.persistKey) {
      try {
        return window.localStorage.getItem(name)
      } catch {
        return null
      }
    }

    await this.ensureLegacyMigrated()

    const raw = (() => {
      try {
        return window.localStorage.getItem(name)
      } catch {
        return null
      }
    })()
    if (!raw) return null

    const status = getEncryptionStatus()
    if (!status.enabled) return raw
    if (!status.unlocked) return null

    try {
      return await decryptFromStorage(raw)
    } catch {
      return null
    }
  }

  setItem: StateStorage['setItem'] = async (name: string, value: string) => {
    if (typeof window === 'undefined') return
    if (name !== this.persistKey) {
      try {
        window.localStorage.setItem(name, value)
      } catch {
        // ignore
      }
      return
    }

    const status = getEncryptionStatus()
    if (!status.enabled) {
      try {
        window.localStorage.setItem(name, value)
      } catch {
        // ignore
      }
      return
    }

    if (!status.unlocked) {
      // Avoid overwriting encrypted content while locked.
      return
    }

    try {
      const encrypted = await encryptForStorage(value)
      window.localStorage.setItem(name, encrypted)
    } catch {
      // ignore
    }
  }

  removeItem: StateStorage['removeItem'] = (name: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(name)
    } catch {
      // ignore
    }
  }
}

