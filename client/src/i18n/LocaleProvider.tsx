import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DICTIONARIES, LOCALES, type Locale } from '@/i18n/locales'

const STORAGE_KEY = 'lekkr-locale'

function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw && LOCALES.includes(raw as Locale)) return raw as Locale
  return null
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'de'
  const lang = navigator.language?.slice(0, 2).toLowerCase()
  if (lang === 'tr') return 'tr'
  if (lang === 'en') return 'en'
  return 'de'
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return readStoredLocale() ?? detectBrowserLocale()
  })

  useLayoutEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next)
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[locale]
      let s = dict[key] ?? DICTIONARIES.de[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v))
        }
      }
      return s
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale muss innerhalb von LocaleProvider verwendet werden.')
  }
  return ctx
}
