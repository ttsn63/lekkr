import { Link, useParams } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { AllergenList } from '@/components/product/AllergenList'
import { NutritionInfo } from '@/components/product/NutritionInfo'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductVideo } from '@/components/product/ProductVideo'
import { PopularityBadge } from '@/components/menu/PopularityBadge'
import { Button } from '@/components/ui/Button'
import { useProductQuery } from '@/hooks/useCatalogQueries'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedDescription, pickLocalizedName } from '@/i18n/localized'
import { formatEur } from '@/lib/format'
import { useCartStore } from '@/store/cartStore'
import { useToast } from '@/components/ui/Toast'

export function ProductPage() {
  const params = useParams<{ id: string }>()
  const productId = params.id
  const tenant = useTenant()
  const { locale, t } = useLocale()
  const { data: product, isLoading, error } = useProductQuery(tenant.id, productId)
  const add = useCartStore((s) => s.add)
  const { toast } = useToast()

  if (!productId) {
    return (
      <AppLayout title={t('product.notFound')}>
        <p className="text-text-secondary">{t('product.notFound')}</p>
      </AppLayout>
    )
  }

  if (isLoading) {
    return (
      <AppLayout title={t('menu.title')}>
        <p className="text-text-secondary">{t('nav.loading')}</p>
      </AppLayout>
    )
  }

  if (error || !product) {
    return (
      <AppLayout title={t('product.notFound')}>
        <div className="space-y-ds-md">
          <p className="text-text-secondary">{t('product.notFound')}</p>
          <Link href="/menu" className="text-ds-sm font-medium text-navy underline">
            {t('product.back')}
          </Link>
        </div>
      </AppLayout>
    )
  }

  const title = pickLocalizedName(locale, product)
  const description = pickLocalizedDescription(locale, product)

  return (
    <AppLayout title={title}>
      <div className="space-y-ds-xl">
        <Link href="/menu" className="inline-block text-ds-sm font-medium text-navy underline">
          ← {t('product.back')}
        </Link>

        <div className="grid gap-ds-xl lg:grid-cols-2">
          <ProductGallery
            alt={title}
            mainUrl={product.main_image_url}
            extraUrls={[product.image_2_url, product.image_3_url, product.image_4_url]}
          />

          <div className="space-y-ds-lg">
            <div className="flex flex-wrap items-start justify-between gap-ds-md">
              <h1 className="font-heading text-ds-3xl font-bold text-navy">{title}</h1>
              <PopularityBadge count={product.popularity_count} />
            </div>

            <div className="flex flex-wrap items-baseline gap-ds-md">
              <span className="text-ds-3xl font-semibold text-navy">{formatEur(locale, product.price)}</span>
              {product.price_old != null && product.price_old > product.price ? (
                <span className="text-ds-lg text-text-secondary line-through">
                  {formatEur(locale, product.price_old)}
                </span>
              ) : null}
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                add(product.id, 1)
                toast({ message: t('product.addToCart'), variant: 'success' })
              }}
            >
              {t('product.addToCart')}
            </Button>

            {description ? (
              <section aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="font-heading text-ds-xl text-navy">
                  {t('product.description')}
                </h2>
                <p className="mt-ds-sm whitespace-pre-line text-ds-base text-text-secondary">{description}</p>
              </section>
            ) : null}

            <NutritionInfo calories={product.calories} />

            <section aria-labelledby="allergen-heading" className="space-y-ds-sm">
              <h2 id="allergen-heading" className="font-heading text-ds-xl text-navy">
                {t('product.allergens')}
              </h2>
              <AllergenList codes={product.allergens} />
            </section>
          </div>
        </div>

        {product.video_url ? (
          <section aria-labelledby="video-heading" className="space-y-ds-md">
            <h2 id="video-heading" className="font-heading text-ds-2xl text-navy">
              {t('product.video')}
            </h2>
            <ProductVideo url={product.video_url} title={title} />
          </section>
        ) : null}
      </div>
    </AppLayout>
  )
}
