import { supabase } from '@/lib/supabase'

export type TenantSettingsRow = {
  id: string
  tenant_id: string
  min_order_value: number
  delivery_fee: number
  free_delivery_from: number
  company_display_name?: string | null
  legal_impressum?: string | null
  legal_privacy?: string | null
  legal_terms?: string | null
  referral_reward_amount?: number | null
}

export async function fetchTenantName(tenantId: string): Promise<{ name: string; slug: string } | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', tenantId)
    .maybeSingle()
  if (error) throw error
  return data as { name: string; slug: string } | null
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
