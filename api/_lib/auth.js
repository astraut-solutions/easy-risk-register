const jwt = require('jsonwebtoken')

const { getSupabaseAuthClient, getSupabaseUserClient } = require('./supabase')
const { logSecurityEvent } = require('./logger')

function getBearerToken(req) {
  const authHeader = req.headers?.authorization || ''
  const parts = String(authHeader).split(' ')
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) return parts[1]
  return null
}

async function verifySupabaseJwt(accessToken) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (jwtSecret) {
    try {
      const claims = jwt.verify(accessToken, jwtSecret, { algorithms: ['HS256'] })
      const userId = typeof claims?.sub === 'string' ? claims.sub : null
      if (!userId) return null
      return { user: { id: userId }, claims }
    } catch {
      return null
    }
  }

  const supabase = getSupabaseAuthClient()
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data?.user?.id) return null
  return { user: data.user, claims: null }
}

async function requireSupabaseAuth(req, res) {
  const accessToken = getBearerToken(req)
  if (!accessToken) {
    logSecurityEvent('missing_bearer_token', { path: req.url, requestId: req.requestId })
    res.status(401).json({ error: 'Unauthenticated' })
    return null
  }

  try {
    const verified = await verifySupabaseJwt(accessToken)
    if (!verified) {
      logSecurityEvent('invalid_supabase_jwt', { path: req.url, requestId: req.requestId })
      res.status(401).json({ error: 'Unauthenticated' })
      return null
    }

    const supabase = getSupabaseUserClient(accessToken)
    return { user: verified.user, accessToken, supabase }
  } catch {
    logSecurityEvent('supabase_auth_error', { path: req.url, requestId: req.requestId })
    res.status(401).json({ error: 'Unauthenticated' })
    return null
  }
}

module.exports = { requireSupabaseAuth }
