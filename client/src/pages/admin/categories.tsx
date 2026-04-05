import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminPage } from '@/components/admin/AdminPage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTenant } from '@/hooks/useTenant'
import {
  deleteCategory,
  fetchAdminCategories,
  insertCategory,
  updateCategory,
} from '@/lib/queries/adminCategories'
import type { CategoryRow } from '@/types/catalog'

export function AdminCategoriesPage() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories', tenant.id],
    queryFn: () => fetchAdminCategories(tenant.id),
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [form, setForm] = useState({
    name: '',
    name_tr: '',
    name_en: '',
    sort_order: 0,
    active: true,
  })

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-categories', tenant.id] })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        await updateCategory(tenant.id, editing.id, {
          name: form.name,
          name_tr: form.name_tr || null,
          name_en: form.name_en || null,
          sort_order: form.sort_order,
          active: form.active,
        })
      } else {
        await insertCategory(tenant.id, {
          name: form.name,
          name_tr: form.name_tr || null,
          name_en: form.name_en || null,
          sort_order: form.sort_order,
          active: form.active,
        })
      }
    },
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
    },
  })

  const delMut = useMutation({
    mutationFn: (id: string) => deleteCategory(tenant.id, id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', name_tr: '', name_en: '', sort_order: 0, active: true })
    setModalOpen(true)
  }

  const openEdit = (c: CategoryRow) => {
    setEditing(c)
    setForm({
      name: c.name,
      name_tr: c.name_tr ?? '',
      name_en: c.name_en ?? '',
      sort_order: c.sort_order,
      active: c.active,
    })
    setModalOpen(true)
  }

  return (
    <AdminPage title="Kategorien">
      <div className="mb-ds-lg">
        <Button type="button" onClick={openCreate}>
          Neue Kategorie
        </Button>
      </div>

      {isLoading ? (
        <p className="text-text-secondary">Lade…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-brand-cream-darker">
          <table className="w-full text-left text-ds-sm">
            <thead className="border-b border-brand-cream-dark bg-brand-cream-dark/40">
              <tr>
                <th className="p-ds-sm">Name</th>
                <th className="p-ds-sm">TR</th>
                <th className="p-ds-sm">EN</th>
                <th className="p-ds-sm">Sortierung</th>
                <th className="p-ds-sm">Aktiv</th>
                <th className="p-ds-sm" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-brand-cream-dark">
                  <td className="p-ds-sm font-medium text-navy">{c.name}</td>
                  <td className="p-ds-sm text-text-secondary">{c.name_tr ?? '—'}</td>
                  <td className="p-ds-sm text-text-secondary">{c.name_en ?? '—'}</td>
                  <td className="p-ds-sm">{c.sort_order}</td>
                  <td className="p-ds-sm">{c.active ? 'Ja' : 'Nein'}</td>
                  <td className="space-x-ds-sm p-ds-sm">
                    <button type="button" className="text-navy underline" onClick={() => openEdit(c)}>
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="text-[color:var(--color-error)] underline"
                      onClick={() => {
                        if (confirm('Kategorie löschen?')) delMut.mutate(c.id)
                      }}
                    >
                      Löschen
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
        title={editing ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
        primaryAction={{
          label: 'Speichern',
          onClick: () => saveMut.mutate(),
          disabled: saveMut.isPending || !form.name.trim(),
        }}
      >
        <div className="space-y-ds-md">
          <Input label="Name (DE)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Name (TR)" value={form.name_tr} onChange={(e) => setForm((f) => ({ ...f, name_tr: e.target.value }))} />
          <Input label="Name (EN)" value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
          <Input
            label="Sortierung"
            type="number"
            value={String(form.sort_order)}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          />
          <label className="flex items-center gap-ds-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span className="text-ds-sm">Aktiv</span>
          </label>
        </div>
      </Modal>
    </AdminPage>
  )
}
