import { supabase } from '@/lib/supabase'

export type OrderWithItems = {
  id: string
  tenant_id: string
  user_id: string | null
  order_number: string
  type: 'delivery' | 'pickup'
  status: string
  subtotal: number
  delivery_fee: number
  tip_amount: number
  total: number
  payment_method: string | null
  payment_status: string
  stripe_checkout_session_id: string | null
  delivery_address: Record<string, string> | null
  created_at: string
  order_items: Array<{
    id: string
    product_id: string | null
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export async function fetchOrderWithItems(
  tenantId: string,
  orderId: string,
): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id,
      tenant_id,
      user_id,
      order_number,
      type,
      status,
      subtotal,
      delivery_fee,
      tip_amount,
      total,
      payment_method,
      payment_status,
      stripe_checkout_session_id,
      delivery_address,
      created_at,
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        total_price
      )
    `,
    )
    .eq('tenant_id', tenantId)
    .eq('id', orderId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const row = data as OrderWithItems & { order_items?: OrderWithItems['order_items'] }
  return {
    ...row,
    order_items: Array.isArray(row.order_items) ? row.order_items : [],
  }
}
