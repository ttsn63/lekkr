import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { BundleConfigurator } from '@/components/coupons/BundleConfigurator'
import { CouponCard } from '@/components/coupons/CouponCard'
import { Button } from '@/components/ui/Button'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { fetchActiveCoupons, type CouponRow } from '@/lib/queries/couponsPublic'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'

function isBirthdayToday(iso: string | null | undefined): boolean {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const n = new Date()
  return d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export function CouponsPage() {
  const tenant = useTenant()
  const { t } = useLocale()
  const { user, loading } = useAuthSession()
  const [, navigate] = useLocation()
  const setCouponCode = useCartStore((s) => s.setCouponCode)
  const setBundleIds = useCartStore((s) => s.setBundleCouponProductIds)

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['public-coupons', tenant.id],
    queryFn: () => fetchActiveCoupons(tenant.id),
  })

  const { data: products = [] } = useProductsQuery(tenant.id)

  const { data: birthday } = useQuery({
    queryKey: ['user-birthday-coupons', user?.id],
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

  const [bundleSelections, setBundleSelections] = useState<Record<string, string[]>>({})

  const birthdayCoupons = useMemo(
    () => coupons.filter((c) => c.birthday_auto && isBirthdayToday(birthday ?? null)),
    [coupons, birthday],
  )

  const autoBirthdayCode = birthdayCoupons.length === 1 ? birthdayCoupons[0].code : null
  useEffect(() => {
    if (autoBirthdayCode) setCouponCode(autoBirthdayCode)
  }, [autoBirthdayCode, setCouponCode])

  const toggleBundle = (couponId: string, productId: string, maxPick: number) => {
    setBundleSelections((prev) => {
      const cur = prev[couponId] ?? []
      if (cur.includes(productId)) {
        return { ...prev, [couponId]: cur.filter((id) => id !== productId) }
      }
      if (cur.length >= maxPick) return prev
      return { ...prev, [couponId]: [...cur, productId] }
    })
  }

  const applyCoupon = (c: CouponRow) => {
    if (c.type === 'bundle' && c.bundle_config) {
      const sel = bundleSelections[c.id] ?? []
      if (sel.length !== c.bundle_config.pick_count) return
      setBundleIds(sel)
    } else {
      setBundleIds(null)
    }
    setCouponCode(c.code)
    navigate('/cart')
  }

  if (loading) {
    return (
      <AppLayout title={t('coupons.title')}>
        <p className="text-text-secondary">{t('nav.loading')}</p>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title={t('coupons.title')}>
        <p className="text-text-secondary">{t('coupons.loginHint')}</p>
        <Button type="button" className="mt-ds-md" onClick={() => navigate('/login')}>
          {t('nav.login')}
        </Button>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={t('coupons.title')}>
      <p className="mb-ds-lg max-w-2xl text-text-secondary">{t('coupons.intro')}</p>

      {birthdayCoupons.length > 0 ? (
        <div className="mb-ds-xl rounded-md border-2 border-brand-mint bg-brand-mint/15 p-ds-lg">
          <p className="font-heading text-ds-lg text-navy">{t('coupons.birthdayTitle')}</p>
          <p className="mt-ds-xs text-ds-sm text-text-secondary">{t('coupons.birthdaySubtitle')}</p>
          <ul className="mt-ds-md space-y-ds-sm">
            {birthdayCoupons.map((c) => (
              <li key={c.id} className="font-mono font-semibold text-brand-red">
                {c.code}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-text-secondary">{t('nav.loading')}</p>
      ) : (
        <ul className="grid gap-ds-lg md:grid-cols-2">
          {coupons.map((c) => (
            <li key={c.id}>
              <CouponCard
                coupon={c}
                showApply={false}
              />
              {c.type === 'bundle' && c.bundle_config ? (
                <BundleConfigurator
                  coupon={c}
                  products={products}
                  selectedIds={bundleSelections[c.id] ?? []}
                  onToggle={(pid) => toggleBundle(c.id, pid, c.bundle_config!.pick_count)}
                />
              ) : null}
              <Button
                type="button"
                className="mt-ds-md w-full md:w-auto"
                onClick={() => applyCoupon(c)}
                disabled={Boolean(
                  c.type === 'bundle' &&
                    c.bundle_config &&
                    (bundleSelections[c.id]?.length ?? 0) !== c.bundle_config.pick_count,
                )}
              >
                {t('coupons.applyInCart')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && coupons.length === 0 ? (
        <p className="text-text-secondary">{t('coupons.empty')}</p>
      ) : null}
    </AppLayout>
  )
}
