import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Prüft, ob der eingeloggte Nutzer Admin für den angegebenen tenant_id ist.
 * Alle Admin-Aktionen müssen zusätzlich tenant_id in Abfragen setzen.
 */
export function useIsAdmin(tenantId: string) {
  return useQuery({
    queryKey: ['admin-role', tenantId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user?.id
      if (!uid) return { ok: false as const, reason: 'no-session' as const }

      const { data, error } = await supabase
        .from('users')
        .select('role, tenant_id')
        .eq('id', uid)
        .maybeSingle()

      if (error) throw error
      if (!data) return { ok: false as const, reason: 'no-profile' as const }
      const ok = data.role === 'admin' && data.tenant_id === tenantId
      return { ok, reason: ok ? ('ok' as const) : ('not-admin' as const) }
    },
    enabled: Boolean(tenantId),
  })
}
