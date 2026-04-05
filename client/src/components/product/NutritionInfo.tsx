import { useLocale } from '@/i18n/LocaleProvider'

type NutritionInfoProps = {
  calories: number | null | undefined
}

export function NutritionInfo({ calories }: NutritionInfoProps) {
  const { t } = useLocale()
  if (calories == null || calories < 0) return null

  return (
    <div className="rounded-md border border-brand-cream-darker bg-bg-secondary px-ds-md py-ds-sm">
      <p className="text-ds-xs font-semibold uppercase tracking-wide text-text-secondary">
        {t('product.nutrition')}
      </p>
      <p className="mt-ds-xs font-heading text-ds-xl text-navy">
        {calories} {t('product.kcal')}
      </p>
      <p className="text-ds-sm text-text-secondary">{t('product.calories')}</p>
    </div>
  )
}
