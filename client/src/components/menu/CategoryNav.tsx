import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import type { CategoryRow } from '@/types/catalog'

type CategoryNavProps = {
  categories: CategoryRow[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryNav({ categories, selectedId, onSelect }: CategoryNavProps) {
  const { locale, t } = useLocale()

  return (
    <div className="flex flex-wrap gap-ds-sm" role="tablist" aria-label={t('home.categories.title')}>
      <button
        type="button"
        role="tab"
        aria-selected={selectedId === null}
        onClick={() => onSelect(null)}
        className={`rounded-full px-ds-md py-ds-xs text-ds-sm font-medium transition-colors ${
          selectedId === null
            ? 'bg-navy text-text-light'
            : 'border border-brand-cream-darker bg-bg-secondary text-text-secondary hover:border-navy/40'
        }`}
      >
        {t('menu.filter.all')}
      </button>
      {categories.map((cat) => {
        const label = pickLocalizedName(locale, cat)
        const active = selectedId === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(cat.id)}
            className={`rounded-full px-ds-md py-ds-xs text-ds-sm font-medium transition-colors ${
              active
                ? 'bg-navy text-text-light'
                : 'border border-brand-cream-darker bg-bg-secondary text-text-secondary hover:border-navy/40'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
