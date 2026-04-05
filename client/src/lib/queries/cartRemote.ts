import { supabase } from '@/lib/supabase'
import type { CartLine } from '@/store/cartStore'

/** Alle Operationen mit tenant_id gefiltert. */
export async function fetchRemoteCart(tenantId: string, userId: string): Promise<CartLine[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)

  if (error) throw error
  return (data ?? []).map((r) => ({
    productId: r.product_id as string,
    quantity: r.quantity as number,
  }))
}

export async function replaceRemoteCart(
  tenantId: string,
  userId: string,
  lines: CartLine[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from('cart_items')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)

  if (delErr) throw delErr
  if (lines.length === 0) return

  const rows = lines.map((l) => ({
    tenant_id: tenantId,
    user_id: userId,
    product_id: l.productId,
    quantity: l.quantity,
  }))

  const { error: insErr } = await supabase.from('cart_items').insert(rows)
  if (insErr) throw insErr
}
