import { supabase } from '@/lib/supabase'
import type { ProductRow } from '@/types/catalog'

export async function fetchAdminProducts(tenantId: string): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProductRow[]
}

export type ProductInsert = {
  name: string
  price: number
  category_id?: string | null
  name_tr?: string | null
  name_en?: string | null
  description?: string | null
  main_image_url?: string | null
  active?: boolean
  is_featured?: boolean
  sort_order?: number
}

export async function insertProduct(tenantId: string, values: ProductInsert) {
  const { error } = await supabase.from('products').insert({
    tenant_id: tenantId,
    name: values.name,
    price: values.price,
    category_id: values.category_id ?? null,
    name_tr: values.name_tr ?? null,
    name_en: values.name_en ?? null,
    description: values.description ?? null,
    main_image_url: values.main_image_url ?? null,
    active: values.active ?? true,
    is_featured: values.is_featured ?? false,
    sort_order: values.sort_order ?? 0,
  })

  if (error) throw error
}

export async function bulkInsertProductsCsv(
  tenantId: string,
  rows: Array<{ name: string; price: number; category_id?: string | null; active?: boolean }>,
) {
  if (rows.length === 0) return
  const payload = rows.map((r) => ({
    tenant_id: tenantId,
    name: r.name,
    price: r.price,
    category_id: r.category_id ?? null,
    active: r.active ?? true,
    is_featured: false,
    sort_order: 0,
  }))
  const { error } = await supabase.from('products').insert(payload)
  if (error) throw error
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  patch: Partial<ProductRow>,
) {
  const { error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) throw error
}

export async function deleteProduct(tenantId: string, productId: string) {
  const { error } = await supabase.from('products').delete().eq('id', productId).eq('tenant_id', tenantId)

  if (error) throw error
}

export async function bulkSetProductActive(tenantId: string, ids: string[], active: boolean) {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('products')
    .update({ active })
    .eq('tenant_id', tenantId)
    .in('id', ids)

  if (error) throw error
}

export async function bulkDeleteProducts(tenantId: string, ids: string[]) {
  if (ids.length === 0) return
  const { error } = await supabase.from('products').delete().eq('tenant_id', tenantId).in('id', ids)

  if (error) throw error
}
