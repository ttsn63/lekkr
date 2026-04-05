/**
 * Öffentliche Basis-URL (VITE_PUBLIC_SITE_URL oder aktueller Origin).
 * Für Supabase OAuth / Magic-Link Redirects mit den gleichen URLs wie in der Konsole whitelisten.
 */
export function getPublicSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}
