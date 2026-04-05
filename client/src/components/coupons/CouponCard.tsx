import { Button } from '@/components/ui/Button'
import { useLocale } from '@/i18n/LocaleProvider'
import { formatEur } from '@/lib/format'
import type { CouponRow } from '@/lib/queries/couponsPublic'

type CouponCardProps = {
  coupon: CouponRow
  onApply?: (coupon: CouponRow) => void
  showApply?: boolean
}

function typeLabel(locale: string, c: CouponRow): string {
  switch (c.type) {
    case 'percent':
      return `${Number(c.value ?? 0)} %`
    case 'fixed':
      return formatEur(locale as 'de' | 'tr' | 'en', Number(c.value ?? 0))
    case 'free':
      return 'Gratis-Artikel'
    case 'bundle':
      return c.bundle_config?.discount_mode === 'percent'
        ? `Bundle ${c.bundle_config.discount_value} %`
        : `Bundle ${formatEur(locale as 'de' | 'tr' | 'en', c.bundle_config?.discount_value ?? 0)}`
    default:
      return ''
  }
}

export function CouponCard({ coupon, onApply, showApply = true }: CouponCardProps) {
  const { locale, t } = useLocale()

  return (
    <article className="flex flex-col rounded-md border border-brand-cream-darker bg-bg-secondary p-ds-lg shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-ds-md">
        <div>
          <h3 className="font-heading text-ds-xl text-navy">{coupon.name}</h3>
          {coupon.description ? (
            <p className="mt-ds-xs text-ds-sm text-text-secondary">{coupon.description}</p>
          ) : null}
        </div>
        {coupon.birthday_auto ? (
          <span className="rounded-full bg-brand-mint/30 px-ds-sm py-ds-2xs text-ds-xs font-medium text-navy">
            {t('coupons.birthdayBadge')}
          </span>
        ) : null}
      </div>
      <p className="mt-ds-md font-mono text-ds-lg font-semibold tracking-wide text-brand-red">
        {coupon.code}
      </p>
      <p className="mt-ds-sm text-ds-sm text-text-secondary">
        {t('coupons.type')}: {typeLabel(locale, coupon)}
      </p>
      {coupon.min_order_value > 0 ? (
        <p className="text-ds-xs text-text-secondary">
          {t('coupons.minOrder')}: {formatEur(locale, Number(coupon.min_order_value))}
        </p>
      ) : null}
      {showApply && onApply ? (
        <Button type="button" className="mt-ds-md" onClick={() => onApply(coupon)}>
          {t('coupons.apply')}
        </Button>
      ) : null}
    </article>
  )
}
