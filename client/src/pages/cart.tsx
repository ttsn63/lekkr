import { AppLayout } from '@/components/layout/AppLayout'
import { useCartStore } from '@/store/cartStore'
import { useTenant } from '@/hooks/useTenant'

export function CartPage() {
  const tenant = useTenant()
  const lines = useCartStore((s) => s.lines)

  return (
    <AppLayout title="Warenkorb">
      <p className="mb-4 text-text-secondary">
        Tenant: <span className="font-mono text-sm">{tenant.id}</span> · Zeilen: {lines.length}
      </p>
      {lines.length === 0 ? (
        <p className="text-text-secondary">Der Warenkorb ist noch leer.</p>
      ) : null}
    </AppLayout>
  )
}
