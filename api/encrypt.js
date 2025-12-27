// Back-compat placeholder (backend/api/encrypt.js was empty).
// Use `/api/data-protection` for encrypt/decrypt operations.
const { handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const ctx = await requireApiContext(req, res)
  if (!ctx) return

  res.status(410).json({ error: 'Deprecated. Use /api/data-protection' })
}
