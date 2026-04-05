import type { SupabaseClient } from '@supabase/supabase-js'

export async function alreadyDispatched(
  admin: SupabaseClient,
  tenantId: string,
  orderId: string | null,
  kind: string,
): Promise<boolean> {
  if (!orderId) return false
  const { data } = await admin
    .from('notification_dispatch_log')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .eq('kind', kind)
    .maybeSingle()
  return Boolean(data)
}

export async function logDispatch(
  admin: SupabaseClient,
  tenantId: string,
  orderId: string | null,
  kind: string,
  channel: 'email' | 'sms' = 'email',
  userId?: string | null,
) {
  const { error } = await admin.from('notification_dispatch_log').insert({
    tenant_id: tenantId,
    order_id: orderId,
    user_id: userId ?? null,
    kind,
    channel,
  })
  if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
    console.error('[notification_dispatch]', error.message)
  }
}
