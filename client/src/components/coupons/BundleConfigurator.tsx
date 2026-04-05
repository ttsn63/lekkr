import { useLocale } from '@/i18n/LocaleProvider'
import { pickLocalizedName } from '@/i18n/localized'
import type { CouponRow } from '@/lib/queries/couponsPublic'
import type { ProductRow } from '@/types/catalog'

type BundleConfiguratorProps = {
  coupon: CouponRow
  products: ProductRow[]
  selectedIds: string[]
  onToggle: (productId: string) => void
}

export function BundleConfigurator({
  coupon,
  products,
  selectedIds,
  onToggle,
}: BundleConfiguratorProps) {
  const { locale, t } = useLocale()
  const cfg = coupon.bundle_config
  if (!cfg?.eligible_product_ids?.length) return null

  const eligible = products.filter((p) => cfg.eligible_product_ids.includes(p.id))
  const need = cfg.pick_count
  const ok = selectedIds.length === need && new Set(selectedIds).size === need

  return (
    <div className="mt-ds-md rounded-md border border-brand-cream-dark bg-bg-primary p-ds-md">
      <p className="text-ds-sm font-medium text-navy">
        {t('coupons.bundlePick', { count: String(need) })}
      </p>
      <ul className="mt-ds-sm space-y-ds-sm">
        {eligible.map((p) => {
          const checked = selectedIds.includes(p.id)
          return (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-ds-sm text-ds-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selectedIds.length >= need}
                  onChange={() => onToggle(p.id)}
                />
                <span>{pickLocalizedName(locale, p)}</span>
              </label>
            </li>
          )
        })}
      </ul>
      {!ok ? (
        <p className="mt-ds-sm text-ds-xs text-[color:var(--color-warning)]">{t('coupons.bundleIncomplete')}</p>
      ) : (
        <p className="mt-ds-sm text-ds-xs text-[color:var(--color-success)]">{t('coupons.bundleOk')}</p>
      )}
    </div>
  )
}
