const { handleOptions, setCors } = require('./_lib/http')
const { requireAdmin, requireAuth } = require('./_lib/auth')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const user = requireAuth(req, res)
  if (!user) return

  switch (req.method) {
    case 'GET': {
      if (!requireAdmin(req, res)) return
      return res.status(200).json({
        users: [
          { id: 1, username: 'admin', role: 'admin' },
          { id: 2, username: 'user', role: 'user' },
        ],
      })
    }

    case 'POST': {
      if (!requireAdmin(req, res)) return
      const { username, password, role } = req.body || {}
      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' })
      }
      return res.status(201).json({
        message: 'User created successfully',
        user: { id: 3, username, role },
      })
    }

    default:
      res.setHeader('allow', 'GET,POST,OPTIONS')
      return res.status(405).json({ error: 'Method not allowed' })
  }
}
