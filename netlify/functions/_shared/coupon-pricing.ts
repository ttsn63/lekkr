/**
 * Rabattlogik – mit client/src/lib/coupons/computeDiscount.ts abgleichen.
 */

export type CouponType = 'percent' | 'fixed' | 'bundle' | 'free'

export type BundleConfig = {
  eligible_product_ids: string[]
  pick_count: number
  discount_mode: 'percent' | 'fixed'
  discount_value: number
}

export type CouponInput = {
  id: string
  type: CouponType
  value: number | null
  min_order_value: number
  max_uses: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  target: 'all' | 'new_customers' | 'specific'
  active: boolean
  bundle_config: BundleConfig | null
  free_product_id: string | null
  birthday_auto: boolean
  max_uses_per_user: number
}

export type CartLine = { productId: string; quantity: number }

export type DiscountContext = {
  subtotal: number
  lines: CartLine[]
  productPrice: (productId: string) => number | undefined
  userOrderCount: number
  userBirthday: string | null
  bundleProductIds: string[] | null
  now?: Date
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function isSameMonthDay(isoBirth: string, ref: Date): boolean {
  const d = new Date(isoBirth)
  if (Number.isNaN(d.getTime())) return false
  return d.getUTCMonth() === ref.getUTCMonth() && d.getUTCDate() === ref.getUTCDate()
}

export function computeCouponDiscount(
  coupon: CouponInput,
  ctx: DiscountContext,
): { discount: number; error?: string } {
  const now = ctx.now ?? new Date()

  if (!coupon.active) return { discount: 0, error: 'inactive' }

  if (coupon.valid_from) {
    const from = new Date(coupon.valid_from)
    if (now < from) return { discount: 0, error: 'not_started' }
  }
  if (coupon.valid_until) {
    const until = new Date(coupon.valid_until)
    if (now > until) return { discount: 0, error: 'expired' }
  }

  if (ctx.subtotal < Number(coupon.min_order_value)) {
    return { discount: 0, error: 'below_min' }
  }

  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { discount: 0, error: 'max_uses' }
  }

  if (coupon.target === 'new_customers' && ctx.userOrderCount > 0) {
    return { discount: 0, error: 'not_new_customer' }
  }

  if (coupon.birthday_auto) {
    if (!ctx.userBirthday || !isSameMonthDay(ctx.userBirthday, now)) {
      return { discount: 0, error: 'birthday' }
    }
  }

  switch (coupon.type) {
    case 'percent': {
      const p = Number(coupon.value ?? 0)
      if (p <= 0 || p > 100) return { discount: 0, error: 'bad_percent' }
      return { discount: roundMoney(ctx.subtotal * (p / 100)) }
    }
    case 'fixed': {
      const v = Number(coupon.value ?? 0)
      if (v <= 0) return { discount: 0, error: 'bad_fixed' }
      return { discount: roundMoney(Math.min(v, ctx.subtotal)) }
    }
    case 'free': {
      const pid = coupon.free_product_id
      if (!pid) return { discount: 0, error: 'no_free_product' }
      const line = ctx.lines.find((l) => l.productId === pid)
      if (!line) return { discount: 0, error: 'product_not_in_cart' }
      const price = ctx.productPrice(pid)
      if (price == null) return { discount: 0, error: 'no_price' }
      return { discount: roundMoney(Math.min(price * Math.min(1, line.quantity), ctx.subtotal)) }
    }
    case 'bundle': {
      const cfg = coupon.bundle_config
      if (!cfg?.eligible_product_ids?.length || cfg.pick_count < 1) {
        return { discount: 0, error: 'bad_bundle_config' }
      }
      const picked = ctx.bundleProductIds ?? []
      if (picked.length !== cfg.pick_count) {
        return { discount: 0, error: 'bundle_pick' }
      }
      const set = new Set(cfg.eligible_product_ids)
      for (const id of picked) {
        if (!set.has(id)) return { discount: 0, error: 'bundle_ineligible' }
      }
      const uniq = new Set(picked)
      if (uniq.size !== picked.length) return { discount: 0, error: 'bundle_duplicate' }

      let subBundle = 0
      for (const id of picked) {
        const line = ctx.lines.find((l) => l.productId === id)
        if (!line || line.quantity < 1) return { discount: 0, error: 'bundle_not_in_cart' }
        const pr = ctx.productPrice(id)
        if (pr == null) return { discount: 0, error: 'no_price' }
        subBundle += pr * 1
      }

      if (cfg.discount_mode === 'percent') {
        const p = cfg.discount_value
        if (p <= 0 || p > 100) return { discount: 0, error: 'bad_bundle_percent' }
        return { discount: roundMoney(Math.min(subBundle * (p / 100), ctx.subtotal)) }
      }
      const cap = cfg.discount_value
      return { discount: roundMoney(Math.min(cap, subBundle, ctx.subtotal)) }
    }
    default:
      return { discount: 0, error: 'unknown_type' }
  }
}
