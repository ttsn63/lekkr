import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'

const STORAGE_KEY = 'lekkr_cookie_consent_v1'

export type CookieConsent = 'none' | 'essential' | 'all'

export function readCookieConsent(): CookieConsent {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'essential' || v === 'all') return v
  } catch {
    /* ignore */
  }
  return 'none'
}

export function CookieBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(readCookieConsent() === 'none')
  }, [])

  function setConsent(v: 'essential' | 'all') {
    try {
      localStorage.setItem(STORAGE_KEY, v)
    } catch {
      /* ignore */
    }
    setOpen(false)
    window.dispatchEvent(new Event('lekkr-cookie-consent'))
  }

  if (!open) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-brand-cream-darker bg-bg-secondary p-ds-md shadow-[0_-4px_24px_rgba(0,0,0,.08)]"
      role="dialog"
      aria-label="Cookie-Einstellungen"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-ds-md md:flex-row md:items-center md:justify-between">
        <p className="text-ds-sm text-text-primary">
          Wir nutzen Cookies und ähnliche Techniken für den Shop-Betrieb (Warenkorb, Login). Optionale
          Cookies helfen uns bei der Analyse. Details in der{' '}
          <Link href="/datenschutz" className="text-navy underline">
            Datenschutzerklärung
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-ds-sm">
          <Button type="button" variant="secondary" size="sm" onClick={() => setConsent('essential')}>
            Nur notwendige
          </Button>
          <Button type="button" size="sm" onClick={() => setConsent('all')}>
            Alle akzeptieren
          </Button>
        </div>
      </div>
    </div>
  )
}
