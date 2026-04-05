import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useStaffRole } from '@/hooks/useStaffRole'
import { useTenant } from '@/hooks/useTenant'

export function RequireKitchen({ children }: { children: ReactNode }) {
  const tenant = useTenant()
  const [, navigate] = useLocation()
  const { user, loading: authLoading } = useAuthSession()
  const { data: staff, isLoading, isError } = useStaffRole(tenant.id)

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-ds-lg">
        <p className="text-text-secondary">Lade Berechtigung…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-ds-lg bg-bg-primary p-ds-lg">
        <p className="text-center text-text-secondary">Bitte anmelden (Magic Link oder OAuth).</p>
        <Button type="button" onClick={() => navigate('/login')}>
          Zum Login
        </Button>
      </div>
    )
  }

  if (isError || !staff?.canKitchen) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-ds-md bg-bg-primary p-ds-lg text-center">
        <p className="text-text-secondary">
          Kein Zugriff auf die Küche. Benötigt Rolle „Küche“ oder „Admin“ für diesen Mandanten.
        </p>
        <Link href="/" className="text-ds-sm text-navy underline">
          Zur Startseite
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
