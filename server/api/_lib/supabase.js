const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

let cachedDotEnv = null

function loadLocalDotEnv() {
  if (cachedDotEnv) return cachedDotEnv
  cachedDotEnv = {}

  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ]

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split(/\r?\n/)

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const eqIndex = trimmed.indexOf('=')
        if (eqIndex < 1) continue

        const key = trimmed.slice(0, eqIndex).trim()
        let value = trimmed.slice(eqIndex + 1).trim()

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }

        if (key && value) cachedDotEnv[key] = value
      }
    } catch {
      // ignore
    }
  }

  return cachedDotEnv
}

function getEnv(name) {
  const direct = process.env[name]
  if (direct) return direct

  // Dev convenience: allow `api-dev` (and other local runs) to use the repo-root `.env.local`
  // without requiring callers to export the env vars in their shell.
  const local = loadLocalDotEnv()[name]
  if (local) return local

  return null
}

function requireEnv(name) {
  const value = getEnv(name)
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`)
    error.code = 'MISSING_ENV'
    throw error
  }
  return value
}

function requireSupabaseUrl() {
  const value = process.env.SUPABASE_URL_INTERNAL || getEnv('SUPABASE_URL')
  if (!value) {
    const error = new Error('Missing required environment variable: SUPABASE_URL')
    error.code = 'MISSING_ENV'
    throw error
  }
  return value
}

function requireSupabaseServiceRoleKey() {
  const explicit = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (explicit) return explicit
  return requireEnv('SUPABASE_SERVICE_KEY')
}

function getSupabaseAdmin() {
  const url = requireSupabaseUrl()
  const key = requireSupabaseServiceRoleKey()

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getSupabaseAuthClient() {
  const url = requireSupabaseUrl()
  const anonKey = requireEnv('SUPABASE_ANON_KEY')

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function getSupabaseUserClient(accessToken) {
  const url = requireSupabaseUrl()
  const anonKey = requireEnv('SUPABASE_ANON_KEY')

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

module.exports = { getSupabaseAdmin, getSupabaseAuthClient, getSupabaseUserClient, requireEnv }
