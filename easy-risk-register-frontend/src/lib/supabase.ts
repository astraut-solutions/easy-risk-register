import { createClient } from '@supabase/supabase-js'

export type SupabaseEnv = {
  url: string
  key: string
}

let cachedClient: ReturnType<typeof createClient<any>> | null = null

function getPublishableKey() {
  return (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  )
}

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = getPublishableKey()

  if (!url || !key) return null
  return { url, key }
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient

  const env = getSupabaseEnv()
  if (!env) return null

  cachedClient = createClient<any>(env.url, env.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return cachedClient
}
