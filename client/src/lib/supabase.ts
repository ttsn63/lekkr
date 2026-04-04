import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Supabase: VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY müssen in der .env gesetzt sein.',
  )
}

/**
 * Browser-Client für Supabase Auth und Datenabfragen.
 * Alle Tabellenabfragen müssen tenant_id filtern (Multitenant).
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
