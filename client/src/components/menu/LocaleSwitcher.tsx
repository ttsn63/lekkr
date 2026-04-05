import { LOCALE_LABELS, LOCALES } from '@/i18n/locales'
import { useLocale } from '@/i18n/LocaleProvider'

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div
      className="flex rounded-sm border border-brand-cream-darker bg-bg-secondary p-ds-2xs"
      role="group"
      aria-label="Sprache"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-sm px-ds-sm py-ds-2xs text-ds-xs font-medium transition-colors ${
            locale === code
              ? 'bg-navy text-text-light'
              : 'text-text-secondary hover:text-navy'
          }`}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  )
}
