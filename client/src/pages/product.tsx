import { AppLayout } from '@/components/layout/AppLayout'
import { useParams } from 'wouter'
import { useTenant } from '@/hooks/useTenant'

export function ProductPage() {
  const params = useParams<{ id: string }>()
  const tenant = useTenant()

  return (
    <AppLayout title="Produkt">
      <p className="text-text-secondary">
        Produkt-ID: <span className="font-mono">{params.id}</span> · tenant_id:{' '}
        <span className="font-mono text-sm">{tenant.id}</span>
      </p>
    </AppLayout>
  )
}
