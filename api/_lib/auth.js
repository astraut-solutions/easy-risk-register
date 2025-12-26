const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    const error = new Error('JWT_SECRET must be set in production')
    error.code = 'MISSING_ENV'
    throw error
  }

  return 'dev-insecure-jwt-secret'
}

// In-memory user storage (in production, use a proper database)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
  },
  {
    id: 2,
    username: 'user',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'user',
  },
]

function getBearerToken(req) {
  const authHeader = req.headers?.authorization || ''
  const parts = authHeader.split(' ')
  if (parts.length === 2 && /^bearer$/i.test(parts[0])) return parts[1]
  return null
}

function requireAuth(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return null
  }

  try {
    const user = jwt.verify(token, getJwtSecret())
    req.user = user
    return user
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' })
    return null
  }
}

function requireAdmin(req, res) {
  const user = req.user
  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return false
  }
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' })
    return false
  }
  return true
}

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    getJwtSecret(),
    { expiresIn: '24h' },
  )
}

function findUserByUsername(username) {
  return users.find((u) => u.username === username)
}

async function validatePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

module.exports = {
  findUserByUsername,
  generateToken,
  requireAdmin,
  requireAuth,
  validatePassword,
}

