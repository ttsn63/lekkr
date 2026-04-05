import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useCartDiscountPreview } from '@/hooks/useCartDiscountPreview'
import { useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenantSettingsQuery } from '@/hooks/useTenantSettingsQuery'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { postNetlifyFunction } from '@/lib/api/netlify'
import { formatEur } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useCartStore } from '@/store/cartStore'

type OrderType = 'delivery' | 'pickup'
type PayMethod = 'stripe' | 'cash'

export function CheckoutPage() {
  const tenant = useTenant()
  const { t, locale } = useLocale()
  const { user, loading: authLoading } = useAuthSession()
  const [, navigate] = useLocation()
  const lines = useCartStore((s) => s.lines)
  const clear = useCartStore((s) => s.clear)
  const couponCode = useCartStore((s) => s.couponCode)
  const bundleCouponProductIds = useCartStore((s) => s.bundleCouponProductIds)
  const setCouponCode = useCartStore((s) => s.setCouponCode)
  const setBundleCouponProductIds = useCartStore((s) => s.setBundleCouponProductIds)

  const { data: products } = useProductsQuery(tenant.id)
  const { data: settings } = useTenantSettingsQuery(tenant.id)

  const [orderType, setOrderType] = useState<OrderType>('pickup')
  const [payMethod, setPayMethod] = useState<PayMethod>('stripe')
  const [tip, setTip] = useState(0)
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [zip, setZip] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referralEuro, setReferralEuro] = useState(0)

  const subtotal = useMemo(() => {
    if (!products?.length) return 0
    const map = new Map(products.map((p) => [p.id, Number(p.price)]))
    return lines.reduce((s, l) => s + (map.get(l.productId) ?? 0) * l.quantity, 0)
  }, [lines, products])

  const { discount: previewDiscountRaw, error: previewErr } = useCartDiscountPreview(
    tenant.id,
    lines,
    products,
    couponCode,
    bundleCouponProductIds,
  )

  const { data: refBalance = 0 } = useQuery({
    queryKey: ['referral-balance', tenant.id, user?.id],
    queryFn: async () => {
      const { data, error: qErr } = await supabase
        .from('users')
        .select('referral_credits')
        .eq('id', user!.id)
        .maybeSingle()
      if (qErr) throw qErr
      return Number(data?.referral_credits ?? 0)
    },
    enabled: Boolean(user?.id),
  })

  const previewDiscount = referralEuro > 0 ? 0 : previewDiscountRaw

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery' || !settings) return 0
    const fee = Number(settings.delivery_fee)
    const freeFrom = Number(settings.free_delivery_from)
    if (subtotal >= freeFrom) return 0
    return fee
  }, [orderType, settings, subtotal])

  const appliedReferral = useMemo(() => {
    if (referralEuro <= 0 || refBalance <= 0) return 0
    const effectiveDisc = referralEuro > 0 ? 0 : previewDiscountRaw
    const cap = Math.max(0, subtotal - effectiveDisc + deliveryFee + tip)
    const raw = Math.min(refBalance, referralEuro, cap)
    return Math.round(raw * 100) / 100
  }, [
    referralEuro,
    refBalance,
    subtotal,
    previewDiscountRaw,
    deliveryFee,
    tip,
  ])

  const total = Math.max(
    0,
    subtotal - previewDiscount - appliedReferral + deliveryFee + tip,
  )

  const minOrder = settings ? Number(settings.min_order_value) : 0
  const belowMin = subtotal < minOrder

  const tipPresets = [0, 0.5, 1, 2, 5]

  async function submit() {
    setError(null)
    if (!user || lines.length === 0 || belowMin) return
    setSubmitting(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) {
        setError(t('checkout.loginRequired'))
        return
      }

      const payload = {
        tenantId: tenant.id,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        orderType,
        tipAmount: tip,
        deliveryAddress:
          orderType === 'delivery'
            ? { street, city, zip }
            : undefined,
        couponCode: appliedReferral > 0 ? null : couponCode ?? null,
        bundleProductIds: appliedReferral > 0 ? null : bundleCouponProductIds ?? null,
        referralCreditToUse: appliedReferral > 0 ? appliedReferral : undefined,
      }

      if (payMethod === 'cash') {
        const res = await postNetlifyFunction('create-order-cash', payload, token)
        const json = (await res.json()) as { ok?: boolean; orderId?: string; error?: string }
        if (!res.ok || !json.ok || !json.orderId) {
          setError(json.error ?? t('checkout.error'))
          return
        }
        clear()
        navigate(`/confirmation?order=${json.orderId}`)
        return
      }

      const res = await postNetlifyFunction('create-checkout-session', payload, token)
      const json = (await res.json()) as {
        ok?: boolean
        url?: string | null
        orderId?: string
        paidWithoutStripe?: boolean
        error?: string
      }
      if (!res.ok || !json.ok) {
        setError(json.error ?? t('checkout.error'))
        return
      }
      if (json.paidWithoutStripe && json.orderId) {
        clear()
        navigate(`/confirmation?order=${json.orderId}`)
        return
      }
      if (!json.url) {
        setError(t('checkout.error'))
        return
      }
      window.location.href = json.url
    } catch (e) {
      setError(e instanceof Error ? e.message : t('checkout.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <AppLayout title={t('checkout.title')}>
        <p className="text-text-secondary">{t('nav.loading')}</p>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title={t('checkout.title')}>
        <p className="text-text-secondary">{t('checkout.loginRequired')}</p>
        <Button type="button" className="mt-4" onClick={() => navigate('/login')}>
          {t('nav.login')}
        </Button>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={t('checkout.title')}>
      <div className="mx-auto max-w-lg space-y-ds-xl">
        {lines.length === 0 ? (
          <p className="text-text-secondary">{t('cart.empty')}</p>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-ds-md">
                <p className="font-heading text-ds-lg text-navy">{t('checkout.orderType')}</p>
                <div className="flex gap-ds-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('pickup')
                      setPayMethod('stripe')
                    }}
                    className={`flex-1 rounded-sm border px-ds-md py-ds-sm text-ds-sm font-medium ${
                      orderType === 'pickup'
                        ? 'border-navy bg-navy text-text-light'
                        : 'border-brand-cream-darker bg-bg-secondary'
                    }`}
                  >
                    {t('checkout.pickup')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`flex-1 rounded-sm border px-ds-md py-ds-sm text-ds-sm font-medium ${
                      orderType === 'delivery'
                        ? 'border-navy bg-navy text-text-light'
                        : 'border-brand-cream-darker bg-bg-secondary'
                    }`}
                  >
                    {t('checkout.delivery')}
                  </button>
                </div>

                {orderType === 'delivery' ? (
                  <div className="space-y-ds-md border-t border-brand-cream-dark pt-ds-md">
                    <p className="text-ds-sm font-medium">{t('checkout.address')}</p>
                    <Input label={t('checkout.street')} value={street} onChange={(e) => setStreet(e.target.value)} />
                    <div className="grid grid-cols-2 gap-ds-md">
                      <Input label={t('checkout.zip')} value={zip} onChange={(e) => setZip(e.target.value)} />
                      <Input label={t('checkout.city')} value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    {settings ? (
                      <p className="text-ds-xs text-text-secondary">
                        {t('checkout.freeDelivery', {
                          amount: String(Number(settings.free_delivery_from).toFixed(2)),
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="border-t border-brand-cream-dark pt-ds-md space-y-ds-sm">
                  <p className="text-ds-sm font-medium">{t('checkout.tip')}</p>
                  <div className="flex flex-wrap gap-ds-sm">
                    {tipPresets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTip(p)}
                        className={`rounded-full px-ds-md py-ds-xs text-ds-sm ${
                          tip === p ? 'bg-navy text-text-light' : 'border border-brand-cream-darker'
                        }`}
                      >
                        {formatEur(locale, p)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-brand-cream-dark pt-ds-md space-y-ds-sm">
                  <p className="text-ds-sm font-medium">{t('checkout.payment')}</p>
                  <label className="flex cursor-pointer items-center gap-ds-sm">
                    <input
                      type="radio"
                      name="pay"
                      checked={payMethod === 'stripe'}
                      onChange={() => setPayMethod('stripe')}
                    />
                    <span>{t('checkout.card')}</span>
                  </label>
                  {orderType === 'pickup' ? (
                    <label className="flex cursor-pointer items-center gap-ds-sm">
                      <input
                        type="radio"
                        name="pay"
                        checked={payMethod === 'cash'}
                        onChange={() => setPayMethod('cash')}
                      />
                      <span>{t('checkout.cash')}</span>
                    </label>
                  ) : null}
                </div>

                <div className="space-y-ds-md border-t border-brand-cream-dark pt-ds-md">
                  <div>
                    <p className="text-ds-sm font-medium text-navy">{t('coupons.codeLabel')}</p>
                    <div className="mt-ds-sm flex flex-wrap gap-ds-sm">
                      <Input
                        className="flex-1 min-w-[160px]"
                        value={couponCode ?? ''}
                        disabled={referralEuro > 0}
                        onChange={(e) => {
                          const v = e.target.value.trim() || null
                          setCouponCode(v)
                          if (v) setReferralEuro(0)
                        }}
                        placeholder={t('coupons.codePlaceholder')}
                      />
                      {couponCode ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCouponCode(null)}>
                          {t('coupons.remove')}
                        </Button>
                      ) : null}
                    </div>
                    {referralEuro > 0 ? (
                      <p className="mt-ds-xs text-ds-xs text-text-secondary">{t('checkout.referralExclusive')}</p>
                    ) : previewDiscountRaw > 0 ? (
                      <p className="mt-ds-xs text-ds-xs text-[color:var(--color-success)]">
                        {t('coupons.previewOk', { amount: previewDiscountRaw.toFixed(2) })}
                      </p>
                    ) : previewErr && couponCode ? (
                      <p className="mt-ds-xs text-ds-xs text-[color:var(--color-warning)]">
                        {t('coupons.previewBad')}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-ds-md border-t border-brand-cream-dark pt-ds-md">
                  <p className="text-ds-sm font-medium text-navy">{t('checkout.referralCredit')}</p>
                  <p className="text-ds-xs text-text-secondary">{t('checkout.referralExclusive')}</p>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    disabled={Boolean(couponCode?.trim())}
                    value={referralEuro > 0 ? referralEuro : ''}
                    onChange={(e) => {
                      const raw = e.target.value
                      const n = raw === '' ? 0 : Math.max(0, Number(raw.replace(',', '.')) || 0)
                      setReferralEuro(n)
                      if (n > 0) {
                        setCouponCode(null)
                        setBundleCouponProductIds(null)
                      }
                    }}
                    placeholder="0"
                  />
                  <p className="text-ds-xs text-text-secondary">
                    {t('checkout.referralMax', { amount: refBalance.toFixed(2) })}
                  </p>
                </div>

                <div className="space-y-ds-xs border-t border-brand-cream-dark pt-ds-md text-ds-sm">
                  <div className="flex justify-between">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatEur(locale, subtotal)}</span>
                  </div>
                  {previewDiscount > 0 ? (
                    <div className="flex justify-between text-[color:var(--color-success)]">
                      <span>{t('coupons.discount')}</span>
                      <span>− {formatEur(locale, previewDiscount)}</span>
                    </div>
                  ) : null}
                  {appliedReferral > 0 ? (
                    <div className="flex justify-between text-[color:var(--color-success)]">
                      <span>{t('profile.referralBalance')}</span>
                      <span>− {formatEur(locale, appliedReferral)}</span>
                    </div>
                  ) : null}
                  {orderType === 'delivery' ? (
                    <div className="flex justify-between">
                      <span>{t('checkout.delivery')}</span>
                      <span>{formatEur(locale, deliveryFee)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>{t('checkout.tip')}</span>
                    <span>{formatEur(locale, tip)}</span>
                  </div>
                  <div className="flex justify-between font-heading text-ds-xl text-navy">
                    <span>{t('confirmation.total')}</span>
                    <span>{formatEur(locale, total)}</span>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-md bg-brand-red/10 px-ds-sm py-ds-xs text-ds-sm text-[color:var(--color-error)]">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="button"
                  size="full"
                  disabled={submitting || belowMin || (orderType === 'delivery' && (!street || !city || !zip))}
                  onClick={() => void submit()}
                >
                  {submitting
                    ? '…'
                    : payMethod === 'cash'
                      ? t('checkout.submitCash')
                      : t('checkout.submitStripe')}
                </Button>
                {belowMin ? (
                  <p className="text-center text-ds-xs text-[color:var(--color-warning)]">
                    {t('cart.minOrder')}: {formatEur(locale, minOrder)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}
