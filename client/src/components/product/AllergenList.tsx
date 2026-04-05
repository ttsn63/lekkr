import { useLocale } from '@/i18n/LocaleProvider'

type AllergenListProps = {
  codes: string[] | null | undefined
}

export function AllergenList({ codes }: AllergenListProps) {
  const { t } = useLocale()
  if (!codes?.length) return null

  const normalized = [...new Set(codes.map((c) => c.trim().toLowerCase()).filter(Boolean))]

  return (
    <ul className="flex flex-wrap gap-ds-sm" aria-label={t('product.allergens')}>
      {normalized.map((code) => {
        const key = `allergens.${code}`
        const label = t(key)
        const display = label === key ? code : label
        return (
          <li
            key={code}
            className="rounded-full border border-brand-cream-darker bg-brand-cream-dark px-ds-md py-ds-xs text-ds-sm text-navy"
          >
            {display}
          </li>
        )
      })}
    </ul>
  )
}
