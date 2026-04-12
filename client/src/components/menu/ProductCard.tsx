import { Link } from 'wouter'
import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import { formatEur } from '@/lib/format'
import type { ProductRow } from '@/types/catalog'

type ProductCardProps = {
  product: ProductRow
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale } = useLocale()
  const title = pickLocalizedName(locale, product)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-brand-cream-darker bg-bg-secondary shadow-md transition-shadow hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="block shrink-0 overflow-hidden">
        <div className="aspect-[4/3] bg-brand-cream-dark">
          {product.main_image_url ? (
            <img
              src={product.main_image_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-ds-2xl text-brand-red/40">
              L
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-ds-xs p-ds-md">
        <Link href={`/product/${product.id}`} className="block min-h-[3.5rem]">
          <h3 className="font-heading text-ds-base font-semibold leading-snug text-navy hover:underline sm:text-ds-lg">
            {title}
          </h3>
        </Link>
        <div className="mt-auto flex flex-wrap items-baseline gap-ds-xs">
          <span className="text-ds-base font-semibold text-navy sm:text-ds-lg">
            {formatEur(locale, product.price)}
          </span>
          {product.price_old != null && product.price_old > product.price ? (
            <span className="text-ds-sm text-text-secondary line-through">
              {formatEur(locale, product.price_old)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}
