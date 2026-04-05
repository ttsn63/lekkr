import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useMemo, useState } from 'react'
import { AdminPage } from '@/components/admin/AdminPage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTenant } from '@/hooks/useTenant'
import {
  bulkDeleteProducts,
  bulkSetProductActive,
  bulkInsertProductsCsv,
  fetchAdminProducts,
  insertProduct,
  updateProduct,
  type ProductInsert,
} from '@/lib/queries/adminProducts'
import { fetchAdminCategories } from '@/lib/queries/adminCategories'
import type { ProductRow } from '@/types/catalog'

export function AdminProductsPage() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', tenant.id],
    queryFn: () => fetchAdminProducts(tenant.id),
  })
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories', tenant.id],
    queryFn: () => fetchAdminCategories(tenant.id),
  })

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)

  const [form, setForm] = useState<ProductInsert & { id?: string }>({
    name: '',
    price: 0,
    category_id: null,
    description: '',
    main_image_url: '',
    active: true,
    is_featured: false,
  })

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-products', tenant.id] })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        await updateProduct(tenant.id, editing.id, {
          name: form.name,
          price: form.price,
          category_id: form.category_id ?? null,
          description: form.description || null,
          main_image_url: form.main_image_url || null,
          active: form.active,
          is_featured: form.is_featured,
        })
      } else {
        await insertProduct(tenant.id, form)
      }
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
    },
  })

  const bulkActive = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      bulkSetProductActive(tenant.id, ids, active),
    onSuccess: () => {
      invalidate()
      setSelected(new Set())
    },
  })

  const bulkDel = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteProducts(tenant.id, ids),
    onSuccess: () => {
      invalidate()
      setSelected(new Set())
    },
  })

  const csvMut = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
      const rows: Array<{ name: string; price: number; category_id?: string | null; active?: boolean }> = []
      for (const row of parsed.data) {
        const name = (row.name ?? row.Name ?? '').trim()
        const priceRaw = row.price ?? row.Price ?? '0'
        const price = Number(String(priceRaw).replace(',', '.'))
        if (!name || Number.isNaN(price)) continue
        const category_id = row.category_id?.trim() || row.category?.trim() || null
        const activeRaw = (row.active ?? row.Active ?? 'true').toLowerCase()
        const active = activeRaw === '1' || activeRaw === 'true' || activeRaw === 'ja'
        rows.push({ name, price, category_id: category_id || null, active })
      }
      await bulkInsertProductsCsv(tenant.id, rows)
    },
    onSuccess: invalidate,
  })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectAll = () => {
    if (selected.size === products.length) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      price: 0,
      category_id: null,
      description: '',
      main_image_url: '',
      active: true,
      is_featured: false,
    })
    setModalOpen(true)
  }

  const openEdit = (p: ProductRow) => {
    setEditing(p)
    setForm({
      name: p.name,
      price: Number(p.price),
      category_id: p.category_id,
      description: p.description ?? '',
      main_image_url: p.main_image_url ?? '',
      active: p.active,
      is_featured: p.is_featured,
    })
    setModalOpen(true)
  }

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  return (
    <AdminPage title="Produkte">
      <div className="mb-ds-lg flex flex-wrap items-center gap-ds-sm">
        <Button type="button" onClick={openCreate}>
          Neues Produkt
        </Button>
        <label className="cursor-pointer rounded-sm border border-brand-cream-darker bg-bg-secondary px-ds-md py-ds-sm text-ds-sm">
          CSV importieren
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void csvMut.mutateAsync(f)
              e.target.value = ''
            }}
          />
        </label>
        <span className="text-ds-xs text-text-secondary">
          CSV-Spalten: <code className="rounded bg-brand-cream-dark px-1">name</code>,{' '}
          <code className="rounded bg-brand-cream-dark px-1">price</code>, optional{' '}
          <code className="rounded bg-brand-cream-dark px-1">category_id</code>,{' '}
          <code className="rounded bg-brand-cream-dark px-1">active</code>
        </span>
      </div>

      <div className="mb-ds-md flex flex-wrap gap-ds-sm">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={selected.size === 0}
          onClick={() => bulkActive.mutate({ ids: [...selected], active: true })}
        >
          Aktivieren
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={selected.size === 0}
          onClick={() => bulkActive.mutate({ ids: [...selected], active: false })}
        >
          Deaktivieren
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={selected.size === 0}
          onClick={() => {
            if (confirm(`${selected.size} Produkte wirklich löschen?`)) bulkDel.mutate([...selected])
          }}
        >
          Löschen
        </Button>
      </div>

      {isLoading ? (
        <p className="text-text-secondary">Lade…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-cream-darker">
          <table className="w-full min-w-[640px] text-left text-ds-sm">
            <thead className="border-b border-brand-cream-dark bg-brand-cream-dark/40">
              <tr>
                <th className="p-ds-sm">
                  <input type="checkbox" checked={products.length > 0 && selected.size === products.length} onChange={selectAll} />
                </th>
                <th className="p-ds-sm">Name</th>
                <th className="p-ds-sm">Kategorie</th>
                <th className="p-ds-sm">Preis</th>
                <th className="p-ds-sm">Aktiv</th>
                <th className="p-ds-sm" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-brand-cream-dark">
                  <td className="p-ds-sm">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="p-ds-sm font-medium text-navy">{p.name}</td>
                  <td className="p-ds-sm text-text-secondary">
                    {p.category_id ? (catMap.get(p.category_id) ?? p.category_id.slice(0, 8)) : '—'}
                  </td>
                  <td className="p-ds-sm">{Number(p.price).toFixed(2)} €</td>
                  <td className="p-ds-sm">{p.active ? 'Ja' : 'Nein'}</td>
                  <td className="p-ds-sm">
                    <button type="button" className="text-navy underline" onClick={() => openEdit(p)}>
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Produkt bearbeiten' : 'Neues Produkt'}
        primaryAction={{
          label: 'Speichern',
          onClick: () => saveMut.mutate(),
          disabled: saveMut.isPending || !form.name.trim(),
        }}
      >
        <div className="space-y-ds-md">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Preis (EUR)"
            type="number"
            step="0.01"
            value={String(form.price)}
            onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
          />
          <div>
            <label className="mb-ds-xs block text-ds-sm font-medium">Kategorie</label>
            <select
              className="w-full rounded-sm border border-border bg-bg-secondary px-ds-md py-ds-sm"
              value={form.category_id ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value || null }))
              }
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Bild-URL"
            value={form.main_image_url ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, main_image_url: e.target.value }))}
          />
          <div>
            <label className="mb-ds-xs block text-ds-sm font-medium">Beschreibung</label>
            <textarea
              className="w-full rounded-sm border border-border bg-bg-secondary px-ds-md py-ds-sm"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-ds-sm">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span className="text-ds-sm">Aktiv</span>
          </label>
          <label className="flex items-center gap-ds-sm">
            <input
              type="checkbox"
              checked={form.is_featured ?? false}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            />
            <span className="text-ds-sm">Bestseller / Featured</span>
          </label>
        </div>
      </Modal>
    </AdminPage>
  )
}
