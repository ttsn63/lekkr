import { Link } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { MinOrderProgress } from '@/components/cart/MinOrderProgress'
import { useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenantSettingsQuery } from '@/hooks/useTenantSettingsQuery'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import { formatEur } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'

export function CartPage() {
  const tenant = useTenant()
  const { locale, t } = useLocale()
  const lines = useCartStore((s) => s.lines)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const remove = useCartStore((s) => s.remove)
  const { data: products } = useProductsQuery(tenant.id)
  const { data: settings } = useTenantSettingsQuery(tenant.id)

  const linesWithProducts = lines
    .map((l) => {
      const p = products?.find((x) => x.id === l.productId)
      return p ? { line: l, product: p } : null
    })
    .filter((x): x is NonNullable<typeof x> => x != null)

  const subtotal = linesWithProducts.reduce(
    (s, x) => s + Number(x.product.price) * x.line.quantity,
    0,
  )

  const minOrder = settings ? Number(settings.min_order_value) : 0

  return (
    <AppLayout title={t('nav.cart')}>
      <div className="mx-auto max-w-lg space-y-ds-xl">
        {lines.length === 0 ? (
          <p className="text-text-secondary">{t('cart.empty')}</p>
        ) : (
          <>
            <ul className="space-y-ds-lg">
              {linesWithProducts.map(({ line, product }) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-center justify-between gap-ds-md border-b border-brand-cream-dark pb-ds-md"
                >
                  <div>
                    <p className="font-medium text-navy">{pickLocalizedName(locale, product)}</p>
                    <p className="text-ds-sm text-text-secondary">
                      {formatEur(locale, Number(product.price))} × {line.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-ds-sm">
                    <button
                      type="button"
                      className="rounded-sm border border-brand-cream-darker px-ds-sm py-ds-2xs"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{line.quantity}</span>
                    <button
                      type="button"
                      className="rounded-sm border border-brand-cream-darker px-ds-sm py-ds-2xs"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="text-ds-xs text-[color:var(--color-error)] underline"
                      onClick={() => remove(line.productId)}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {settings ? (
              <MinOrderProgress lines={lines} products={products} minOrderValue={minOrder} />
            ) : null}
            <div className="flex justify-between font-heading text-ds-2xl text-navy">
              <span>{t('cart.subtotal')}</span>
              <span>{formatEur(locale, subtotal)}</span>
            </div>
            <Link href="/checkout">
              <Button type="button" size="full">
                {t('cart.checkout')}
              </Button>
            </Link>
          </>
        )}
      </div>
    </AppLayout>
  )
}
