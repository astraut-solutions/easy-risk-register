const { handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const ctx = await requireApiContext(req, res)
  if (!ctx) return

  // Placeholder: backend implementation was empty.
  return res.status(501).json({ error: 'Not implemented' })
}
