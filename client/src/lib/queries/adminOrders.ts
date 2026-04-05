import { supabase } from '@/lib/supabase'

export type AdminOrderRow = {
  id: string
  tenant_id: string
  order_number: string
  status: string
  total: number
  payment_status: string
  payment_method: string | null
  type: string
  created_at: string
  rejection_reason: string | null
}

const LIVE_STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'delivering']
const ARCHIVE_STATUSES = ['delivered', 'cancelled']

export async function fetchAdminOrders(
  tenantId: string,
  mode: 'live' | 'archive',
): Promise<AdminOrderRow[]> {
  const statuses = mode === 'live' ? LIVE_STATUSES : ARCHIVE_STATUSES
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, tenant_id, order_number, status, total, payment_status, payment_method, type, created_at, rejection_reason',
    )
    .eq('tenant_id', tenantId)
    .in('status', statuses)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AdminOrderRow[]
}

export async function rejectOrder(tenantId: string, orderId: string, rejectionReason: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      rejection_reason: rejectionReason,
    })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
