import { supabase } from '@/lib/supabase'

export type DashboardStats = {
  revenueTotal: number
  revenue30d: number
  ordersPaidCount: number
  ordersOpenCount: number
  ordersMonthCount: number
}

const LIVE = ['new', 'confirmed', 'preparing', 'ready', 'delivering']

export async function fetchDashboardStats(tenantId: string): Promise<DashboardStats> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, payment_status, created_at, status')
    .eq('tenant_id', tenantId)

  if (error) throw error

  const now = Date.now()
  const d30 = now - 30 * 24 * 60 * 60 * 1000
  const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

  let revenueTotal = 0
  let revenue30d = 0
  let ordersPaidCount = 0
  let ordersOpenCount = 0
  let ordersMonthCount = 0

  for (const o of orders ?? []) {
    const t = new Date(o.created_at as string).getTime()
    const paid = o.payment_status === 'paid'
    if (paid) {
      revenueTotal += Number(o.total)
      ordersPaidCount++
      if (t >= d30) revenue30d += Number(o.total)
    }
    if (t >= startMonth) ordersMonthCount++
    if (LIVE.includes(o.status as string)) ordersOpenCount++
  }

  return {
    revenueTotal,
    revenue30d,
    ordersPaidCount,
    ordersOpenCount,
    ordersMonthCount,
  }
}
