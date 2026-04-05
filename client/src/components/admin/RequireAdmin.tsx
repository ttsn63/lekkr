import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useTenant } from '@/hooks/useTenant'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const tenant = useTenant()
  const { user, loading: authLoading } = useAuthSession()
  const { data: adminCheck, isLoading: roleLoading, isError } = useIsAdmin(tenant.id)
  const [, navigate] = useLocation()

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-ds-lg">
        <p className="text-text-secondary">Lade Berechtigung…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-ds-lg bg-bg-primary p-ds-lg">
        <p className="text-center text-text-secondary">Bitte mit Admin-Konto anmelden.</p>
        <Button type="button" onClick={() => navigate('/admin/login')}>
          Zum Admin-Login
        </Button>
        <Link href="/login" className="text-ds-sm text-navy underline">
          Kunden-Login (Magic Link)
        </Link>
      </div>
    )
  }

  if (isError || !adminCheck?.ok) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-ds-md bg-bg-primary p-ds-lg text-center">
        <p className="text-text-secondary">
          Kein Zugriff: Dein Konto ist kein Admin für diesen Tenant oder die Rolle fehlt in der Datenbank.
        </p>
        <p className="font-mono text-ds-xs text-text-secondary">tenant_id: {tenant.id}</p>
        <Link href="/" className="text-ds-sm text-navy underline">
          Zur Startseite
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
