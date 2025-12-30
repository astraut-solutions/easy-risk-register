function parseContentLength(req) {
  const raw = Array.isArray(req.headers?.['content-length'])
    ? req.headers['content-length'][0]
    : req.headers?.['content-length']

  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const num = Number.parseInt(trimmed, 10)
  return Number.isFinite(num) && num >= 0 ? num : null
}

async function readJsonBody(req, { maxBytes = 256 * 1024 } = {}) {
  if (req.body && typeof req.body === 'object') return req.body

  const declaredBytes = parseContentLength(req)
  if (typeof maxBytes === 'number' && Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
    const error = new Error('Request payload too large')
    error.statusCode = 413
    error.code = 'PAYLOAD_TOO_LARGE'
    throw error
  }

  const chunks = []
  let totalBytes = 0
  for await (const chunk of req) {
    const buf = Buffer.from(chunk)
    totalBytes += buf.length
    if (typeof maxBytes === 'number' && totalBytes > maxBytes) {
      const error = new Error('Request payload too large')
      error.statusCode = 413
      error.code = 'PAYLOAD_TOO_LARGE'
      throw error
    }
    chunks.push(buf)
  }
  if (chunks.length === 0) return null

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (cause) {
    const error = new Error('Invalid JSON body')
    error.statusCode = 400
    error.code = 'INVALID_JSON'
    error.cause = cause
    throw error
  }
}

module.exports = { readJsonBody }
