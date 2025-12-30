import type { EncryptedPayloadV1 } from './passphraseCrypto'
import { decryptString, encryptString } from './passphraseCrypto'

export type E2eeKdfConfigV1 = {
  v: 1
  kdf: {
    name: 'PBKDF2'
    hash: 'SHA-256'
    iterations: number
    saltB64: string
  }
}

export type RiskEncryptedFieldsV1 = E2eeKdfConfigV1 & {
  fields: {
    description?: EncryptedPayloadV1
    mitigationPlan?: EncryptedPayloadV1
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeEncryptedPayloadV1 = (value: unknown): EncryptedPayloadV1 | null => {
  if (!isPlainObject(value)) return null
  if (value.v !== 1) return null
  if (typeof value.ivB64 !== 'string' || typeof value.ctB64 !== 'string') return null
  return value as EncryptedPayloadV1
}

export const normalizeRiskEncryptedFieldsV1 = (value: unknown): RiskEncryptedFieldsV1 | null => {
  if (!isPlainObject(value)) return null
  if (value.v !== 1) return null

  const rawKdf = value.kdf
  if (!isPlainObject(rawKdf)) return null
  if (rawKdf.name !== 'PBKDF2') return null
  if (rawKdf.hash !== 'SHA-256') return null
  if (typeof rawKdf.iterations !== 'number' || !Number.isFinite(rawKdf.iterations) || rawKdf.iterations < 10_000)
    return null
  if (typeof rawKdf.saltB64 !== 'string' || !rawKdf.saltB64.trim()) return null

  const rawFields = value.fields
  if (!isPlainObject(rawFields)) return null

  const fields: RiskEncryptedFieldsV1['fields'] = {}
  const desc = normalizeEncryptedPayloadV1(rawFields.description)
  if (desc) fields.description = desc
  const mitigation = normalizeEncryptedPayloadV1(rawFields.mitigationPlan)
  if (mitigation) fields.mitigationPlan = mitigation

  return {
    v: 1,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: rawKdf.iterations,
      saltB64: rawKdf.saltB64,
    },
    fields,
  }
}

export const buildRiskEncryptedFieldsV1 = async (params: {
  kdf: { iterations: number; saltB64: string }
  key: CryptoKey
  description: string
  mitigationPlan: string
}): Promise<RiskEncryptedFieldsV1> => {
  const [description, mitigationPlan] = await Promise.all([
    encryptString(params.description ?? '', params.key),
    encryptString(params.mitigationPlan ?? '', params.key),
  ])

  return {
    v: 1,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: params.kdf.iterations,
      saltB64: params.kdf.saltB64,
    },
    fields: { description, mitigationPlan },
  }
}

export const decryptRiskEncryptedFieldsV1 = async (params: {
  encryptedFields: RiskEncryptedFieldsV1
  key: CryptoKey
}): Promise<{ description: string; mitigationPlan: string }> => {
  const [description, mitigationPlan] = await Promise.all([
    params.encryptedFields.fields.description
      ? decryptString(params.encryptedFields.fields.description, params.key)
      : '',
    params.encryptedFields.fields.mitigationPlan
      ? decryptString(params.encryptedFields.fields.mitigationPlan, params.key)
      : '',
  ])

  return { description, mitigationPlan }
}
