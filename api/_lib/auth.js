const jwt = require('jsonwebtoken')

const { getSupabaseAuthClient, getSupabaseUserClient, requireEnv } = require('./supabase')
const { logSecurityEvent } = require('./logger')
const { sendApiError, supabaseErrorToApiError, unexpectedErrorToApiError } = require('./apiErrors')

function getBearerToken(req) {
  const authHeader = req.headers?.authorization || ''
  const parts = String(authHeader).split(' ')
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) return parts[1]
  return null
}

function getOptionalJwtSecret() {
  try {
    return requireEnv('SUPABASE_JWT_SECRET')
  } catch {
    return null
  }
}

function hasNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function extractClaims(accessToken) {
  try {
    return jwt.decode(accessToken) || null
  } catch {
    return null
  }
}

function ensurePostgrestCompatibleToken({ accessToken, userId, jwtSecret }) {
  const claims = extractClaims(accessToken)

  const role = hasNonEmptyString(claims?.role) ? claims.role : null
  const aud = hasNonEmptyString(claims?.aud) ? claims.aud : null

  if (role && aud) return { token: accessToken, minted: false }
  if (!jwtSecret) return { token: accessToken, minted: false }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const safeExp = Number.isFinite(claims?.exp) ? claims.exp : null

  const payload = {
    sub: userId,
    role: role || 'authenticated',
    aud: aud || 'authenticated',
    iat: nowSeconds,
    exp: safeExp && safeExp > nowSeconds ? safeExp : nowSeconds + 60 * 60,
  }

  return {
    token: jwt.sign(payload, jwtSecret, { algorithm: 'HS256' }),
    minted: true,
  }
}

async function verifySupabaseJwt(accessToken) {
  const jwtSecret = getOptionalJwtSecret()
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
  if (error) {
    const apiError = supabaseErrorToApiError(error, { action: 'auth' })
    if (apiError.code === 'SUPABASE_UNREACHABLE') return { apiError }
    return null
  }
  if (!data?.user?.id) return null
  return { user: data.user, claims: null }
}

async function requireSupabaseAuth(req, res) {
  const accessToken = getBearerToken(req)
  if (!accessToken) {
    logSecurityEvent('missing_bearer_token', { path: req.url, requestId: req.requestId })
    sendApiError(req, res, { status: 401, code: 'UNAUTHENTICATED', message: 'Unauthenticated' })
    return null
  }

  try {
    const verified = await verifySupabaseJwt(accessToken)
    if (verified?.apiError) {
      logSecurityEvent('supabase_auth_unavailable', { path: req.url, requestId: req.requestId })
      sendApiError(req, res, verified.apiError)
      return null
    }
    if (!verified) {
      logSecurityEvent('invalid_supabase_jwt', { path: req.url, requestId: req.requestId })
      sendApiError(req, res, { status: 401, code: 'UNAUTHENTICATED', message: 'Unauthenticated' })
      return null
    }

    const jwtSecret = getOptionalJwtSecret()
    const { token: postgrestToken, minted } = ensurePostgrestCompatibleToken({
      accessToken,
      userId: verified.user.id,
      jwtSecret,
    })

    if (minted) {
      logSecurityEvent('minted_postgrest_jwt', { path: req.url, requestId: req.requestId })
    }

    const supabase = getSupabaseUserClient(postgrestToken)
    return { user: verified.user, accessToken, supabase }
  } catch (error) {
    logSecurityEvent('supabase_auth_error', { path: req.url, requestId: req.requestId })
    const apiError = unexpectedErrorToApiError(error)
    sendApiError(req, res, apiError)
    return null
  }
}

module.exports = { requireSupabaseAuth }
