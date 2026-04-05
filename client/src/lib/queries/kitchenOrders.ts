import { supabase } from '@/lib/supabase'

export type KitchenOrderItemRow = {
  id: string
  quantity: number
  unit_price: number
  product_id: string | null
  /** Supabase liefert je nach Join Objekt oder Array */
  products: { name: string } | { name: string }[] | null
}

export type KitchenOrderRow = {
  id: string
  tenant_id: string
  order_number: string
  status: string
  type: string
  total: number
  created_at: string
  notes: string | null
  delivery_address: Record<string, unknown> | null
  order_items: KitchenOrderItemRow[] | null
}

const KITCHEN_STATUSES = ['new', 'confirmed', 'preparing', 'ready'] as const

export async function fetchKitchenOrders(tenantId: string): Promise<KitchenOrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      tenant_id,
      order_number,
      status,
      type,
      total,
      created_at,
      notes,
      delivery_address,
      order_items (
        id,
        quantity,
        unit_price,
        product_id,
        products ( name )
      )
    `,
    )
    .eq('tenant_id', tenantId)
    .in('status', [...KITCHEN_STATUSES])
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as KitchenOrderRow[]
}

export async function updateOrderKitchenStatus(
  tenantId: string,
  orderId: string,
  status: string,
) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)

  if (error) throw error
}
