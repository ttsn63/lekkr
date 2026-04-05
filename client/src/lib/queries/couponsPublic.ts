import { supabase } from '@/lib/supabase'
import type { CouponInput } from '@/lib/coupons/computeDiscount'

export type CouponRow = CouponInput & {
  tenant_id: string
  code: string
  name: string
  description: string | null
  created_at?: string
}


export function mapCouponRow(row: Record<string, unknown>): CouponRow {
  return {
    id: row.id as string,
    tenant_id: row.tenant_id as string,
    code: row.code as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    type: row.type as CouponRow['type'],
    value: row.value != null ? Number(row.value) : null,
    min_order_value: Number(row.min_order_value ?? 0),
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    used_count: Number(row.used_count ?? 0),
    valid_from: (row.valid_from as string | null) ?? null,
    valid_until: (row.valid_until as string | null) ?? null,
    target: row.target as CouponRow['target'],
    active: Boolean(row.active),
    bundle_config: (row.bundle_config as CouponRow['bundle_config']) ?? null,
    free_product_id: (row.free_product_id as string | null) ?? null,
    birthday_auto: Boolean(row.birthday_auto),
    max_uses_per_user: Number(row.max_uses_per_user ?? 1),
  }
}

export async function fetchActiveCoupons(tenantId: string): Promise<CouponRow[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapCouponRow(r as Record<string, unknown>))
}

export async function fetchCouponByCode(
  tenantId: string,
  code: string,
): Promise<CouponRow | null> {
  const normalized = code.trim().toUpperCase()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('code', normalized)
    .maybeSingle()

  if (error) throw error
  return data ? mapCouponRow(data as Record<string, unknown>) : null
}
