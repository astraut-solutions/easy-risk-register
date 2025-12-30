import {
  decodeSaltB64,
  decryptString,
  deriveAesKeyFromPassphrase,
  encodeSaltB64,
  encryptString,
  generateSalt,
  type EncryptedPayloadV1,
} from './passphraseCrypto'
import { normalizeRiskEncryptedFieldsV1, type RiskEncryptedFieldsV1 } from './e2eeRiskFields'

const DEFAULT_ITERATIONS = 210_000

type E2eeConfigV1 = {
  v: 1
  enabled: true
  kdf: {
    name: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    saltB64: string
  }
  test: EncryptedPayloadV1
}

const isWebCryptoAvailable = () =>
  typeof window !== 'undefined' &&
  typeof window.crypto !== 'undefined' &&
  typeof window.crypto.subtle !== 'undefined' &&
  typeof window.localStorage !== 'undefined'

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

const configKey = (workspaceId: string) => `easy-risk-register:e2ee:${workspaceId}`

const readConfig = (workspaceId: string): E2eeConfigV1 | null => {
  if (!isWebCryptoAvailable()) return null
  if (!workspaceId) return null
  const raw = safeReadLocalStorage(configKey(workspaceId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const config = parsed as E2eeConfigV1
    if (config.v !== 1 || config.enabled !== true) return null
    if (!config.kdf || config.kdf.name !== 'PBKDF2' || config.kdf.hash !== 'SHA-256') return null
    if (typeof config.kdf.iterations !== 'number' || !Number.isFinite(config.kdf.iterations) || config.kdf.iterations < 10_000)
      return null
    if (typeof config.kdf.saltB64 !== 'string' || !config.kdf.saltB64.trim()) return null
    if (!config.test || config.test.v !== 1 || typeof config.test.ivB64 !== 'string' || typeof config.test.ctB64 !== 'string')
      return null
    return config
  } catch {
    return null
  }
}

const writeConfig = (workspaceId: string, config: E2eeConfigV1) =>
  safeWriteLocalStorage(configKey(workspaceId), JSON.stringify(config))

const sessionKeys = new Map<string, CryptoKey>()

export type E2eeStatus = {
  available: boolean
  enabled: boolean
  unlocked: boolean
  iterations?: number
  kdfSaltB64?: string
}

export const getE2eeStatus = (workspaceId: string | null): E2eeStatus => {
  const available = isWebCryptoAvailable()
  if (!available || !workspaceId) return { available, enabled: false, unlocked: false }

  const config = readConfig(workspaceId)
  return {
    available,
    enabled: Boolean(config),
    unlocked: Boolean(config) && sessionKeys.has(workspaceId),
    iterations: config?.kdf.iterations,
    kdfSaltB64: config?.kdf.saltB64,
  }
}

export const lockE2eeSession = (workspaceId: string | null) => {
  if (!workspaceId) return
  sessionKeys.delete(workspaceId)
}

export const getE2eeSessionKey = (workspaceId: string | null): CryptoKey | null => {
  if (!workspaceId) return null
  return sessionKeys.get(workspaceId) ?? null
}

export const getE2eeKdfConfig = (workspaceId: string | null): { iterations: number; saltB64: string } | null => {
  if (!workspaceId) return null
  const config = readConfig(workspaceId)
  if (!config) return null
  return { iterations: config.kdf.iterations, saltB64: config.kdf.saltB64 }
}

async function deriveKey(workspaceId: string, passphrase: string) {
  const config = readConfig(workspaceId)
  if (!config) return { ok: false as const, reason: 'not_enabled' as const }
  if (!passphrase) return { ok: false as const, reason: 'empty_passphrase' as const }

  const salt = decodeSaltB64(config.kdf.saltB64)
  const key = await deriveAesKeyFromPassphrase({ passphrase, salt, iterations: config.kdf.iterations })
  return { ok: true as const, config, key }
}

export const unlockE2eeSession = async (params: { workspaceId: string | null; passphrase: string }) => {
  if (!params.workspaceId) return { ok: false as const, reason: 'missing_workspace' as const }
  const workspaceId = params.workspaceId
  const derived = await deriveKey(workspaceId, params.passphrase)
  if (!derived.ok) return derived

  try {
    const testPlain = await decryptString(derived.config.test, derived.key)
    if (testPlain !== 'ok') return { ok: false as const, reason: 'invalid_passphrase' as const }
  } catch {
    return { ok: false as const, reason: 'invalid_passphrase' as const }
  }

  sessionKeys.set(workspaceId, derived.key)
  return { ok: true as const }
}

export const enableE2eeForWorkspace = async (params: {
  workspaceId: string | null
  passphrase: string
  iterations?: number
}) => {
  if (!isWebCryptoAvailable()) return { ok: false as const, reason: 'unavailable' as const }
  if (!params.workspaceId) return { ok: false as const, reason: 'missing_workspace' as const }
  if (!params.passphrase) return { ok: false as const, reason: 'empty_passphrase' as const }

  const workspaceId = params.workspaceId
  const existing = readConfig(workspaceId)
  if (existing) return { ok: false as const, reason: 'already_enabled' as const }

  const iterations =
    Number.isFinite(params.iterations) && (params.iterations ?? 0) > 10_000
      ? Math.floor(params.iterations!)
      : DEFAULT_ITERATIONS

  const salt = generateSalt()
  const saltB64 = encodeSaltB64(salt)
  const key = await deriveAesKeyFromPassphrase({ passphrase: params.passphrase, salt, iterations })
  const test = await encryptString('ok', key)

  const config: E2eeConfigV1 = {
    v: 1,
    enabled: true,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, saltB64 },
    test,
  }

  if (!writeConfig(workspaceId, config)) return { ok: false as const, reason: 'storage_error' as const }
  sessionKeys.set(workspaceId, key)
  return { ok: true as const, kdf: { iterations, saltB64 } }
}

export const bootstrapE2eeFromEncryptedRisk = async (params: {
  workspaceId: string | null
  passphrase: string
  encryptedFields: unknown
}) => {
  if (!isWebCryptoAvailable()) return { ok: false as const, reason: 'unavailable' as const }
  if (!params.workspaceId) return { ok: false as const, reason: 'missing_workspace' as const }
  if (!params.passphrase) return { ok: false as const, reason: 'empty_passphrase' as const }

  const workspaceId = params.workspaceId
  if (readConfig(workspaceId)) return { ok: false as const, reason: 'already_enabled' as const }

  const parsed = normalizeRiskEncryptedFieldsV1(params.encryptedFields)
  if (!parsed) return { ok: false as const, reason: 'invalid_payload' as const }

  const salt = decodeSaltB64(parsed.kdf.saltB64)
  const key = await deriveAesKeyFromPassphrase({ passphrase: params.passphrase, salt, iterations: parsed.kdf.iterations })
  const test = await encryptString('ok', key)

  const config: E2eeConfigV1 = {
    v: 1,
    enabled: true,
    kdf: { ...parsed.kdf },
    test,
  }

  if (!writeConfig(workspaceId, config)) return { ok: false as const, reason: 'storage_error' as const }
  sessionKeys.set(workspaceId, key)
  return { ok: true as const, kdf: { iterations: parsed.kdf.iterations, saltB64: parsed.kdf.saltB64 } }
}

export const disableE2eeForWorkspace = (workspaceId: string | null) => {
  if (!workspaceId) return
  safeRemoveLocalStorage(configKey(workspaceId))
  sessionKeys.delete(workspaceId)
}

export const rotateE2eeConfig = async (params: {
  workspaceId: string | null
  currentPassphrase: string
  nextPassphrase: string
  iterations?: number
}) => {
  if (!isWebCryptoAvailable()) return { ok: false as const, reason: 'unavailable' as const }
  if (!params.workspaceId) return { ok: false as const, reason: 'missing_workspace' as const }
  if (!params.nextPassphrase) return { ok: false as const, reason: 'empty_passphrase' as const }

  const workspaceId = params.workspaceId
  const unlocked = sessionKeys.has(workspaceId)
    ? { ok: true as const }
    : await unlockE2eeSession({ workspaceId, passphrase: params.currentPassphrase })
  if (!unlocked.ok) return unlocked

  const iterations =
    Number.isFinite(params.iterations) && (params.iterations ?? 0) > 10_000
      ? Math.floor(params.iterations!)
      : DEFAULT_ITERATIONS

  const salt = generateSalt()
  const saltB64 = encodeSaltB64(salt)
  const key = await deriveAesKeyFromPassphrase({ passphrase: params.nextPassphrase, salt, iterations })
  const test = await encryptString('ok', key)

  const config: E2eeConfigV1 = {
    v: 1,
    enabled: true,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, saltB64 },
    test,
  }

  if (!writeConfig(workspaceId, config)) return { ok: false as const, reason: 'storage_error' as const }
  sessionKeys.set(workspaceId, key)
  return { ok: true as const, kdf: { iterations, saltB64 } }
}

export const findFirstEncryptedRiskPayload = (risks: Array<{ encryptedFields?: unknown }>) => {
  for (const risk of risks) {
    const parsed = normalizeRiskEncryptedFieldsV1(risk.encryptedFields)
    if (parsed) return parsed
  }
  return null
}

export const isRiskEncrypted = (encryptedFields: unknown): encryptedFields is RiskEncryptedFieldsV1 =>
  Boolean(normalizeRiskEncryptedFieldsV1(encryptedFields))

