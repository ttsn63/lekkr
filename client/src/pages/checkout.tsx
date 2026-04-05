import { useMemo, useState } from 'react'
import { useLocation } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
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

  const subtotal = useMemo(() => {
    if (!products?.length) return 0
    const map = new Map(products.map((p) => [p.id, Number(p.price)]))
    return lines.reduce((s, l) => s + (map.get(l.productId) ?? 0) * l.quantity, 0)
  }, [lines, products])

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery' || !settings) return 0
    const fee = Number(settings.delivery_fee)
    const freeFrom = Number(settings.free_delivery_from)
    if (subtotal >= freeFrom) return 0
    return fee
  }, [orderType, settings, subtotal])

  const total = subtotal + deliveryFee + tip

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
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string }
      if (!res.ok || !json.ok || !json.url) {
        setError(json.error ?? t('checkout.error'))
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

                <div className="space-y-ds-xs border-t border-brand-cream-dark pt-ds-md text-ds-sm">
                  <div className="flex justify-between">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatEur(locale, subtotal)}</span>
                  </div>
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
