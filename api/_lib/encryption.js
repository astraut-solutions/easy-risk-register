const crypto = require('crypto')

function getKeyBytes() {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('ENCRYPTION_KEY must be set in production')
      error.code = 'MISSING_ENV'
      throw error
    }

    // Stable dev fallback so decrypt works across invocations locally.
    return crypto.createHash('sha256').update('dev-insecure-encryption-key').digest()
  }

  // Allow hex(64) or base64.
  const hexLike = /^[0-9a-f]+$/i.test(raw) && raw.length === 64
  if (hexLike) return Buffer.from(raw, 'hex')

  const buf = Buffer.from(raw, 'base64')
  if (buf.length === 32) return buf

  // As a last resort, hash whatever was provided into 32 bytes.
  return crypto.createHash('sha256').update(raw).digest()
}

function encrypt(plaintext) {
  const key = getKeyBytes()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Format: v1:<iv>:<tag>:<ciphertext> (all base64)
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`
}

function decrypt(payload) {
  const text = String(payload)
  const parts = text.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Unsupported encrypted payload format')
  }

  const [, ivB64, tagB64, ctB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')

  const key = getKeyBytes()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

module.exports = { decrypt, encrypt }

