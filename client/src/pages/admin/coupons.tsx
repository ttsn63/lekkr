import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { AdminPage } from '@/components/admin/AdminPage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useProductsQuery } from '@/hooks/useCatalogQueries'
import { useTenant } from '@/hooks/useTenant'
import type { BundleConfig } from '@/lib/coupons/computeDiscount'
import {
  deleteCoupon,
  fetchAdminCoupons,
  fetchCouponUsageStats,
  insertCoupon,
  updateCoupon,
  type CouponInsert,
} from '@/lib/queries/adminCoupons'
import type { CouponRow } from '@/lib/queries/couponsPublic'
import { formatEur } from '@/lib/format'

const emptyForm: CouponInsert = {
  tenant_id: '',
  code: '',
  name: '',
  description: '',
  type: 'percent',
  value: 10,
  min_order_value: 0,
  max_uses: null,
  valid_from: null,
  valid_until: null,
  target: 'all',
  active: true,
  bundle_config: null,
  free_product_id: null,
  birthday_auto: false,
  max_uses_per_user: 1,
}

export function AdminCouponsPage() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const { data: products = [] } = useProductsQuery(tenant.id)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-coupons', tenant.id],
    queryFn: () => fetchAdminCoupons(tenant.id),
  })

  const { data: stats = [] } = useQuery({
    queryKey: ['admin-coupon-stats', tenant.id],
    queryFn: () => fetchCouponUsageStats(tenant.id),
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CouponRow | null>(null)
  const [form, setForm] = useState<CouponInsert>({ ...emptyForm, tenant_id: tenant.id })

  const [eligibleIds, setEligibleIds] = useState<string[]>([])
  const [bundlePick, setBundlePick] = useState(2)
  const [bundleMode, setBundleMode] = useState<'percent' | 'fixed'>('percent')
  const [bundleDisc, setBundleDisc] = useState(10)

  const saveMut = useMutation({
    mutationFn: async () => {
      let bundle_config: BundleConfig | null = null
      if (form.type === 'bundle') {
        if (eligibleIds.length < 1 || bundlePick < 1) throw new Error('Bundle: Produkte und Anzahl prüfen')
        bundle_config = {
          eligible_product_ids: eligibleIds,
          pick_count: bundlePick,
          discount_mode: bundleMode,
          discount_value: bundleDisc,
        }
      }
      const payload: CouponInsert = {
        ...form,
        tenant_id: tenant.id,
        bundle_config,
        free_product_id: form.type === 'free' ? form.free_product_id : null,
        value:
          form.type === 'free'
            ? null
            : form.type === 'bundle'
              ? null
              : Number(form.value ?? 0),
        valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      }
      if (editing) {
        await updateCoupon(tenant.id, editing.id, payload)
      } else {
        await insertCoupon(payload)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-coupons', tenant.id] })
      void qc.invalidateQueries({ queryKey: ['admin-coupon-stats', tenant.id] })
      void qc.invalidateQueries({ queryKey: ['public-coupons', tenant.id] })
      setModalOpen(false)
      setEditing(null)
      setForm({ ...emptyForm, tenant_id: tenant.id })
      setEligibleIds([])
    },
  })

  const delMut = useMutation({
    mutationFn: (id: string) => deleteCoupon(tenant.id, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-coupons', tenant.id] })
      void qc.invalidateQueries({ queryKey: ['admin-coupon-stats', tenant.id] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, tenant_id: tenant.id })
    setEligibleIds([])
    setBundlePick(2)
    setBundleMode('percent')
    setBundleDisc(10)
    setModalOpen(true)
  }

  const openEdit = (c: CouponRow) => {
    setEditing(c)
    setForm({
      tenant_id: tenant.id,
      code: c.code,
      name: c.name,
      description: c.description ?? '',
      type: c.type,
      value: c.value,
      min_order_value: c.min_order_value,
      max_uses: c.max_uses,
      valid_from: c.valid_from
        ? new Date(c.valid_from as string).toISOString().slice(0, 16)
        : null,
      valid_until: c.valid_until
        ? new Date(c.valid_until as string).toISOString().slice(0, 16)
        : null,
      target: c.target,
      active: c.active,
      bundle_config: c.bundle_config,
      free_product_id: c.free_product_id,
      birthday_auto: c.birthday_auto,
      max_uses_per_user: c.max_uses_per_user,
    })
    if (c.bundle_config) {
      setEligibleIds(c.bundle_config.eligible_product_ids)
      setBundlePick(c.bundle_config.pick_count)
      setBundleMode(c.bundle_config.discount_mode)
      setBundleDisc(c.bundle_config.discount_value)
    }
    setModalOpen(true)
  }

  const statMap = useMemo(() => new Map(stats.map((s) => [s.coupon_id, s])), [stats])

  return (
    <AdminPage title="Coupons">
      <div className="mb-ds-xl">
        <h2 className="font-heading text-ds-lg text-navy">Statistik (Einlösungen)</h2>
        {stats.length === 0 ? (
          <p className="mt-ds-sm text-ds-sm text-text-secondary">Noch keine Einlösungen erfasst.</p>
        ) : (
          <table className="mt-ds-md w-full text-left text-ds-sm">
            <thead>
              <tr className="border-b border-brand-cream-darker">
                <th className="py-ds-sm">Code</th>
                <th className="py-ds-sm">Name</th>
                <th className="py-ds-sm">Nutzungen</th>
                <th className="py-ds-sm">Rabatt-Summe</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.coupon_id} className="border-b border-brand-cream-dark">
                  <td className="py-ds-sm font-mono">{s.code}</td>
                  <td className="py-ds-sm">{s.name}</td>
                  <td className="py-ds-sm">{s.usage_count}</td>
                  <td className="py-ds-sm">{formatEur('de', s.discount_sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          Neuer Coupon
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-ds-md text-text-secondary">Lade…</p>
      ) : (
        <ul className="mt-ds-lg space-y-ds-md">
          {rows.map((c) => {
            const st = statMap.get(c.id)
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-ds-md rounded-md border border-brand-cream-darker bg-bg-secondary p-ds-md"
              >
                <div>
                  <p className="font-mono font-semibold text-brand-red">{c.code}</p>
                  <p className="text-navy">{c.name}</p>
                  <p className="text-ds-xs text-text-secondary">
                    Typ: {c.type} · aktiv: {c.active ? 'ja' : 'nein'}
                    {st ? ` · Einlösungen: ${st.usage_count}` : ''}
                  </p>
                </div>
                <div className="flex gap-ds-sm">
                  <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(c)}>
                    Bearbeiten
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm('Coupon löschen?')) delMut.mutate(c.id)
                    }}
                  >
                    Löschen
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Coupon bearbeiten' : 'Neuer Coupon'}
        primaryAction={{
          label: 'Speichern',
          disabled: saveMut.isPending,
          onClick: () => saveMut.mutate(),
        }}
      >
        <div className="space-y-ds-md">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <label className="block text-ds-sm font-medium text-navy">Beschreibung</label>
          <textarea
            className="w-full rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md py-ds-sm text-ds-sm"
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <label className="block text-ds-sm font-medium text-navy">Typ</label>
          <select
            className="w-full min-h-[44px] rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as CouponInsert['type'] }))
            }
          >
            <option value="percent">Prozent</option>
            <option value="fixed">Fixbetrag</option>
            <option value="bundle">Bundle (Produktauswahl)</option>
            <option value="free">Gratis-Artikel</option>
          </select>

          {form.type === 'percent' || form.type === 'fixed' ? (
            <Input
              label={form.type === 'percent' ? 'Prozent (1–100)' : 'Betrag (€)'}
              type="number"
              step="0.01"
              value={form.value ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))
              }
            />
          ) : null}

          {form.type === 'free' ? (
            <div>
              <label className="text-ds-sm font-medium text-navy">Gratis-Produkt</label>
              <select
                className="mt-ds-xs w-full min-h-[44px] rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md"
                value={form.free_product_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, free_product_id: e.target.value || null }))
                }
              >
                <option value="">Bitte wählen</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.type === 'bundle' ? (
            <div className="space-y-ds-sm rounded-md border border-brand-cream-dark p-ds-md">
              <p className="text-ds-sm font-medium text-navy">Bundle-Konfiguration</p>
              <label className="text-ds-xs text-text-secondary">Wählbare Produkte (Mehrfachauswahl)</label>
              <div className="max-h-40 space-y-ds-xs overflow-y-auto">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-ds-sm text-ds-sm">
                    <input
                      type="checkbox"
                      checked={eligibleIds.includes(p.id)}
                      onChange={() =>
                        setEligibleIds((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                    />
                    {p.name}
                  </label>
                ))}
              </div>
              <Input
                label="Anzahl zu wählender Produkte"
                type="number"
                min={1}
                value={bundlePick}
                onChange={(e) => setBundlePick(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <label className="text-ds-sm font-medium text-navy">Rabatt</label>
              <select
                className="w-full min-h-[44px] rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md"
                value={bundleMode}
                onChange={(e) => setBundleMode(e.target.value as 'percent' | 'fixed')}
              >
                <option value="percent">Prozent auf gewählte Artikel</option>
                <option value="fixed">Fixbetrag auf gewählte Artikel</option>
              </select>
              <Input
                label={bundleMode === 'percent' ? 'Prozent' : 'Betrag €'}
                type="number"
                step="0.01"
                value={bundleDisc}
                onChange={(e) => setBundleDisc(parseFloat(e.target.value) || 0)}
              />
            </div>
          ) : null}

          <Input
            label="Mindestbestellwert (€)"
            type="number"
            step="0.01"
            value={form.min_order_value}
            onChange={(e) =>
              setForm((f) => ({ ...f, min_order_value: parseFloat(e.target.value) || 0 }))
            }
          />
          <Input
            label="Max. Nutzungen gesamt (leer = unbegrenzt)"
            type="number"
            value={form.max_uses ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                max_uses: e.target.value === '' ? null : parseInt(e.target.value, 10),
              }))
            }
          />
          <Input
            label="Max. Nutzungen pro Kunde"
            type="number"
            min={1}
            value={form.max_uses_per_user}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                max_uses_per_user: Math.max(1, parseInt(e.target.value, 10) || 1),
              }))
            }
          />
          <label className="flex items-center gap-ds-sm text-ds-sm">
            <input
              type="checkbox"
              checked={form.birthday_auto}
              onChange={(e) => setForm((f) => ({ ...f, birthday_auto: e.target.checked }))}
            />
            Geburtstags-Coupon (nur am Geburtstag gültig, Kunde braucht Geburtstag im Profil)
          </label>
          <label className="block text-ds-sm font-medium text-navy">Zielgruppe</label>
          <select
            className="w-full min-h-[44px] rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md"
            value={form.target}
            onChange={(e) =>
              setForm((f) => ({ ...f, target: e.target.value as CouponInsert['target'] }))
            }
          >
            <option value="all">Alle</option>
            <option value="new_customers">Nur Neukunden</option>
            <option value="specific">Spezifisch (reserviert)</option>
          </select>
          <Input
            label="Gültig ab (optional)"
            type="datetime-local"
            value={form.valid_from?.slice(0, 16) ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                valid_from: e.target.value || null,
              }))
            }
          />
          <Input
            label="Gültig bis (optional)"
            type="datetime-local"
            value={form.valid_until?.slice(0, 16) ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                valid_until: e.target.value || null,
              }))
            }
          />
          <label className="flex items-center gap-ds-sm text-ds-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Aktiv
          </label>
          {saveMut.isError ? (
            <p className="text-ds-sm text-[color:var(--color-error)]">
              {(saveMut.error as Error).message}
            </p>
          ) : null}
        </div>
      </Modal>
    </AdminPage>
  )
}
