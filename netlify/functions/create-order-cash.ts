import type { Handler } from '@netlify/functions'
import { createSupabaseAdmin, verifyUserJwt } from './_shared/supabase-admin'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type LineInput = { productId: string; quantity: number }

type Body = {
  tenantId: string
  lines: LineInput[]
  orderType: 'delivery' | 'pickup'
  tipAmount: number
  deliveryAddress?: { street: string; city: string; zip: string; name?: string }
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...cors },
    body: JSON.stringify(body),
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors }
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  const jwt = event.headers.authorization?.replace(/^Bearer\s+/i, '')
  const { user, error: authErr } = await verifyUserJwt(jwt)
  if (!user) {
    return json(401, { ok: false, error: authErr ?? 'Nicht angemeldet' })
  }

  let body: Body
  try {
    body = JSON.parse(event.body ?? '{}') as Body
  } catch {
    return json(400, { ok: false, error: 'Ungültiges JSON' })
  }

  if (!body.tenantId || !Array.isArray(body.lines) || body.lines.length === 0) {
    return json(400, { ok: false, error: 'tenantId und lines erforderlich' })
  }

  const orderType = body.orderType === 'delivery' ? 'delivery' : 'pickup'
  if (orderType !== 'pickup') {
    return json(400, { ok: false, error: 'Barzahlung nur bei Abholung' })
  }

  const tipAmount = Math.max(0, Number(body.tipAmount) || 0)
  const admin = createSupabaseAdmin()

  const { data: settings, error: setErr } = await admin
    .from('tenant_settings')
    .select('min_order_value, delivery_fee, free_delivery_from')
    .eq('tenant_id', body.tenantId)
    .maybeSingle()

  if (setErr || !settings) {
    return json(400, { ok: false, error: 'Tenant-Einstellungen nicht gefunden' })
  }

  const productIds = body.lines.map((l) => l.productId)
  const { data: products, error: pErr } = await admin
    .from('products')
    .select('id, name, price, tenant_id')
    .eq('tenant_id', body.tenantId)
    .in('id', productIds)
    .eq('active', true)

  if (pErr || !products?.length) {
    return json(400, { ok: false, error: 'Produkte ungültig' })
  }

  const productMap = new Map(products.map((p) => [p.id as string, p]))
  let subtotal = 0
  for (const line of body.lines) {
    const p = productMap.get(line.productId)
    if (!p) return json(400, { ok: false, error: `Produkt ${line.productId}` })
    const qty = Math.min(99, Math.max(1, Math.floor(line.quantity)))
    subtotal += Number(p.price) * qty
  }

  const minOrder = Number(settings.min_order_value)
  if (subtotal < minOrder) {
    return json(400, { ok: false, error: `Mindestbestellwert ${minOrder.toFixed(2)} €` })
  }

  const deliveryFee = 0
  const total = subtotal + deliveryFee + tipAmount

  await admin.from('users').upsert(
    {
      id: user.id,
      tenant_id: body.tenantId,
      email: user.email ?? '',
    },
    { onConflict: 'id' },
  )

  const orderNumber = `LKR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const { data: orderRow, error: orderErr } = await admin
    .from('orders')
    .insert({
      tenant_id: body.tenantId,
      user_id: user.id,
      order_number: orderNumber,
      type: 'pickup',
      status: 'new',
      subtotal,
      discount_amount: 0,
      delivery_fee: 0,
      tip_amount: tipAmount,
      total,
      payment_method: 'cash',
      payment_status: 'pending',
      delivery_address: null,
    })
    .select('id')
    .single()

  if (orderErr || !orderRow) {
    return json(500, { ok: false, error: orderErr?.message ?? 'Bestellung anlegen fehlgeschlagen' })
  }

  const orderId = orderRow.id as string

  const orderItems = body.lines.map((line) => {
    const p = productMap.get(line.productId)!
    const qty = Math.min(99, Math.max(1, Math.floor(line.quantity)))
    const unit = Number(p.price)
    return {
      tenant_id: body.tenantId,
      order_id: orderId,
      product_id: line.productId,
      quantity: qty,
      unit_price: unit,
      total_price: unit * qty,
    }
  })

  const { error: oiErr } = await admin.from('order_items').insert(orderItems)
  if (oiErr) {
    await admin.from('orders').delete().eq('id', orderId)
    return json(500, { ok: false, error: oiErr.message })
  }

  await admin.from('cart_items').delete().eq('tenant_id', body.tenantId).eq('user_id', user.id)

  return json(200, { ok: true, orderId })
}
