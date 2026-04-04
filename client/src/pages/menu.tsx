import { AppLayout } from '@/components/layout/AppLayout'
import { useTenant } from '@/hooks/useTenant'

export function MenuPage() {
  const tenant = useTenant()

  return (
    <AppLayout title="Speisekarte">
      <p className="text-text-secondary">
        Platzhalter – Kategorien und Produkte folgen (tenant_id:{' '}
        <span className="font-mono text-sm">{tenant.id}</span>).
      </p>
    </AppLayout>
  )
}
