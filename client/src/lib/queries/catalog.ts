import { supabase } from '@/lib/supabase'
import type { CategoryRow, ProductRow } from '@/types/catalog'

/**
 * Alle Katalog-Funktionen filtern strikt nach tenant_id (Multitenant-Regel).
 */

export async function fetchCategories(tenantId: string): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as CategoryRow[]
}

export async function fetchProducts(tenantId: string): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProductRow[]
}

export async function fetchProductById(
  tenantId: string,
  productId: string,
): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()

  if (error) throw error
  return (data as ProductRow | null) ?? null
}
