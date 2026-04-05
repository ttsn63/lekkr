import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTenant } from '@/hooks/useTenant'

const PREFIX = 'lekkr_ref_'

export function referralStorageKey(tenantId: string) {
  return `${PREFIX}${tenantId}`
}

/**
 * Speichert ?ref=CODE für spätere Verknüpfung nach Login (Profil / RPC).
 */
export function useReferralCapture() {
  const tenant = useTenant()
  const [loc] = useLocation()

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search)
    const ref = qs.get('ref')?.trim()
    if (ref && ref.length >= 4) {
      try {
        localStorage.setItem(referralStorageKey(tenant.id), ref.toUpperCase())
      } catch {
        /* ignore quota */
      }
    }
  }, [loc, tenant.id])
}
