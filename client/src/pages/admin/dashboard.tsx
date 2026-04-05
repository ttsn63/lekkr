import { useQuery } from '@tanstack/react-query'
import { AdminPage } from '@/components/admin/AdminPage'
import { Card, CardContent } from '@/components/ui/Card'
import { fetchDashboardStats } from '@/lib/queries/adminDashboard'
import { useTenant } from '@/hooks/useTenant'

function formatEur(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export function AdminDashboardPage() {
  const tenant = useTenant()
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats', tenant.id],
    queryFn: () => fetchDashboardStats(tenant.id),
  })

  return (
    <AdminPage title="Dashboard">
      {isLoading ? (
        <p className="text-text-secondary">Lade KPIs…</p>
      ) : error ? (
        <p className="text-[color:var(--color-error)]">Konnte Statistiken nicht laden.</p>
      ) : data ? (
        <div className="grid gap-ds-lg sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-ds-sm font-medium text-text-secondary">Umsatz (bezahlt, gesamt)</p>
              <p className="mt-ds-sm font-heading text-ds-3xl text-navy">{formatEur(data.revenueTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-ds-sm font-medium text-text-secondary">Umsatz (30 Tage)</p>
              <p className="mt-ds-sm font-heading text-ds-3xl text-navy">{formatEur(data.revenue30d)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-ds-sm font-medium text-text-secondary">Bezahlte Bestellungen</p>
              <p className="mt-ds-sm font-heading text-ds-3xl text-navy">{data.ordersPaidCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-ds-sm font-medium text-text-secondary">Offene / laufende Bestellungen</p>
              <p className="mt-ds-sm font-heading text-ds-3xl text-navy">{data.ordersOpenCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-ds-sm font-medium text-text-secondary">Bestellungen (Kalendermonat)</p>
              <p className="mt-ds-sm font-heading text-ds-3xl text-navy">{data.ordersMonthCount}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <p className="mt-ds-xl text-ds-xs text-text-secondary">
        Alle Kennzahlen filtern nach <span className="font-mono">tenant_id = {tenant.id}</span>.
      </p>
    </AdminPage>
  )
}
