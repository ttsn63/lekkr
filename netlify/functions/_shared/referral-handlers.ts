import type { SupabaseClient } from '@supabase/supabase-js'
import { hellocashCreateInvoice, hellocashSyncStock } from './hellocash-client'

type OrderRow = {
  id: string
  tenant_id: string
  user_id: string | null
  order_number: string
  subtotal: number
  discount_amount: number
  referral_credit_used: number
  total: number
  payment_method: string | null
}

export async function loadOrderForPostPayment(
  admin: SupabaseClient,
  orderId: string,
): Promise<OrderRow | null> {
  const { data, error } = await admin
    .from('orders')
    .select(
      'id, tenant_id, user_id, order_number, subtotal, discount_amount, referral_credit_used, total, payment_method',
    )
    .eq('id', orderId)
    .maybeSingle()
  if (error || !data) return null
  return data as OrderRow
}

/**
 * Nach erfolgreicher Zahlung: Empfehlungsguthaben des Käufers abbuchen + Ledger.
 */
export async function deductBuyerReferralCredit(
  admin: SupabaseClient,
  order: OrderRow,
): Promise<{ ok: boolean; error?: string }> {
  const amount = Number(order.referral_credit_used ?? 0)
  if (amount <= 0 || !order.user_id) return { ok: true }

  const { data: userRow, error: uErr } = await admin
    .from('users')
    .select('referral_credits')
    .eq('id', order.user_id)
    .maybeSingle()

  if (uErr || !userRow) {
    return { ok: false, error: uErr?.message ?? 'User nicht gefunden' }
  }

  const balance = Number(userRow.referral_credits ?? 0)
  if (balance + 1e-9 < amount) {
    return { ok: false, error: 'Referral-Guthaben reicht nicht' }
  }

  const newBal = Math.round((balance - amount) * 100) / 100
  const { error: upErr } = await admin
    .from('users')
    .update({ referral_credits: newBal })
    .eq('id', order.user_id)

  if (upErr) return { ok: false, error: upErr.message }

  const { error: ledErr } = await admin.from('referral_credits').insert({
    tenant_id: order.tenant_id,
    user_id: order.user_id,
    amount,
    entry_type: 'redeem',
    order_id: order.id,
    referral_id: null,
  })

  if (ledErr) return { ok: false, error: ledErr.message }
  return { ok: true }
}

/**
 * Erste bezahlte Bestellung (Stripe): Referrer belohnen.
 */
export async function rewardReferrerIfFirstPaidOrder(
  admin: SupabaseClient,
  order: OrderRow,
): Promise<void> {
  if (!order.user_id) return

  const { count: otherPaid, error: cErr } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', order.user_id)
    .eq('payment_status', 'paid')
    .neq('id', order.id)

  if (cErr || (otherPaid ?? 0) > 0) return

  const { data: buyer, error: bErr } = await admin
    .from('users')
    .select('referred_by_user_id, tenant_id')
    .eq('id', order.user_id)
    .maybeSingle()

  if (bErr || !buyer?.referred_by_user_id) return

  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referred_id', order.user_id)
    .eq('status', 'credited')
    .maybeSingle()

  if (existing) return

  const { data: ts } = await admin
    .from('tenant_settings')
    .select('referral_reward_amount')
    .eq('tenant_id', order.tenant_id)
    .maybeSingle()

  const reward = Math.max(0, Number(ts?.referral_reward_amount ?? 2))

  const { data: refRow, error: insErr } = await admin
    .from('referrals')
    .insert({
      tenant_id: order.tenant_id,
      referrer_id: buyer.referred_by_user_id as string,
      referred_id: order.user_id,
      order_id: order.id,
      credit_amount: reward,
      status: 'credited',
    })
    .select('id')
    .single()

  if (insErr || !refRow) return

  const { data: refUser } = await admin
    .from('users')
    .select('referral_credits')
    .eq('id', buyer.referred_by_user_id as string)
    .maybeSingle()

  const prev = Number(refUser?.referral_credits ?? 0)
  const next = Math.round((prev + reward) * 100) / 100

  await admin
    .from('users')
    .update({ referral_credits: next })
    .eq('id', buyer.referred_by_user_id as string)

  await admin.from('referral_credits').insert({
    tenant_id: order.tenant_id,
    user_id: buyer.referred_by_user_id as string,
    amount: reward,
    entry_type: 'earn',
    referral_id: refRow.id as string,
    order_id: order.id,
  })
}

/**
 * Erste Bestellung eines Nutzers (Bar / Abholung): Referrer belohnen.
 */
export async function rewardReferrerIfFirstOrderInTenant(
  admin: SupabaseClient,
  order: OrderRow,
): Promise<void> {
  if (!order.user_id) return

  const { count: totalOrders, error: cErr } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', order.user_id)
    .eq('tenant_id', order.tenant_id)

  if (cErr || (totalOrders ?? 0) !== 1) return

  const { data: buyer, error: bErr } = await admin
    .from('users')
    .select('referred_by_user_id')
    .eq('id', order.user_id)
    .maybeSingle()

  if (bErr || !buyer?.referred_by_user_id) return

  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referred_id', order.user_id)
    .eq('status', 'credited')
    .maybeSingle()

  if (existing) return

  const { data: ts } = await admin
    .from('tenant_settings')
    .select('referral_reward_amount')
    .eq('tenant_id', order.tenant_id)
    .maybeSingle()

  const reward = Math.max(0, Number(ts?.referral_reward_amount ?? 2))

  const { data: refRow, error: insErr } = await admin
    .from('referrals')
    .insert({
      tenant_id: order.tenant_id,
      referrer_id: buyer.referred_by_user_id as string,
      referred_id: order.user_id,
      order_id: order.id,
      credit_amount: reward,
      status: 'credited',
    })
    .select('id')
    .single()

  if (insErr || !refRow) return

  const { data: refUser } = await admin
    .from('users')
    .select('referral_credits')
    .eq('id', buyer.referred_by_user_id as string)
    .maybeSingle()

  const prev = Number(refUser?.referral_credits ?? 0)
  const next = Math.round((prev + reward) * 100) / 100

  await admin
    .from('users')
    .update({ referral_credits: next })
    .eq('id', buyer.referred_by_user_id as string)

  await admin.from('referral_credits').insert({
    tenant_id: order.tenant_id,
    user_id: buyer.referred_by_user_id as string,
    amount: reward,
    entry_type: 'earn',
    referral_id: refRow.id as string,
    order_id: order.id,
  })
}

export async function runHellocashAfterOrder(
  admin: SupabaseClient,
  orderId: string,
): Promise<void> {
  const order = await loadOrderForPostPayment(admin, orderId)
  if (!order) return

  const { data: items } = await admin
    .from('order_items')
    .select('quantity, unit_price, total_price, product_id')
    .eq('order_id', orderId)
    .eq('tenant_id', order.tenant_id)

  const { data: products } = await admin
    .from('products')
    .select('id, name, hellocash_article_id')
    .eq('tenant_id', order.tenant_id)

  const productMap = new Map((products ?? []).map((p) => [p.id as string, p]))

  const lines = (items ?? []).map((it) => {
    const pid = it.product_id as string | null
    const p = pid ? productMap.get(pid) : undefined
    return {
      name: (p?.name as string) ?? 'Position',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      total: Number(it.total_price),
      articleId: (p?.hellocash_article_id as string | null) ?? null,
    }
  })

  let customerEmail: string | undefined
  if (order.user_id) {
    const { data: u } = await admin.from('users').select('email').eq('id', order.user_id).maybeSingle()
    customerEmail = u?.email as string | undefined
  }

  const inv = await hellocashCreateInvoice({
    orderNumber: order.order_number,
    tenantId: order.tenant_id,
    orderId: order.id,
    total: Number(order.total),
    lines,
    customerEmail,
  })
  if (!inv.ok && !inv.skipped) {
    console.error('[helloCash] Rechnung:', inv.error)
  }

  const stockLines = (items ?? [])
    .map((it) => {
      const pid = it.product_id as string | null
      if (!pid) return null
      const p = productMap.get(pid)
      const aid = p?.hellocash_article_id as string | null
      if (!aid) return null
      return { articleId: aid, delta: -Number(it.quantity) }
    })
    .filter((x): x is { articleId: string; delta: number } => x != null)

  if (stockLines.length > 0) {
    const st = await hellocashSyncStock(order.tenant_id, stockLines)
    if (!st.ok && !st.skipped) {
      console.error('[helloCash] Bestand:', st.error)
    }
  }
}
