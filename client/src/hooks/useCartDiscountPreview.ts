import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { computeCouponDiscount, type CouponInput } from '@/lib/coupons/computeDiscount'
import { fetchCouponByCode } from '@/lib/queries/couponsPublic'
import type { ProductRow } from '@/types/catalog'
import { supabase } from '@/lib/supabase'
import { useAuthSession } from '@/hooks/useAuthSession'

type Line = { productId: string; quantity: number }

function toCouponInput(row: Awaited<ReturnType<typeof fetchCouponByCode>>): CouponInput | null {
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    value: row.value,
    min_order_value: row.min_order_value,
    max_uses: row.max_uses,
    used_count: row.used_count,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    target: row.target,
    active: row.active,
    bundle_config: row.bundle_config,
    free_product_id: row.free_product_id,
    birthday_auto: row.birthday_auto,
    max_uses_per_user: row.max_uses_per_user,
  }
}

export function useCartDiscountPreview(
  tenantId: string,
  lines: Line[],
  products: ProductRow[] | undefined,
  couponCode: string | null,
  bundleProductIds: string[] | null,
) {
  const { user } = useAuthSession()

  const { data: couponRow } = useQuery({
    queryKey: ['coupon-preview', tenantId, couponCode],
    queryFn: () => fetchCouponByCode(tenantId, couponCode!),
    enabled: Boolean(tenantId && user && couponCode?.trim()),
  })

  const { data: profile } = useQuery({
    queryKey: ['user-birthday', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('birthday')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data?.birthday as string | null
    },
    enabled: Boolean(user?.id),
  })

  const { data: orderCount = 0 } = useQuery({
    queryKey: ['user-order-count', tenantId, user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('user_id', user!.id)
      if (error) throw error
      return count ?? 0
    },
    enabled: Boolean(tenantId && user?.id && couponRow),
  })

  const coupon = toCouponInput(couponRow ?? null)

  const { data: usageCount = 0 } = useQuery({
    queryKey: ['coupon-user-usage', coupon?.id, user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('coupon_usages')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon!.id)
        .eq('user_id', user!.id)
      if (error) throw error
      return count ?? 0
    },
    enabled: Boolean(coupon && user?.id),
  })

  return useMemo(() => {
    if (!coupon || !products?.length || !lines.length) {
      return { discount: 0, error: null as string | null, subtotal: 0 }
    }

    const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]))
    let subtotal = 0
    for (const l of lines) {
      const pr = priceMap.get(l.productId)
      if (pr == null) continue
      subtotal += pr * l.quantity
    }

    if (usageCount >= coupon.max_uses_per_user) {
      return { discount: 0, error: 'limit_per_user', subtotal }
    }

    const productPrice = (id: string) => priceMap.get(id)

    const { discount, error } = computeCouponDiscount(coupon, {
      subtotal,
      lines,
      productPrice,
      userOrderCount: orderCount,
      userBirthday: profile ?? null,
      bundleProductIds,
    })

    if (error || discount <= 0) {
      return { discount: 0, error: error ?? 'invalid', subtotal }
    }

    return { discount, error: null, subtotal }
  }, [
    coupon,
    products,
    lines,
    orderCount,
    profile,
    bundleProductIds,
    usageCount,
  ])
}
