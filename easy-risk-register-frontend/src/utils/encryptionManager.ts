import {
  decodeSaltB64,
  decryptString,
  deriveAesKeyFromPassphrase,
  encodeSaltB64,
  encryptString,
  type EncryptedPayloadV1,
  generateSalt,
} from './passphraseCrypto'

const ENCRYPTION_CONFIG_KEY = 'easy-risk-register:encryption'
const LEGACY_KEY_STORAGE_KEY = 'easy-risk-register-key'

const DEFAULT_ITERATIONS = 210_000

type EncryptionConfigV1 = {
  v: 1
  enabled: true
  kdf: {
    iterations: number
    saltB64: string
  }
  test: EncryptedPayloadV1
}

let sessionKey: CryptoKey | null = null
const ENCRYPTION_STATUS_EVENT = 'easy-risk-register:encryption-status-changed'
const encryptionStatusTarget = new EventTarget()

const notifyEncryptionStatusChange = () => {
  encryptionStatusTarget.dispatchEvent(new Event(ENCRYPTION_STATUS_EVENT))
}

export const onEncryptionStatusChange = (handler: () => void) => {
  encryptionStatusTarget.addEventListener(ENCRYPTION_STATUS_EVENT, handler)
  return () => encryptionStatusTarget.removeEventListener(ENCRYPTION_STATUS_EVENT, handler)
}

const safeReadLocalStorage = (key: string) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeWriteLocalStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

const safeRemoveLocalStorage = (key: string) => {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

const readConfig = (): EncryptionConfigV1 | null => {
  if (typeof window === 'undefined') return null
  const raw = safeReadLocalStorage(ENCRYPTION_CONFIG_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const config = parsed as EncryptionConfigV1
    if (config.v !== 1 || config.enabled !== true) return null
    if (!config.kdf || typeof config.kdf.iterations !== 'number' || typeof config.kdf.saltB64 !== 'string')
      return null
    if (!config.test || config.test.v !== 1) return null
    return config
  } catch {
    return null
  }
}

const writeConfig = (config: EncryptionConfigV1) => safeWriteLocalStorage(ENCRYPTION_CONFIG_KEY, JSON.stringify(config))

const isWebCryptoAvailable = () =>
  typeof window !== 'undefined' &&
  typeof window.crypto !== 'undefined' &&
  typeof window.crypto.subtle !== 'undefined' &&
  typeof window.localStorage !== 'undefined'

export type EncryptionStatus = {
  available: boolean
  enabled: boolean
  unlocked: boolean
  iterations?: number
}

export const getEncryptionStatus = (): EncryptionStatus => {
  const available = isWebCryptoAvailable()
  const config = available ? readConfig() : null
  return {
    available,
    enabled: Boolean(config),
    unlocked: Boolean(config) && sessionKey !== null,
    iterations: config?.kdf.iterations,
  }
}

export const lockEncryptionSession = () => {
  sessionKey = null
  notifyEncryptionStatusChange()
}

export const unlockEncryptionSession = async (passphrase: string) => {
  const config = readConfig()
  if (!config) return { ok: false as const, reason: 'not_enabled' as const }
  if (!passphrase) return { ok: false as const, reason: 'empty_passphrase' as const }

  try {
    const salt = decodeSaltB64(config.kdf.saltB64)
    const key = await deriveAesKeyFromPassphrase({
      passphrase,
      salt,
      iterations: config.kdf.iterations,
    })

    const testPlain = await decryptString(config.test, key)
    if (testPlain !== 'ok') {
      return { ok: false as const, reason: 'invalid_passphrase' as const }
    }

    sessionKey = key
    notifyEncryptionStatusChange()
    return { ok: true as const }
  } catch {
    return { ok: false as const, reason: 'invalid_passphrase' as const }
  }
}

const parseEncryptedPayload = (raw: string): EncryptedPayloadV1 | null => {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const payload = parsed as EncryptedPayloadV1
    if (payload.v !== 1) return null
    if (typeof payload.ivB64 !== 'string' || typeof payload.ctB64 !== 'string') return null
    return payload
  } catch {
    return null
  }
}

export const encryptForStorage = async (plaintext: string): Promise<string> => {
  if (!sessionKey) throw new Error('Encryption is locked')
  const payload = await encryptString(plaintext, sessionKey)
  return JSON.stringify(payload)
}

export const decryptFromStorage = async (rawEncrypted: string): Promise<string> => {
  if (!sessionKey) throw new Error('Encryption is locked')
  const payload = parseEncryptedPayload(rawEncrypted)
  if (!payload) throw new Error('Invalid encrypted payload')
  return decryptString(payload, sessionKey)
}

export const enablePassphraseEncryption = async (params: {
  passphrase: string
  persistKey: string
  iterations?: number
}) => {
  if (!isWebCryptoAvailable()) return { ok: false as const, reason: 'unavailable' as const }
  if (!params.passphrase) return { ok: false as const, reason: 'empty_passphrase' as const }

  const existing = readConfig()
  if (existing) return { ok: false as const, reason: 'already_enabled' as const }

  const iterations = Number.isFinite(params.iterations) && (params.iterations ?? 0) > 10_000
    ? Math.floor(params.iterations!)
    : DEFAULT_ITERATIONS

  const salt = generateSalt()
  const key = await deriveAesKeyFromPassphrase({ passphrase: params.passphrase, salt, iterations })
  sessionKey = key

  const test = await encryptString('ok', key)
  const config: EncryptionConfigV1 = {
    v: 1,
    enabled: true,
    kdf: { iterations, saltB64: encodeSaltB64(salt) },
    test,
  }

  if (!writeConfig(config)) {
    sessionKey = null
    return { ok: false as const, reason: 'storage_error' as const }
  }

  notifyEncryptionStatusChange()

  const current = safeReadLocalStorage(params.persistKey)
  if (typeof current === 'string' && current) {
    const encrypted = await encryptString(current, key)
    safeWriteLocalStorage(params.persistKey, JSON.stringify(encrypted))
  }

  // Remove legacy auto-encryption key if present, since passphrase encryption is now enabled.
  safeRemoveLocalStorage(LEGACY_KEY_STORAGE_KEY)

  return { ok: true as const }
}

export const disablePassphraseEncryption = async (params: { passphrase: string; persistKey: string }) => {
  const config = readConfig()
  if (!config) return { ok: false as const, reason: 'not_enabled' as const }
  const unlocked = sessionKey !== null ? { ok: true as const } : await unlockEncryptionSession(params.passphrase)
  if (!unlocked.ok) return unlocked

  const rawEncrypted = safeReadLocalStorage(params.persistKey)
  if (typeof rawEncrypted === 'string' && rawEncrypted) {
    try {
      const plaintext = await decryptFromStorage(rawEncrypted)
      safeWriteLocalStorage(params.persistKey, plaintext)
    } catch {
      // If decryption fails, keep existing ciphertext (user can still wipe).
      return { ok: false as const, reason: 'decrypt_failed' as const }
    }
  }

  safeRemoveLocalStorage(ENCRYPTION_CONFIG_KEY)
  sessionKey = null
  notifyEncryptionStatusChange()
  return { ok: true as const }
}

export const rotatePassphrase = async (params: {
  currentPassphrase: string
  nextPassphrase: string
  persistKey: string
  iterations?: number
}) => {
  const config = readConfig()
  if (!config) return { ok: false as const, reason: 'not_enabled' as const }
  const unlocked = sessionKey !== null ? { ok: true as const } : await unlockEncryptionSession(params.currentPassphrase)
  if (!unlocked.ok) return unlocked

  const rawEncrypted = safeReadLocalStorage(params.persistKey)
  const plaintext = rawEncrypted ? await decryptFromStorage(rawEncrypted) : null

  safeRemoveLocalStorage(ENCRYPTION_CONFIG_KEY)
  sessionKey = null

  const enabled = await enablePassphraseEncryption({
    passphrase: params.nextPassphrase,
    persistKey: params.persistKey,
    iterations: params.iterations,
  })
  if (!enabled.ok) return enabled

  if (typeof plaintext === 'string' && plaintext) {
    const encrypted = await encryptForStorage(plaintext)
    safeWriteLocalStorage(params.persistKey, encrypted)
  }

  return { ok: true as const }
}

export const wipeEncryptedData = (persistKey: string) => {
  safeRemoveLocalStorage(persistKey)
  safeRemoveLocalStorage(ENCRYPTION_CONFIG_KEY)
  sessionKey = null
  notifyEncryptionStatusChange()
}

export const migrateLegacyAutoEncryptionIfPresent = async (persistKey: string) => {
  if (typeof window === 'undefined') return { migrated: false }
  if (readConfig()) return { migrated: false }

  const legacyKeyString = safeReadLocalStorage(LEGACY_KEY_STORAGE_KEY)
  const legacyCiphertextB64 = safeReadLocalStorage(persistKey)
  if (!legacyKeyString || !legacyCiphertextB64) return { migrated: false }

  try {
    const keyBytes = Uint8Array.from(atob(legacyKeyString), (c) => c.charCodeAt(0))
    const key = await window.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ])

    const data = Uint8Array.from(atob(legacyCiphertextB64), (c) => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const encryptedContent = data.slice(12)

    const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedContent)
    const plaintext = new TextDecoder().decode(decrypted)

    safeWriteLocalStorage(persistKey, plaintext)
    safeRemoveLocalStorage(LEGACY_KEY_STORAGE_KEY)
    return { migrated: true }
  } catch {
    return { migrated: false }
  }
}

