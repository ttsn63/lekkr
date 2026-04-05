import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/catalog'

export async function fetchAdminCategories(tenantId: string): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as CategoryRow[]
}

export async function insertCategory(
  tenantId: string,
  row: { name: string; name_tr?: string | null; name_en?: string | null; sort_order?: number; active?: boolean },
) {
  const { error } = await supabase.from('categories').insert({ ...row, tenant_id: tenantId })
  if (error) throw error
}

export async function updateCategory(
  tenantId: string,
  id: string,
  patch: Partial<CategoryRow>,
) {
  const { error } = await supabase.from('categories').update(patch).eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}

export async function deleteCategory(tenantId: string, id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) throw error
}
