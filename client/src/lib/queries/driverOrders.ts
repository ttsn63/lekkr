import { supabase } from '@/lib/supabase'

export type DriverOrderItemRow = {
  id: string
  quantity: number
  unit_price: number
  product_id: string | null
  products: { name: string } | { name: string }[] | null
}

export type DriverOrderRow = {
  id: string
  tenant_id: string
  order_number: string
  status: string
  type: string
  total: number
  created_at: string
  driver_id: string | null
  notes: string | null
  delivery_address: Record<string, unknown> | null
  driver_lat: number | null
  driver_lng: number | null
  driver_location_updated_at: string | null
  order_items: DriverOrderItemRow[] | null
}

const driverOrderSelect = `
  id,
  tenant_id,
  order_number,
  status,
  type,
  total,
  created_at,
  driver_id,
  notes,
  delivery_address,
  driver_lat,
  driver_lng,
  driver_location_updated_at,
  order_items (
    id,
    quantity,
    unit_price,
    product_id,
    products ( name )
  )
`

export async function fetchDriverOrders(
  tenantId: string,
  userId: string,
): Promise<DriverOrderRow[]> {
  const [assigned, open] = await Promise.all([
    supabase
      .from('orders')
      .select(driverOrderSelect)
      .eq('tenant_id', tenantId)
      .eq('driver_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select(driverOrderSelect)
      .eq('tenant_id', tenantId)
      .eq('type', 'delivery')
      .eq('status', 'ready')
      .is('driver_id', null)
      .order('created_at', { ascending: true }),
  ])

  if (assigned.error) throw assigned.error
  if (open.error) throw open.error

  const map = new Map<string, DriverOrderRow>()
  for (const row of assigned.data ?? []) {
    map.set(row.id, row as unknown as DriverOrderRow)
  }
  for (const row of open.data ?? []) {
    map.set(row.id, row as unknown as DriverOrderRow)
  }

  return [...map.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

export async function claimDeliveryOrder(tenantId: string, orderId: string, userId: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      driver_id: userId,
      status: 'delivering',
    })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .eq('type', 'delivery')
    .is('driver_id', null)
    .eq('status', 'ready')

  if (error) throw error
}

export async function assignDriverToOrder(
  tenantId: string,
  orderId: string,
  driverUserId: string,
) {
  const { error } = await supabase
    .from('orders')
    .update({
      driver_id: driverUserId,
      status: 'delivering',
    })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .eq('type', 'delivery')
    .eq('status', 'ready')

  if (error) throw error
}

export async function updateDriverGps(
  tenantId: string,
  orderId: string,
  lat: number,
  lng: number,
) {
  const { error } = await supabase
    .from('orders')
    .update({
      driver_lat: lat,
      driver_lng: lng,
      driver_location_updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export async function markOrderDelivered(tenantId: string, orderId: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export type DriverUserRow = {
  id: string
  email: string
  name: string | null
}

export async function fetchDriversForTenant(tenantId: string): Promise<DriverUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('tenant_id', tenantId)
    .eq('role', 'driver')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as DriverUserRow[]
}
