import type { ReactNode } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RequireAdmin } from '@/components/admin/RequireAdmin'

export function AdminPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminLayout title={title}>{children}</AdminLayout>
    </RequireAdmin>
  )
}
