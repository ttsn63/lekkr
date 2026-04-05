import { useQuery } from '@tanstack/react-query'
import { useAuthSession } from '@/hooks/useAuthSession'
import { supabase } from '@/lib/supabase'

type AdminCheck =
  | { ok: true; reason: 'ok' }
  | { ok: false; reason: 'no-session' | 'no-profile' | 'not-admin' }

/**
 * Prüft, ob der eingeloggte Nutzer Admin für den angegebenen tenant_id ist.
 * Liest immer `public.users` (nicht JWT-Claims).
 *
 * - queryKey enthält die User-ID, damit nach Login kein alter „nicht Admin“-Cache
 *   von vor der Session stehen bleibt.
 * - `tenant_id` in DB darf NULL sein (manuell angelegte Admins) oder mit dem
 *   aktuellen Mandanten übereinstimmen; andere Mandanten werden abgelehnt.
 */
export function useIsAdmin(tenantId: string) {
  const { user, loading: authLoading } = useAuthSession()
  const uid = user?.id

  return useQuery({
    queryKey: ['admin-role', tenantId, uid ?? ''],
    queryFn: async (): Promise<AdminCheck> => {
      if (!uid) return { ok: false, reason: 'no-session' }

      // Serverseitig (SECURITY DEFINER): gleiche Logik wie Migration, unabhängig von RLS/Spalten-Caching.
      const { data: isAdmin, error: rpcErr } = await supabase.rpc('is_tenant_admin', {
        p_tenant_id: tenantId,
      })

      if (rpcErr) {
        // Fallback, falls Migration noch nicht ausgerollt (ältere DB)
        const { data, error } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (!data) return { ok: false, reason: 'no-profile' }
        const roleOk = String(data.role ?? '')
          .trim()
          .toLowerCase() === 'admin'
        const rowTenant = data.tenant_id as string | null
        const tenantOk = rowTenant == null || rowTenant === tenantId
        return roleOk && tenantOk
          ? { ok: true, reason: 'ok' }
          : { ok: false, reason: 'not-admin' }
      }

      if (isAdmin === true) return { ok: true, reason: 'ok' }

      // RPC sagt nein: Zeile fehlt, falsche Rolle oder falscher Mandant
      const { data: row } = await supabase
        .from('users')
        .select('id')
        .eq('id', uid)
        .maybeSingle()
      if (!row) return { ok: false, reason: 'no-profile' }
      return { ok: false, reason: 'not-admin' }
    },
    enabled: Boolean(tenantId) && !authLoading && Boolean(uid),
    staleTime: 60_000,
  })
}
