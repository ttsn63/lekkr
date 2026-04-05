import { AppLayout } from '@/components/layout/AppLayout'
import { CategoryStrip } from '@/components/home/CategoryStrip'
import { HomeHero } from '@/components/home/HomeHero'
import { ProductCard } from '@/components/menu/ProductCard'
import { useBestsellersQuery, useCategoriesQuery } from '@/hooks/useCatalogQueries'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'

export function IndexPage() {
  const tenant = useTenant()
  const { t } = useLocale()
  const { data: categories = [], isLoading: catLoading } = useCategoriesQuery(tenant.id)
  const { data: bestsellers = [], isLoading: bestLoading } = useBestsellersQuery(tenant.id, 6)

  return (
    <AppLayout>
      <div className="space-y-ds-3xl">
        <HomeHero />

        {catLoading ? (
          <p className="text-text-secondary">{t('nav.loading')}</p>
        ) : (
          <CategoryStrip categories={categories} />
        )}

        <section className="space-y-ds-lg" aria-labelledby="bestsellers-heading">
          <div className="text-center">
            <h2 id="bestsellers-heading" className="font-heading text-ds-3xl font-semibold text-navy">
              {t('home.bestsellers.title')}
            </h2>
            <p className="mt-ds-sm text-ds-lg text-text-secondary">{t('home.bestsellers.subtitle')}</p>
          </div>
          {bestLoading ? (
            <p className="text-center text-text-secondary">{t('nav.loading')}</p>
          ) : bestsellers.length === 0 ? (
            <p className="text-center text-text-secondary">{t('menu.empty')}</p>
          ) : (
            <ul className="grid gap-ds-lg sm:grid-cols-2 lg:grid-cols-3">
              {bestsellers.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
