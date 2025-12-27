const { ensureRequestId, handleOptions, setCors } = require('./_lib/http')
const { requireApiContext } = require('./_lib/context')
const { logApiError, logApiRequest, logApiResponse, logAuditEvent } = require('./_lib/logger')

module.exports = async function handler(req, res) {
  setCors(req, res)
  const requestId = ensureRequestId(req, res)
  if (handleOptions(req, res)) return

  const start = Date.now()
  logApiRequest({ requestId, method: req.method, path: req.url, origin: req.headers?.origin })

  try {
    const ctx = await requireApiContext(req, res)
    if (!ctx) return

    switch (req.method) {
      case 'GET': {
        return res.status(501).json({ error: 'Not implemented' })
      }

      case 'POST': {
        const { action, resource, details } = req.body || {}
        if (!action || !resource) {
          return res.status(400).json({ error: 'Action and resource are required' })
        }
        logAuditEvent(ctx.user, action, resource, details)
        return res.status(200).json({ message: 'Audit event logged successfully' })
      }

      default:
        res.setHeader('allow', 'GET,POST,OPTIONS')
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    logApiError({ requestId, method: req.method, path: req.url, error })
    return res.status(500).json({ error: 'Unexpected API error' })
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
