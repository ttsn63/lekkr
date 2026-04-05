import { useMemo } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { MinOrderProgress } from '@/components/cart/MinOrderProgress'
import { useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenantSettingsQuery } from '@/hooks/useTenantSettingsQuery'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import { formatEur } from '@/lib/format'
import { useCartDiscountPreview } from '@/hooks/useCartDiscountPreview'
import { useCartStore } from '@/store/cartStore'

export function CartSidebar() {
  const [, navigate] = useLocation()
  const tenant = useTenant()
  const { locale, t } = useLocale()
  const sidebarOpen = useCartStore((s) => s.sidebarOpen)
  const setSidebarOpen = useCartStore((s) => s.setSidebarOpen)
  const lines = useCartStore((s) => s.lines)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const remove = useCartStore((s) => s.remove)
  const couponCode = useCartStore((s) => s.couponCode)
  const bundleCouponProductIds = useCartStore((s) => s.bundleCouponProductIds)
  const setCouponCode = useCartStore((s) => s.setCouponCode)

  const { data: products } = useProductsQuery(tenant.id)
  const { data: settings } = useTenantSettingsQuery(tenant.id)

  const minOrder = settings ? Number(settings.min_order_value) : 0

  const linesWithProducts = useMemo(() => {
    if (!products?.length) return []
    const map = new Map(products.map((p) => [p.id, p]))
    return lines
      .map((l) => {
        const p = map.get(l.productId)
        if (!p) return null
        return { line: l, product: p }
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
  }, [lines, products])

  const subtotal = useMemo(() => {
    return linesWithProducts.reduce((s, x) => s + Number(x.product.price) * x.line.quantity, 0)
  }, [linesWithProducts])

  const { discount: previewDiscount } = useCartDiscountPreview(
    tenant.id,
    lines,
    products,
    couponCode,
    bundleCouponProductIds,
  )

  if (!sidebarOpen) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-modal bg-navy/40 backdrop-blur-[1px]"
        aria-label={t('cart.close')}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className="fixed right-0 top-0 z-toast flex h-full w-full max-w-md flex-col border-l border-brand-cream-darker bg-bg-secondary shadow-xl"
        aria-label={t('nav.cart')}
      >
        <div className="flex items-center justify-between border-b border-brand-cream-dark px-ds-lg py-ds-md">
          <h2 className="font-heading text-ds-xl font-semibold text-navy">{t('nav.cart')}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-ds-lg py-ds-md">
          {lines.length === 0 ? (
            <p className="text-ds-sm text-text-secondary">{t('cart.empty')}</p>
          ) : (
            <ul className="space-y-ds-md">
              {linesWithProducts.map(({ line, product }) => (
                <li
                  key={line.productId}
                  className="flex gap-ds-md border-b border-brand-cream-dark pb-ds-md"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-brand-cream-dark">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">{pickLocalizedName(locale, product)}</p>
                    <p className="text-ds-sm text-text-secondary">
                      {formatEur(locale, Number(product.price))} × {line.quantity}
                    </p>
                    <div className="mt-ds-sm flex items-center gap-ds-sm">
                      <button
                        type="button"
                        className="rounded-sm border border-brand-cream-darker px-ds-sm py-ds-2xs text-ds-sm"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-ds-sm">{line.quantity}</span>
                      <button
                        type="button"
                        className="rounded-sm border border-brand-cream-darker px-ds-sm py-ds-2xs text-ds-sm"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-ds-xs text-[color:var(--color-error)] underline"
                        onClick={() => remove(line.productId)}
                      >
                        {t('cart.remove')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-brand-cream-dark px-ds-lg py-ds-md space-y-ds-md">
          <Link
            href="/cart"
            className="block text-center text-ds-xs font-medium text-navy underline"
            onClick={() => setSidebarOpen(false)}
          >
            {t('cart.pageLink')}
          </Link>
          <Link
            href="/coupons"
            className="block text-center text-ds-xs font-medium text-navy underline"
            onClick={() => setSidebarOpen(false)}
          >
            {t('nav.coupons')}
          </Link>
          {settings && lines.length > 0 ? (
            <MinOrderProgress
              lines={lines}
              products={products}
              minOrderValue={minOrder}
            />
          ) : null}
          <div className="flex justify-between font-heading text-ds-lg text-navy">
            <span>{t('cart.subtotal')}</span>
            <span>{formatEur(locale, subtotal)}</span>
          </div>
          {couponCode ? (
            <div className="flex flex-wrap items-center justify-between gap-ds-sm text-ds-sm">
              <span className="text-text-secondary">
                {t('coupons.active')}: <span className="font-mono font-medium text-navy">{couponCode}</span>
              </span>
              <button
                type="button"
                className="text-ds-xs text-[color:var(--color-error)] underline"
                onClick={() => setCouponCode(null)}
              >
                {t('coupons.remove')}
              </button>
            </div>
          ) : null}
          {previewDiscount > 0 ? (
            <div className="flex justify-between text-ds-sm text-[color:var(--color-success)]">
              <span>{t('coupons.discount')}</span>
              <span>− {formatEur(locale, previewDiscount)}</span>
            </div>
          ) : null}
          <Button
            type="button"
            size="full"
            disabled={lines.length === 0}
            onClick={() => {
              setSidebarOpen(false)
              navigate('/checkout')
            }}
          >
            {t('cart.checkout')}
          </Button>
        </div>
      </aside>
    </>
  )
}
