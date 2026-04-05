import type { SupabaseClient } from '@supabase/supabase-js'
import {
  computeCouponDiscount,
  type CouponInput,
  type CartLine,
} from './coupon-pricing'

export type ValidateCouponParams = {
  tenantId: string
  userId: string
  couponCode: string | null | undefined
  bundleProductIds: string[] | null | undefined
  lines: CartLine[]
  productMap: Map<string, { price: number }>
}

export type ValidateCouponResult =
  | { ok: true; discount: number; coupon: CouponInput | null }
  | { ok: false; error: string }

function mapRow(row: Record<string, unknown>): CouponInput {
  return {
    id: row.id as string,
    type: row.type as CouponInput['type'],
    value: row.value != null ? Number(row.value) : null,
    min_order_value: Number(row.min_order_value ?? 0),
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    used_count: Number(row.used_count ?? 0),
    valid_from: (row.valid_from as string | null) ?? null,
    valid_until: (row.valid_until as string | null) ?? null,
    target: row.target as CouponInput['target'],
    active: Boolean(row.active),
    bundle_config: (row.bundle_config as CouponInput['bundle_config']) ?? null,
    free_product_id: (row.free_product_id as string | null) ?? null,
    birthday_auto: Boolean(row.birthday_auto),
    max_uses_per_user: Number(row.max_uses_per_user ?? 1),
  }
}

export async function validateCouponForOrder(
  admin: SupabaseClient,
  p: ValidateCouponParams,
): Promise<ValidateCouponResult> {
  const code = p.couponCode?.trim()
  if (!code) {
    return { ok: true, discount: 0, coupon: null }
  }

  const normalizedCode = code.trim().toUpperCase()

  const { data: couponRow, error: cErr } = await admin
    .from('coupons')
    .select('*')
    .eq('tenant_id', p.tenantId)
    .eq('code', normalizedCode)
    .maybeSingle()

  if (cErr || !couponRow) {
    return { ok: false, error: 'Coupon ungültig' }
  }

  const coupon = mapRow(couponRow as Record<string, unknown>)

  let subtotal = 0
  for (const line of p.lines) {
    const pr = p.productMap.get(line.productId)
    if (!pr) return { ok: false, error: 'Produkt fehlt' }
    subtotal += Number(pr.price) * line.quantity
  }

  const { data: userRow } = await admin
    .from('users')
    .select('birthday')
    .eq('id', p.userId)
    .maybeSingle()

  const { count: orderCount } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', p.tenantId)
    .eq('user_id', p.userId)

  const { count: usageCount } = await admin
    .from('coupon_usages')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', coupon.id)
    .eq('user_id', p.userId)

  if ((usageCount ?? 0) >= coupon.max_uses_per_user) {
    return { ok: false, error: 'Coupon bereits eingelöst (Limit)' }
  }

  const productPrice = (id: string) => {
    const x = p.productMap.get(id)
    return x != null ? Number(x.price) : undefined
  }

  const { discount, error } = computeCouponDiscount(coupon, {
    subtotal,
    lines: p.lines,
    productPrice,
    userOrderCount: orderCount ?? 0,
    userBirthday: (userRow?.birthday as string | null) ?? null,
    bundleProductIds: p.bundleProductIds ?? null,
  })

  if (error || discount <= 0) {
    return { ok: false, error: 'Coupon passt nicht zum Warenkorb' }
  }

  return { ok: true, discount, coupon }
}
