import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { validateCouponForOrder } from './_shared/coupon-validate'
import {
  deductBuyerReferralCredit,
  loadOrderForPostPayment,
  rewardReferrerIfFirstPaidOrder,
  runHellocashAfterOrder,
} from './_shared/referral-handlers'
import { createSupabaseAdmin, verifyUserJwt } from './_shared/supabase-admin'

function round2(n: number) {
  return Math.round(n * 100) / 100
}

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
  couponCode?: string | null
  bundleProductIds?: string[] | null
  /** € aus Empfehlungsguthaben; nicht zusammen mit Coupon */
  referralCreditToUse?: number
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

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return json(500, { ok: false, error: 'STRIPE_SECRET_KEY fehlt' })
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
  const priceMap = new Map(
    products.map((p) => [p.id as string, { price: Number(p.price) }]),
  )
  let subtotal = 0
  const normalizedLines: LineInput[] = []
  for (const line of body.lines) {
    const p = productMap.get(line.productId)
    if (!p) return json(400, { ok: false, error: `Produkt ${line.productId}` })
    const qty = Math.min(99, Math.max(1, Math.floor(line.quantity)))
    normalizedLines.push({ productId: line.productId, quantity: qty })
    subtotal += Number(p.price) * qty
  }

  const minOrder = Number(settings.min_order_value)
  if (subtotal < minOrder) {
    return json(400, { ok: false, error: `Mindestbestellwert ${minOrder.toFixed(2)} €` })
  }

  let deliveryFee = 0
  if (orderType === 'delivery') {
    deliveryFee = Number(settings.delivery_fee)
    const freeFrom = Number(settings.free_delivery_from)
    if (subtotal >= freeFrom) deliveryFee = 0
    if (!body.deliveryAddress?.street || !body.deliveryAddress?.city || !body.deliveryAddress?.zip) {
      return json(400, { ok: false, error: 'Lieferadresse unvollständig' })
    }
  }

  const couponTrim = body.couponCode?.trim() ?? ''
  const reqRefRaw = round2(Number(body.referralCreditToUse) || 0)
  const wantsRef = reqRefRaw > 0

  if (couponTrim && wantsRef) {
    return json(400, {
      ok: false,
      error: 'Coupon und Empfehlungsguthaben nicht gleichzeitig möglich',
    })
  }

  const couponRes = await validateCouponForOrder(admin, {
    tenantId: body.tenantId,
    userId: user.id,
    couponCode: wantsRef ? null : body.couponCode,
    bundleProductIds: wantsRef ? null : body.bundleProductIds ?? null,
    lines: normalizedLines,
    productMap: priceMap,
  })
  if (!couponRes.ok) {
    return json(400, { ok: false, error: couponRes.error })
  }

  const discountAmount = couponRes.discount
  const couponId = couponRes.coupon?.id ?? null

  let referralCreditApplied = 0
  if (wantsRef) {
    const { data: balRow, error: balErr } = await admin
      .from('users')
      .select('referral_credits')
      .eq('id', user.id)
      .maybeSingle()
    if (balErr) {
      return json(400, { ok: false, error: balErr.message })
    }
    const balance = round2(Number(balRow?.referral_credits ?? 0))
    const maxRedeem = round2(
      Math.max(0, subtotal - discountAmount + deliveryFee + tipAmount),
    )
    referralCreditApplied = round2(Math.min(balance, reqRefRaw, maxRedeem))
    if (referralCreditApplied <= 0) {
      return json(400, {
        ok: false,
        error: 'Empfehlungsguthaben nicht einsetzbar (Betrag prüfen)',
      })
    }
  }

  const total = Math.max(
    0,
    subtotal - discountAmount - referralCreditApplied + deliveryFee + tipAmount,
  )
  const totalCents = Math.round(total * 100)
  if (totalCents > 0 && totalCents < 50) {
    return json(400, { ok: false, error: 'Betrag zu niedrig (min. 0,50 € für Kartenzahlung)' })
  }

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
      type: orderType,
      status: 'new',
      subtotal,
      discount_amount: discountAmount,
      coupon_id: couponId,
      delivery_fee: deliveryFee,
      tip_amount: tipAmount,
      total,
      referral_credit_used: referralCreditApplied,
      payment_method: 'card',
      payment_status: 'pending',
      delivery_address:
        orderType === 'delivery' && body.deliveryAddress
          ? (body.deliveryAddress as Record<string, string>)
          : null,
    })
    .select('id')
    .single()

  if (orderErr || !orderRow) {
    return json(500, { ok: false, error: orderErr?.message ?? 'Bestellung anlegen fehlgeschlagen' })
  }

  const orderId = orderRow.id as string

  const orderItems = normalizedLines.map((line) => {
    const p = productMap.get(line.productId)!
    const qty = line.quantity
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

  if (totalCents === 0) {
    const zeroMethod =
      referralCreditApplied > 0 && !couponId ? 'referral' : 'coupon'

    await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: zeroMethod,
      })
      .eq('id', orderId)

    const orderFull = await loadOrderForPostPayment(admin, orderId)
    if (orderFull) {
      const d = await deductBuyerReferralCredit(admin, orderFull)
      if (!d.ok) {
        console.error('[checkout] referral deduct', d.error)
      }
      await rewardReferrerIfFirstPaidOrder(admin, orderFull)
    }

    if (couponId) {
      await admin.from('coupon_usages').insert({
        tenant_id: body.tenantId,
        coupon_id: couponId,
        order_id: orderId,
        user_id: user.id,
        discount_amount: discountAmount,
      })
    }

    await admin.from('cart_items').delete().eq('tenant_id', body.tenantId).eq('user_id', user.id)

    await runHellocashAfterOrder(admin, orderId)

    return json(200, { ok: true, orderId, url: null, paidWithoutStripe: true })
  }

  const stripe = new Stripe(stripeKey)
  const siteUrl =
    process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? process.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:8888'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: orderId,
    metadata: {
      order_id: orderId,
      tenant_id: body.tenantId,
      user_id: user.id,
    },
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: totalCents,
          product_data: {
            name: `Bestellung ${orderNumber}`,
            description: orderType === 'delivery' ? 'Lieferung' : 'Abholung',
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl.replace(/\/$/, '')}/confirmation?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl.replace(/\/$/, '')}/checkout`,
  })

  await admin
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', orderId)

  return json(200, { ok: true, url: session.url, orderId })
}
