import { useMemo, useState } from 'react'
import { useLocation, useSearch } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { CategoryNav } from '@/components/menu/CategoryNav'
import { ProductCard } from '@/components/menu/ProductCard'
import { Input } from '@/components/ui/Input'
import { useCategoriesQuery, useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { matchesSearchQuery } from '@/i18n/localized'

export function MenuPage() {
  const tenant = useTenant()
  const { t, locale } = useLocale()
  const search = useSearch()
  const [location, navigate] = useLocation()
  const isHomepage = location === '/'

  const categoryFromUrl = useMemo(() => new URLSearchParams(search).get('category'), [search])

  const setCategoryId = (id: string | null) => {
    navigate(id ? `/menu?category=${encodeURIComponent(id)}` : '/menu')
  }

  const { data: categories = [], isLoading: catLoading } = useCategoriesQuery(tenant.id)
  const { data: products = [], isLoading: prodLoading, error } = useProductsQuery(tenant.id)

  const [searchText, setSearchText] = useState('')

  const filtered = useMemo(() => {
    let list = products
    if (categoryFromUrl) {
      list = list.filter((p) => p.category_id === categoryFromUrl)
    }
    const q = searchText.trim()
    if (q) {
      list = list.filter((p) => matchesSearchQuery(locale, p, q))
    }
    return list
  }, [products, categoryFromUrl, searchText, locale])

  return (
    <AppLayout title={isHomepage ? undefined : t('menu.title')} mainClassName={isHomepage ? 'pt-0' : undefined}>
      <div className="space-y-ds-xl">
        {error ? (
          <p className="rounded-md bg-brand-red/10 px-ds-md py-ds-sm text-ds-sm text-[color:var(--color-error)]">
            {t('menu.loadError')}
          </p>
        ) : null}

        <Input
          type="search"
          aria-label={t('menu.search.placeholder')}
          placeholder={t('menu.search.placeholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          autoComplete="off"
        />

        {catLoading ? (
          <p className="text-text-secondary">{t('nav.loading')}</p>
        ) : (
          <CategoryNav
            categories={categories}
            selectedId={categoryFromUrl}
            onSelect={setCategoryId}
          />
        )}

        {prodLoading ? (
          <p className="text-text-secondary">{t('nav.loading')}</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-secondary">{t('menu.empty')}</p>
        ) : (
          <ul className="grid gap-ds-lg sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}
