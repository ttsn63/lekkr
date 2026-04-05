import { createClient } from '@supabase/supabase-js'

export function getSupabaseUrl(): string {
  const u = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  if (!u) throw new Error('SUPABASE_URL oder VITE_SUPABASE_URL fehlt.')
  return u
}

export function createSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt.')
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function verifyUserJwt(jwt: string | undefined) {
  if (!jwt) return { user: null as null, error: 'Kein Token' }
  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!anon) return { user: null as null, error: 'Anon Key fehlt' }
  const supabase = createClient(getSupabaseUrl(), anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(jwt)
  if (error || !data.user) return { user: null as null, error: error?.message ?? 'Ungültige Session' }
  return { user: data.user, error: null as null }
}
