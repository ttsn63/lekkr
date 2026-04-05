import { useLocale } from '@/i18n/LocaleProvider'

type PopularityBadgeProps = {
  count: number
  className?: string
}

export function PopularityBadge({ count, className = '' }: PopularityBadgeProps) {
  const { t } = useLocale()
  if (count <= 0) return null

  return (
    <span
      className={`inline-flex items-center gap-ds-2xs rounded-full bg-brand-mint/30 px-ds-sm py-ds-2xs text-ds-xs font-medium text-navy ${className}`}
      title={t('product.popularity')}
    >
      <span aria-hidden>🔥</span>
      {t('product.ordersApprox', { count })}
    </span>
  )
}
