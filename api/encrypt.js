// Back-compat placeholder (backend/api/encrypt.js was empty).
// Use `/api/data-protection` for encrypt/decrypt operations.
module.exports = function handler(_req, res) {
  res.status(410).json({ error: 'Deprecated. Use /api/data-protection' })
}

