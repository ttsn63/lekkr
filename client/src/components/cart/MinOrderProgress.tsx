import { useMemo } from 'react'
import { useLocale } from '@/i18n/LocaleProvider'
import { formatEur } from '@/lib/format'
import type { ProductRow } from '@/types/catalog'
import type { CartLine } from '@/store/cartStore'

type MinOrderProgressProps = {
  lines: CartLine[]
  products: ProductRow[] | undefined
  minOrderValue: number
}

export function MinOrderProgress({ lines, products, minOrderValue }: MinOrderProgressProps) {
  const { locale, t } = useLocale()

  const subtotal = useMemo(() => {
    if (!products?.length) return 0
    const map = new Map(products.map((p) => [p.id, Number(p.price)]))
    return lines.reduce((sum, l) => sum + (map.get(l.productId) ?? 0) * l.quantity, 0)
  }, [lines, products])

  const pct = minOrderValue > 0 ? Math.min(100, (subtotal / minOrderValue) * 100) : 100
  const reached = subtotal >= minOrderValue

  return (
    <div className="space-y-ds-xs">
      <div className="flex justify-between text-ds-xs text-text-secondary">
        <span>{t('cart.minOrder')}</span>
        <span>
          {formatEur(locale, subtotal)} / {formatEur(locale, minOrderValue)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-brand-cream-dark">
        <div
          className={`h-full rounded-full transition-all ${reached ? 'bg-[color:var(--color-success)]' : 'bg-navy'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!reached ? (
        <p className="text-ds-xs text-[color:var(--color-warning)]">{t('cart.minOrderHint')}</p>
      ) : (
        <p className="text-ds-xs text-[color:var(--color-success)]">{t('cart.minOrderOk')}</p>
      )}
    </div>
  )
}
