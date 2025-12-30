const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { decrypt, encrypt } = require('./_lib/encryption')
const { logApiError, logApiRequest, logApiResponse } = require('./_lib/logger')

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  let ctx = null
  try {
    ctx = await requireApiContext(req, res)
    if (!ctx) return

    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST,OPTIONS')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { action, data } = req.body || {}
    if (!action || !data) {
      return res.status(400).json({ error: 'Action and data are required' })
    }

    if (action === 'encrypt') {
      return res.status(200).json({ encrypted: encrypt(data) })
    }
    if (action === 'decrypt') {
      return res.status(200).json({ decrypted: decrypt(data) })
    }
    return res.status(400).json({ error: 'Invalid action. Use "encrypt" or "decrypt"' })
  } catch (error) {
    logApiError({
      requestId,
      method: req.method,
      path: req.url,
      userId: ctx?.user?.id,
      workspaceId: ctx?.workspaceId,
      error,
    })
    return res.status(500).json({ error: 'Encryption/Decryption failed' })
  } finally {
    logApiResponse({
      requestId,
      method: req.method,
      path: req.url,
      status: res.statusCode,
      durationMs: Date.now() - start,
    })
  }
}
