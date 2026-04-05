import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState, type ReactNode } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { RequireKitchen } from '@/components/staff/RequireKitchen'
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime'
import { useTenant } from '@/hooks/useTenant'
import {
  fetchKitchenOrders,
  updateOrderKitchenStatus,
  type KitchenOrderRow,
} from '@/lib/queries/kitchenOrders'
import { unlockOrderAudio } from '@/lib/sound/playOrderBeep'

const NEU = new Set(['new', 'confirmed'])
const ARBEIT = new Set(['preparing'])
const FERTIG = new Set(['ready'])

function waitAccent(createdAt: string): 'default' | 'warning' | 'danger' {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60_000
  if (mins >= 20) return 'danger'
  if (mins >= 10) return 'warning'
  return 'default'
}

const borderByAccent = {
  default: 'border-brand-cream-darker',
  warning: 'border-[color:var(--color-warning)] shadow-[0_0_0_2px_rgba(245,166,35,0.35)]',
  danger: 'border-[color:var(--color-error)] shadow-[0_0_0_2px_rgba(204,42,64,0.35)]',
}

function OrderCard({
  order,
  children,
}: {
  order: KitchenOrderRow
  children: ReactNode
}) {
  const accent = waitAccent(order.created_at)
  return (
    <article
      className={`rounded-md border-2 bg-bg-secondary p-ds-md ${borderByAccent[accent]}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-ds-sm">
        <span className="font-heading text-ds-xl font-semibold text-navy">#{order.order_number}</span>
        <span className="text-ds-sm text-text-secondary">
          {order.type === 'delivery' ? 'Lieferung' : 'Abholung'}
        </span>
      </header>
      <p className="mt-ds-xs text-ds-xs text-text-secondary">
        {new Date(order.created_at).toLocaleString('de-DE')}
      </p>
      <ul className="mt-ds-md space-y-ds-xs text-ds-sm">
        {(order.order_items ?? []).map((line) => (
          <li key={line.id}>
            <span className="font-medium">{line.quantity}×</span>{' '}
            {Array.isArray(line.products)
              ? (line.products[0]?.name ?? 'Produkt')
              : (line.products?.name ?? 'Produkt')}
            <span className="text-text-secondary"> · {Number(line.unit_price).toFixed(2)} €</span>
          </li>
        ))}
      </ul>
      {order.notes ? (
        <p className="mt-ds-md rounded-sm bg-brand-cream-dark/60 p-ds-sm text-ds-sm">📝 {order.notes}</p>
      ) : null}
      <div className="mt-ds-md flex flex-wrap gap-ds-sm">{children}</div>
    </article>
  )
}

function KitchenBoardInner() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const [soundOn, setSoundOn] = useState(false)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders', tenant.id],
    queryFn: () => fetchKitchenOrders(tenant.id),
    refetchInterval: 30_000,
  })

  useOrdersRealtime(tenant.id, soundOn)

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['kitchen-orders', tenant.id] })
  }, [qc, tenant.id])

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateOrderKitchenStatus(tenant.id, id, status),
    onSuccess: invalidate,
  })

  const neu = orders.filter((o) => NEU.has(o.status))
  const arbeit = orders.filter((o) => ARBEIT.has(o.status))
  const fertig = orders.filter((o) => FERTIG.has(o.status))

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-ds-md border-b border-brand-cream-darker bg-navy px-ds-md py-ds-md text-text-light">
        <div>
          <h1 className="font-heading text-ds-2xl font-semibold">Küche</h1>
          <p className="text-ds-xs opacity-80">Live · Realtime · {tenant.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-ds-sm">
          <Button
            type="button"
            size="lg"
            variant={soundOn ? 'success' : 'secondary'}
            className="min-h-[52px] touch-manipulation"
            onClick={() => {
              unlockOrderAudio()
              setSoundOn(true)
            }}
          >
            {soundOn ? 'Ton aktiv' : 'Ton aktivieren'}
          </Button>
          <Link
            href="/"
            className="rounded-sm px-ds-md py-ds-sm text-ds-sm text-brand-mint underline min-h-[52px] inline-flex items-center"
          >
            ← Website
          </Link>
        </div>
      </header>

      {isLoading ? (
        <p className="p-ds-lg text-text-secondary">Lade Bestellungen…</p>
      ) : (
        <div className="grid gap-ds-md p-ds-md md:grid-cols-3">
          <section aria-labelledby="col-neu">
            <h2 id="col-neu" className="mb-ds-md font-heading text-ds-xl text-navy">
              Neu
            </h2>
            <div className="flex flex-col gap-ds-md">
              {neu.map((o) => (
                <OrderCard key={o.id} order={o}>
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-[52px] min-w-[140px] touch-manipulation"
                    onClick={() => moveMut.mutate({ id: o.id, status: 'preparing' })}
                    disabled={moveMut.isPending}
                  >
                    In Arbeit
                  </Button>
                </OrderCard>
              ))}
              {neu.length === 0 ? (
                <p className="text-ds-sm text-text-secondary">Keine neuen Bestellungen.</p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="col-arbeit">
            <h2 id="col-arbeit" className="mb-ds-md font-heading text-ds-xl text-navy">
              In Arbeit
            </h2>
            <div className="flex flex-col gap-ds-md">
              {arbeit.map((o) => (
                <OrderCard key={o.id} order={o}>
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-[52px] min-w-[140px] touch-manipulation"
                    onClick={() => moveMut.mutate({ id: o.id, status: 'ready' })}
                    disabled={moveMut.isPending}
                  >
                    Fertig
                  </Button>
                </OrderCard>
              ))}
              {arbeit.length === 0 ? (
                <p className="text-ds-sm text-text-secondary">Nichts in Zubereitung.</p>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="col-fertig">
            <h2 id="col-fertig" className="mb-ds-md font-heading text-ds-xl text-navy">
              Fertig
            </h2>
            <div className="flex flex-col gap-ds-md">
              {fertig.map((o) => (
                <OrderCard key={o.id} order={o}>
                  {o.type === 'pickup' ? (
                    <Button
                      type="button"
                      size="lg"
                      variant="success"
                      className="min-h-[52px] touch-manipulation"
                      onClick={() => moveMut.mutate({ id: o.id, status: 'delivered' })}
                      disabled={moveMut.isPending}
                    >
                      Ausgegeben
                    </Button>
                  ) : (
                    <p className="text-ds-sm text-text-secondary">
                      Lieferung – Fahrer übernimmt im Fahrer-Dashboard.
                    </p>
                  )}
                </OrderCard>
              ))}
              {fertig.length === 0 ? (
                <p className="text-ds-sm text-text-secondary">Nichts fertig.</p>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export function KitchenPage() {
  return (
    <RequireKitchen>
      <KitchenBoardInner />
    </RequireKitchen>
  )
}
