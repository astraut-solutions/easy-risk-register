const { handleOptions, setCors } = require('./_lib/http')
const { requireAuth } = require('./_lib/auth')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const user = requireAuth(req, res)
  if (!user) return

  // Placeholder: backend implementation was empty.
  return res.status(501).json({ error: 'Not implemented' })
}
