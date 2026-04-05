import { useEffect, useMemo } from 'react'
import { Link, useSearch } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import { formatEur } from '@/lib/format'
import { fetchOrderWithItems } from '@/lib/queries/orders'
import { useCartStore } from '@/store/cartStore'

export function ConfirmationPage() {
  const search = useSearch()
  const orderId = useMemo(() => new URLSearchParams(search).get('order'), [search])
  const tenant = useTenant()
  const { t, locale } = useLocale()
  const clear = useCartStore((s) => s.clear)

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', tenant.id, orderId],
    queryFn: () => fetchOrderWithItems(tenant.id, orderId!),
    enabled: Boolean(orderId && tenant.id),
  })

  const { data: products } = useProductsQuery(tenant.id)

  useEffect(() => {
    if (order) clear()
  }, [order, clear])

  const productMap = useMemo(() => new Map(products?.map((p) => [p.id, p])), [products])

  if (!orderId) {
    return (
      <AppLayout title={t('confirmation.title')}>
        <p className="text-text-secondary">{t('checkout.error')}</p>
        <Link href="/">
          <Button type="button" className="mt-4" variant="secondary">
            {t('confirmation.backHome')}
          </Button>
        </Link>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout title={t('confirmation.title')}>
        <p className="text-text-secondary">{t('nav.loading')}</p>
      </AppLayout>
    )
  }

  if (error || !order) {
    return (
      <AppLayout title={t('confirmation.title')}>
        <p className="text-text-secondary">{t('checkout.error')}</p>
        <Link href="/menu">
          <Button type="button" className="mt-4" variant="secondary">
            {t('nav.menu')}
          </Button>
        </Link>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={t('confirmation.title')}>
      <div className="mx-auto max-w-lg space-y-ds-xl text-center">
        <p className="font-heading text-ds-2xl text-navy">{t('confirmation.thanks')}</p>
        <p className="text-ds-sm text-text-secondary">
          {t('confirmation.orderNumber')}: <strong className="text-navy">{order.order_number}</strong>
        </p>
        <div className="rounded-md border border-brand-cream-darker bg-bg-secondary px-ds-lg py-ds-md text-left">
          <ul className="space-y-ds-sm">
            {order.order_items.map((item) => {
              const p = item.product_id ? productMap.get(item.product_id) : undefined
              const name = p ? pickLocalizedName(locale, p) : item.product_id?.slice(0, 8) ?? '—'
              return (
                <li key={item.id} className="flex justify-between text-ds-sm">
                  <span>
                    {name} × {item.quantity}
                  </span>
                  <span>{formatEur(locale, Number(item.total_price))}</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-ds-md flex justify-between border-t border-brand-cream-dark pt-ds-md font-heading text-ds-xl text-navy">
            <span>{t('confirmation.total')}</span>
            <span>{formatEur(locale, Number(order.total))}</span>
          </div>
          <p className="mt-ds-sm text-ds-xs text-text-secondary">
            {t('confirmation.payment')}:{' '}
            {order.payment_status === 'paid' ? t('confirmation.paid') : t('confirmation.pending')}
          </p>
        </div>
        <Link href="/">
          <Button type="button" variant="secondary">
            {t('confirmation.backHome')}
          </Button>
        </Link>
      </div>
    </AppLayout>
  )
}
