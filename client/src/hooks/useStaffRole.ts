import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type StaffRoleResult = {
  id: string
  role: string
  tenant_id: string | null
  canKitchen: boolean
  canDriver: boolean
  /** Admin oder Küche: Fahrer zuweisen */
  canAssignDrivers: boolean
}

/**
 * Profil + Berechtigung für Küche/Fahrer (inkl. Admin für beide Bereiche).
 * tenant_id muss zum aktuellen Mandanten passen.
 */
export function useStaffRole(tenantId: string) {
  return useQuery({
    queryKey: ['staff-role', tenantId],
    queryFn: async (): Promise<StaffRoleResult | null> => {
      const { data: sessionData } = await supabase.auth.getSession()
      const uid = sessionData.session?.user?.id
      if (!uid) return null

      const { data, error } = await supabase
        .from('users')
        .select('id, role, tenant_id')
        .eq('id', uid)
        .maybeSingle()

      if (error) throw error
      if (!data?.tenant_id || data.tenant_id !== tenantId) return null

      const role = data.role
      return {
        id: data.id,
        role,
        tenant_id: data.tenant_id,
        canKitchen: role === 'admin' || role === 'kitchen',
        canDriver: role === 'admin' || role === 'driver',
        canAssignDrivers: role === 'admin' || role === 'kitchen',
      }
    },
    enabled: Boolean(tenantId),
  })
}
