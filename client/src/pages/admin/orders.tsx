import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminPage } from '@/components/admin/AdminPage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTenant } from '@/hooks/useTenant'
import { fetchAdminOrders, rejectOrder, type AdminOrderRow } from '@/lib/queries/adminOrders'

export function AdminOrdersPage() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'live' | 'archive'>('live')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AdminOrderRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', tenant.id, tab],
    queryFn: () => fetchAdminOrders(tenant.id, tab),
    refetchInterval: tab === 'live' ? 8000 : false,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-orders', tenant.id] })
  }

  const rejectMut = useMutation({
    mutationFn: () => {
      if (!rejectTarget || !rejectReason.trim()) {
        return Promise.reject(new Error('Begründung fehlt'))
      }
      return rejectOrder(tenant.id, rejectTarget.id, rejectReason.trim())
    },
    onSuccess: () => {
      invalidate()
      setRejectOpen(false)
      setRejectTarget(null)
      setRejectReason('')
    },
  })

  return (
    <AdminPage title="Bestellungen">
      <div className="mb-ds-lg flex gap-ds-sm">
        <Button
          type="button"
          variant={tab === 'live' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('live')}
        >
          Live
        </Button>
        <Button
          type="button"
          variant={tab === 'archive' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('archive')}
        >
          Archiv
        </Button>
        {tab === 'live' ? (
          <span className="self-center text-ds-xs text-text-secondary">(Auto-Aktualisierung alle 8 s)</span>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-text-secondary">Lade…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-cream-darker">
          <table className="w-full min-w-[720px] text-left text-ds-sm">
            <thead className="border-b border-brand-cream-dark bg-brand-cream-dark/40">
              <tr>
                <th className="p-ds-sm">Nr.</th>
                <th className="p-ds-sm">Status</th>
                <th className="p-ds-sm">Typ</th>
                <th className="p-ds-sm">Zahlung</th>
                <th className="p-ds-sm">Summe</th>
                <th className="p-ds-sm">Zeit</th>
                <th className="p-ds-sm" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-brand-cream-dark">
                  <td className="p-ds-sm font-mono text-ds-xs">{o.order_number}</td>
                  <td className="p-ds-sm">{o.status}</td>
                  <td className="p-ds-sm">{o.type}</td>
                  <td className="p-ds-sm">
                    {o.payment_status}
                    {o.payment_method ? ` · ${o.payment_method}` : ''}
                  </td>
                  <td className="p-ds-sm">{Number(o.total).toFixed(2)} €</td>
                  <td className="p-ds-sm text-text-secondary">
                    {new Date(o.created_at).toLocaleString('de-DE')}
                  </td>
                  <td className="p-ds-sm">
                    {tab === 'live' && o.status !== 'cancelled' ? (
                      <button
                        type="button"
                        className="text-[color:var(--color-error)] underline"
                        onClick={() => {
                          setRejectTarget(o)
                          setRejectReason('')
                          setRejectOpen(true)
                        }}
                      >
                        Ablehnen
                      </button>
                    ) : o.rejection_reason ? (
                      <span className="text-ds-xs text-text-secondary" title={o.rejection_reason}>
                        Grund: {o.rejection_reason.slice(0, 40)}
                        {o.rejection_reason.length > 40 ? '…' : ''}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false)
          setRejectTarget(null)
        }}
        title="Bestellung ablehnen"
        description="Die Bestellung wird auf „cancelled“ gesetzt und der Gast sieht die Begründung nicht automatisch (intern)."
        primaryAction={{
          label: 'Ablehnen',
          onClick: () => rejectMut.mutate(),
          disabled: rejectMut.isPending || !rejectReason.trim(),
        }}
      >
        <Input
          label="Begründung (intern)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </AdminPage>
  )
}
