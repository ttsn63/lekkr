import { supabase } from '@/lib/supabase'
import type { BundleConfig } from '@/lib/coupons/computeDiscount'
import { mapCouponRow, type CouponRow } from '@/lib/queries/couponsPublic'

export type CouponInsert = {
  tenant_id: string
  code: string
  name: string
  description: string | null
  type: 'percent' | 'fixed' | 'bundle' | 'free'
  value: number | null
  min_order_value: number
  max_uses: number | null
  valid_from: string | null
  valid_until: string | null
  target: 'all' | 'new_customers' | 'specific'
  active: boolean
  bundle_config: BundleConfig | null
  free_product_id: string | null
  birthday_auto: boolean
  max_uses_per_user: number
}

export async function fetchAdminCoupons(tenantId: string): Promise<CouponRow[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapCouponRow(r as Record<string, unknown>))
}

export async function insertCoupon(row: CouponInsert) {
  const { error } = await supabase.from('coupons').insert({
    ...row,
    code: row.code.trim().toUpperCase(),
  })
  if (error) throw error
}

export async function updateCoupon(tenantId: string, id: string, patch: Partial<CouponInsert>) {
  const payload: Record<string, unknown> = { ...patch }
  if (patch.code != null) payload.code = patch.code.trim().toUpperCase()
  const { error } = await supabase.from('coupons').update(payload).eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}

export async function deleteCoupon(tenantId: string, id: string) {
  const { error } = await supabase.from('coupons').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}

export type CouponUsageStat = {
  coupon_id: string
  code: string
  name: string
  usage_count: number
  discount_sum: number
}

export async function fetchCouponUsageStats(tenantId: string): Promise<CouponUsageStat[]> {
  const { data: usages, error: uErr } = await supabase
    .from('coupon_usages')
    .select('coupon_id, discount_amount')
    .eq('tenant_id', tenantId)

  if (uErr) throw uErr
  if (!usages?.length) return []

  const ids = [...new Set(usages.map((u) => u.coupon_id).filter(Boolean) as string[])]
  const { data: meta, error: mErr } = await supabase
    .from('coupons')
    .select('id, code, name')
    .eq('tenant_id', tenantId)
    .in('id', ids)

  if (mErr) throw mErr
  const metaMap = new Map((meta ?? []).map((m) => [m.id as string, m]))

  const map = new Map<string, CouponUsageStat>()
  for (const row of usages) {
    const cid = row.coupon_id as string
    const m = metaMap.get(cid)
    if (!m) continue
    const prev = map.get(cid) ?? {
      coupon_id: cid,
      code: m.code as string,
      name: m.name as string,
      usage_count: 0,
      discount_sum: 0,
    }
    prev.usage_count += 1
    prev.discount_sum += Number(row.discount_amount ?? 0)
    map.set(cid, prev)
  }
  return [...map.values()].sort((a, b) => b.discount_sum - a.discount_sum)
}
