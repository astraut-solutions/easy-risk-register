const { handleOptions, setCors } = require('./_lib/http')
const { requireAdmin, requireAuth } = require('./_lib/auth')
const { logAuditEvent } = require('./_lib/logger')

module.exports = async function handler(req, res) {
  setCors(req, res)
  if (handleOptions(req, res)) return

  const user = requireAuth(req, res)
  if (!user) return

  switch (req.method) {
    case 'GET': {
      if (!requireAdmin(req, res)) return
      return res.status(200).json({
        logs: [
          {
            id: 1,
            userId: user.userId,
            username: user.username,
            action: 'login',
            resource: 'auth',
            timestamp: new Date().toISOString(),
            details: { ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress },
          },
        ],
      })
    }

    case 'POST': {
      const { action, resource, details } = req.body || {}
      if (!action || !resource) {
        return res.status(400).json({ error: 'Action and resource are required' })
      }
      logAuditEvent(user, action, resource, details)
      return res.status(200).json({ message: 'Audit event logged successfully' })
    }

    default:
      res.setHeader('allow', 'GET,POST,OPTIONS')
      return res.status(405).json({ error: 'Method not allowed' })
  }
}
