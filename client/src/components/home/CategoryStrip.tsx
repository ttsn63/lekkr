import { Link } from 'wouter'
import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import type { CategoryRow } from '@/types/catalog'

type CategoryStripProps = {
  categories: CategoryRow[]
}

export function CategoryStrip({ categories }: CategoryStripProps) {
  const { locale, t } = useLocale()

  if (categories.length === 0) return null

  return (
    <section className="space-y-ds-md" aria-labelledby="home-categories-heading">
      <h2 id="home-categories-heading" className="font-heading text-ds-2xl font-semibold text-navy">
        {t('home.categories.title')}
      </h2>
      <ul className="flex gap-ds-md overflow-x-auto pb-ds-sm md:flex-wrap md:overflow-visible">
        {categories.map((cat) => (
          <li key={cat.id} className="shrink-0">
            <Link
              href={`/menu?category=${cat.id}`}
              className="flex min-w-[140px] items-center justify-center rounded-md border border-brand-cream-darker bg-bg-secondary px-ds-lg py-ds-md text-center font-medium text-navy shadow-sm transition hover:border-navy/30 hover:shadow-md"
            >
              {pickLocalizedName(locale, cat)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
