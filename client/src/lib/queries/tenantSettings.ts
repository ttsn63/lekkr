import { supabase } from '@/lib/supabase'

export type TenantSettingsRow = {
  id: string
  tenant_id: string
  min_order_value: number
  delivery_fee: number
  free_delivery_from: number
}

export async function fetchTenantSettings(tenantId: string): Promise<TenantSettingsRow | null> {
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) throw error
  return data as TenantSettingsRow | null
}
