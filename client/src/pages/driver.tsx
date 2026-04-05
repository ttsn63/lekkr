import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/Button'
import { RequireDriver } from '@/components/staff/RequireDriver'
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime'
import { useStaffRole } from '@/hooks/useStaffRole'
import { useTenant } from '@/hooks/useTenant'
import {
  assignDriverToOrder,
  claimDeliveryOrder,
  fetchDriverOrders,
  fetchDriversForTenant,
  markOrderDelivered,
  updateDriverGps,
  type DriverOrderRow,
} from '@/lib/queries/driverOrders'

function formatAddr(addr: Record<string, unknown> | null): string {
  if (!addr || typeof addr !== 'object') return '—'
  const street = String(addr.street ?? addr.line1 ?? '')
  const city = String(addr.city ?? '')
  const zip = String(addr.zip ?? addr.postal_code ?? '')
  const parts = [street, [zip, city].filter(Boolean).join(' ')].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

function DriverBoardInner() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const { data: staff } = useStaffRole(tenant.id)
  const canAssign = staff?.canAssignDrivers ?? false

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['driver-orders', tenant.id, staff?.id],
    queryFn: async () => {
      if (!staff?.id) return []
      return fetchDriverOrders(tenant.id, staff.id)
    },
    enabled: Boolean(staff?.id),
    refetchInterval: 20_000,
  })

  useOrdersRealtime(tenant.id)

  const { data: drivers = [] } = useQuery({
    queryKey: ['tenant-drivers', tenant.id],
    queryFn: () => fetchDriversForTenant(tenant.id),
    enabled: Boolean(tenant.id) && canAssign,
  })

  const [assignTarget, setAssignTarget] = useState<DriverOrderRow | null>(null)
  const [assignDriverId, setAssignDriverId] = useState('')

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['driver-orders', tenant.id] })
  }, [qc, tenant.id])

  const claimMut = useMutation({
    mutationFn: (orderId: string) => {
      if (!staff?.id) throw new Error('Session')
      return claimDeliveryOrder(tenant.id, orderId, staff.id)
    },
    onSuccess: invalidate,
  })

  const assignMut = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      assignDriverToOrder(tenant.id, orderId, driverId),
    onSuccess: () => {
      invalidate()
      setAssignTarget(null)
      setAssignDriverId('')
    },
  })

  const deliveredMut = useMutation({
    mutationFn: (orderId: string) => markOrderDelivered(tenant.id, orderId),
    onSuccess: invalidate,
  })

  const gpsMut = useMutation({
    mutationFn: ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) =>
      updateDriverGps(tenant.id, orderId, lat, lng),
    onSuccess: invalidate,
  })

  const openOrders = orders.filter(
    (o) => o.type === 'delivery' && o.status === 'ready' && !o.driver_id,
  )
  const myActive = orders.filter(
    (o) =>
      staff != null &&
      o.driver_id === staff.id &&
      (o.status === 'delivering' || o.status === 'ready'),
  )

  const sendGps = (orderId: string) => {
    if (!navigator.geolocation) {
      window.alert('Geolocation wird von diesem Gerät nicht unterstützt.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsMut.mutate({
          orderId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => window.alert('Standort konnte nicht ermittelt werden (Berechtigung prüfen).'),
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-ds-md border-b border-brand-cream-darker bg-navy px-ds-md py-ds-md text-text-light">
        <div>
          <h1 className="font-heading text-ds-2xl font-semibold">Fahrer</h1>
          <p className="text-ds-xs opacity-80">Live · {tenant.slug}</p>
        </div>
        <Link
          href="/"
          className="rounded-sm px-ds-md py-ds-sm text-ds-sm text-brand-mint underline min-h-[52px] inline-flex items-center"
        >
          ← Website
        </Link>
      </header>

      <main className="space-y-ds-xl p-ds-md">
        {isLoading ? (
          <p className="text-text-secondary">Lade Touren…</p>
        ) : (
          <>
            <section aria-labelledby="open-deliveries">
              <h2 id="open-deliveries" className="mb-ds-md font-heading text-ds-xl text-navy">
                Freie Lieferungen
              </h2>
              {openOrders.length === 0 ? (
                <p className="text-ds-sm text-text-secondary">Keine offenen Lieferungen.</p>
              ) : (
                <ul className="flex flex-col gap-ds-md">
                  {openOrders.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-md border-2 border-brand-cream-darker bg-bg-secondary p-ds-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-ds-md">
                        <div>
                          <p className="font-heading text-ds-xl font-semibold text-navy">
                            #{o.order_number}
                          </p>
                          <p className="text-ds-sm text-text-secondary">{formatAddr(o.delivery_address)}</p>
                          <p className="mt-ds-xs text-ds-xs text-text-secondary">
                            {new Date(o.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-ds-sm">
                          {staff?.canDriver ? (
                            <Button
                              type="button"
                              size="lg"
                              className="min-h-[52px] touch-manipulation"
                              onClick={() => claimMut.mutate(o.id)}
                              disabled={claimMut.isPending}
                            >
                              Übernehmen
                            </Button>
                          ) : null}
                          {canAssign ? (
                            <Button
                              type="button"
                              size="lg"
                              variant="secondary"
                              className="min-h-[52px] touch-manipulation"
                              onClick={() => {
                                setAssignTarget(o)
                                setAssignDriverId(drivers[0]?.id ?? '')
                              }}
                            >
                              Fahrer zuweisen
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="my-tours">
              <h2 id="my-tours" className="mb-ds-md font-heading text-ds-xl text-navy">
                Meine Touren
              </h2>
              {myActive.length === 0 ? (
                <p className="text-ds-sm text-text-secondary">Keine aktive Lieferung.</p>
              ) : (
                <ul className="flex flex-col gap-ds-md">
                  {myActive.map((o) => (
                    <li
                      key={o.id}
                      className="rounded-md border-2 border-brand-cream-darker bg-bg-secondary p-ds-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-ds-md">
                        <div>
                          <p className="font-heading text-ds-xl font-semibold text-navy">
                            #{o.order_number}
                          </p>
                          <p className="text-ds-sm">{formatAddr(o.delivery_address)}</p>
                          <p className="mt-ds-xs text-ds-xs text-text-secondary">
                            Status: {o.status}
                            {o.driver_location_updated_at
                              ? ` · GPS ${new Date(o.driver_location_updated_at).toLocaleTimeString('de-DE')}`
                              : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-ds-sm">
                          <Button
                            type="button"
                            size="lg"
                            variant="secondary"
                            className="min-h-[52px] touch-manipulation"
                            onClick={() => sendGps(o.id)}
                            disabled={gpsMut.isPending}
                          >
                            GPS senden
                          </Button>
                          <Button
                            type="button"
                            size="lg"
                            variant="success"
                            className="min-h-[52px] touch-manipulation"
                            onClick={() => deliveredMut.mutate(o.id)}
                            disabled={deliveredMut.isPending}
                          >
                            Geliefert
                          </Button>
                        </div>
                      </div>
                      <ul className="mt-ds-md space-y-ds-xs text-ds-sm">
                        {(o.order_items ?? []).map((line) => (
                          <li key={line.id}>
                            {line.quantity}×{' '}
                            {Array.isArray(line.products)
                              ? (line.products[0]?.name ?? 'Produkt')
                              : (line.products?.name ?? 'Produkt')}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {assignTarget && canAssign ? (
        <div
          className="fixed inset-0 z-modal flex items-end justify-center bg-navy/45 p-ds-md md:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-title"
        >
          <div className="w-full max-w-md rounded-md border border-brand-cream-darker bg-bg-secondary p-ds-lg shadow-xl">
            <h2 id="assign-title" className="font-heading text-ds-xl text-navy">
              Fahrer zuweisen · #{assignTarget.order_number}
            </h2>
            <label className="mt-ds-md block text-ds-sm font-medium text-navy" htmlFor="driver-pick">
              Fahrer
            </label>
            <select
              id="driver-pick"
              className="mt-ds-sm w-full min-h-[52px] rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md py-ds-sm text-ds-base"
              value={assignDriverId}
              onChange={(e) => setAssignDriverId(e.target.value)}
            >
              <option value="">Bitte wählen</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name ?? d.email}
                </option>
              ))}
            </select>
            <div className="mt-ds-lg flex flex-wrap justify-end gap-ds-sm">
              <Button type="button" variant="ghost" onClick={() => setAssignTarget(null)}>
                Abbrechen
              </Button>
              <Button
                type="button"
                disabled={!assignDriverId || assignMut.isPending}
                onClick={() => {
                  if (!assignDriverId) return
                  assignMut.mutate({ orderId: assignTarget.id, driverId: assignDriverId })
                }}
              >
                Zuweisen
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function DriverPage() {
  return (
    <RequireDriver>
      <DriverBoardInner />
    </RequireDriver>
  )
}
