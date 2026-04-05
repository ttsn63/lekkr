import { useQuery } from '@tanstack/react-query'
import { fetchTenantSettings } from '@/lib/queries/tenantSettings'

export function useTenantSettingsQuery(tenantId: string) {
  return useQuery({
    queryKey: ['tenant_settings', tenantId],
    queryFn: () => fetchTenantSettings(tenantId),
  })
}
