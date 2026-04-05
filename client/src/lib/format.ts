import type { Locale } from '@/i18n/locales'

export function formatEur(locale: Locale, value: number) {
  const tag = locale === 'tr' ? 'tr-TR' : locale === 'en' ? 'en-DE' : 'de-DE'
  return new Intl.NumberFormat(tag, { style: 'currency', currency: 'EUR' }).format(value)
}
