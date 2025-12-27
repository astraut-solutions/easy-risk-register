const { createClient } = require('@supabase/supabase-js')

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    const error = new Error(`Missing required environment variable: ${name}`)
    error.code = 'MISSING_ENV'
    throw error
  }
  return value
}

function getSupabaseAdmin() {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getSupabaseAuthClient() {
  const url = requireEnv('SUPABASE_URL')
  const anonKey = requireEnv('SUPABASE_ANON_KEY')

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function getSupabaseUserClient(accessToken) {
  const url = requireEnv('SUPABASE_URL')
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
