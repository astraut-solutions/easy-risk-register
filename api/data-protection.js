const { handleOptions, setCors } = require('./_lib/http')
const { requireAuth } = require('./_lib/auth')
const { decrypt, encrypt } = require('./_lib/encryption')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const user = requireAuth(req, res)
  if (!user) return

  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST,OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, data } = req.body || {}
  if (!action || !data) {
    return res.status(400).json({ error: 'Action and data are required' })
  }

  try {
    if (action === 'encrypt') {
      return res.status(200).json({ encrypted: encrypt(data) })
    }
    if (action === 'decrypt') {
      return res.status(200).json({ decrypted: decrypt(data) })
    }
    return res.status(400).json({ error: 'Invalid action. Use "encrypt" or "decrypt"' })
  } catch (error) {
    const message = error?.code === 'MISSING_ENV' ? error.message : 'Encryption/Decryption failed'
    return res.status(500).json({ error: message })
  }
}
