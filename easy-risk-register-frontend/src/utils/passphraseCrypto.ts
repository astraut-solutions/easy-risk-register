const encoder = new TextEncoder()
const decoder = new TextDecoder()

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

const base64ToBytes = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

export const generateSalt = (length = 16) => window.crypto.getRandomValues(new Uint8Array(length))

export const deriveAesKeyFromPassphrase = async (params: {
  passphrase: string
  salt: Uint8Array
  iterations: number
}) => {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(params.passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  const saltBuffer = params.salt.buffer.slice(
    params.salt.byteOffset,
    params.salt.byteOffset + params.salt.byteLength,
  ) as ArrayBuffer

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: params.iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export type EncryptedPayloadV1 = {
  v: 1
  ivB64: string
  ctB64: string
}

export const encryptString = async (plaintext: string, key: CryptoKey): Promise<EncryptedPayloadV1> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  )

  return {
    v: 1,
    ivB64: bytesToBase64(iv),
    ctB64: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export const decryptString = async (payload: EncryptedPayloadV1, key: CryptoKey): Promise<string> => {
  const iv = base64ToBytes(payload.ivB64)
  const ciphertext = base64ToBytes(payload.ctB64)
  const plaintext = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return decoder.decode(plaintext)
}

export const encodeSaltB64 = (salt: Uint8Array) => bytesToBase64(salt)
export const decodeSaltB64 = (saltB64: string) => base64ToBytes(saltB64)
