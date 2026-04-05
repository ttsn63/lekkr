import type { SupabaseClient } from '@supabase/supabase-js'
import { templateOrderConfirmation } from './email-templates'
import { alreadyDispatched, logDispatch } from './notification-dispatch'
import { sendResendEmail } from './resend-mail'

function publicSiteUrl(): string {
  return (
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.VITE_PUBLIC_SITE_URL ??
    'http://localhost:5173'
  ).replace(/\/$/, '')
}

export async function sendOrderConfirmationEmail(admin: SupabaseClient, orderId: string): Promise<void> {
  const { data: order, error: oErr } = await admin
    .from('orders')
    .select(
      'id, tenant_id, user_id, order_number, total, type, subtotal, delivery_fee, tip_amount',
    )
    .eq('id', orderId)
    .maybeSingle()

  if (oErr || !order?.tenant_id) {
    console.error('[order-email] order load', oErr?.message)
    return
  }

  const tenantId = order.tenant_id as string
  if (await alreadyDispatched(admin, tenantId, orderId, 'order_confirmation_email')) {
    return
  }

  if (!order.user_id) {
    console.warn('[order-email] no user_id, skip email')
    return
  }

  const { data: urow } = await admin
    .from('users')
    .select('email')
    .eq('id', order.user_id)
    .maybeSingle()

  const email = (urow?.email as string)?.trim()
  if (!email) return

  const { data: tenant } = await admin.from('tenants').select('name').eq('id', tenantId).maybeSingle()
  const { data: ts } = await admin
    .from('tenant_settings')
    .select('accent_color, company_display_name')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  const brandName =
    (ts?.company_display_name as string)?.trim() ||
    (tenant?.name as string) ||
    'Lekkr'
  const accent = (ts?.accent_color as string) || '#62E6BE'

  const { data: items } = await admin
    .from('order_items')
    .select('quantity, unit_price, total_price, product_id')
    .eq('order_id', orderId)
    .eq('tenant_id', tenantId)

  const pids = [...new Set((items ?? []).map((i) => i.product_id).filter(Boolean))] as string[]
  const { data: prows } =
    pids.length > 0
      ? await admin.from('products').select('id, name').eq('tenant_id', tenantId).in('id', pids)
      : { data: [] as { id: string; name: string }[] }
  const pmap = new Map((prows ?? []).map((p) => [p.id, p.name]))

  const linesHtml = (items ?? [])
    .map((it) => {
      const pid = it.product_id as string | null
      const name = pid ? pmap.get(pid) ?? 'Produkt' : 'Position'
      const q = Number(it.quantity)
      const total = Number(it.total_price)
      return `<div style="margin:6px 0;">${q}× ${escapeHtml(String(name))} – <strong>${total.toFixed(2)} €</strong></div>`
    })
    .join('')

  const typeLabel = order.type === 'delivery' ? 'Lieferung' : 'Abholung'
  const total = Number(order.total)

  const html = templateOrderConfirmation({
    brandName,
    accentColor: accent,
    orderNumber: String(order.order_number),
    totalFormatted: `${total.toFixed(2)} €`,
    orderTypeLabel: typeLabel,
    linesHtml: linesHtml || '<p>—</p>',
    siteUrl: publicSiteUrl(),
  })

  const r = await sendResendEmail({
    to: email,
    subject: `Bestellbestätigung ${order.order_number} – ${brandName}`,
    html,
  })

  if (!r.ok && !r.skipped) {
    console.error('[order-email] resend', r.error)
    return
  }

  await logDispatch(admin, tenantId, orderId, 'order_confirmation_email', 'email')
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
