import type { Locale } from '@/i18n/locales'

type LocalizedRow = {
  name: string
  name_tr?: string | null
  name_en?: string | null
}

type LocalizedDesc = {
  description?: string | null
  description_tr?: string | null
  description_en?: string | null
}

export function pickLocalizedName(locale: Locale, row: LocalizedRow): string {
  if (locale === 'tr' && row.name_tr?.trim()) return row.name_tr.trim()
  if (locale === 'en' && row.name_en?.trim()) return row.name_en.trim()
  return row.name
}

export function pickLocalizedDescription(locale: Locale, row: LocalizedDesc): string | null {
  const d =
    locale === 'tr'
      ? row.description_tr
      : locale === 'en'
        ? row.description_en
        : row.description
  const fallback = row.description ?? null
  const chosen = d?.trim() ? d : fallback
  return chosen?.trim() ?? null
}

export function matchesSearchQuery(
  _locale: Locale,
  row: LocalizedRow & LocalizedDesc,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const fields = [
    row.name,
    row.name_tr,
    row.name_en,
    row.description,
    row.description_tr,
    row.description_en,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase())
  return fields.some((f) => f.includes(needle))
}
