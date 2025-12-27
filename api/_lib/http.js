const crypto = require('crypto')

function generateRequestId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return crypto.randomBytes(16).toString('hex')
}

function ensureRequestId(req, res) {
  const headerValue = Array.isArray(req.headers?.['x-request-id'])
    ? req.headers['x-request-id'][0]
    : req.headers?.['x-request-id']

  const requestId = typeof headerValue === 'string' && headerValue.trim() ? headerValue.trim() : generateRequestId()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)
  return requestId
}

function setCors(req, res) {
  const origin = req.headers?.origin
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Expose-Headers', 'x-request-id')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Workspace-Id, X-Request-Id, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
  )
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

module.exports = { ensureRequestId, handleOptions, setCors }
