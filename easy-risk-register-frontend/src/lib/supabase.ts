import { createClient } from '@supabase/supabase-js'

export type SupabaseEnv = {
  url: string
  anonKey: string
}

let cachedClient: ReturnType<typeof createClient<any>> | null = null

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function getSupabaseClient() {
  if (cachedClient) return cachedClient

  const env = getSupabaseEnv()
  if (!env) return null

  cachedClient = createClient<any>(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return cachedClient
}
