import type { Handler } from '@netlify/functions'
import { createSupabaseAdmin, verifyUserJwt } from './_shared/supabase-admin'
import { alreadyDispatched, logDispatch } from './_shared/notification-dispatch'
import { sendTwilioSms } from './_shared/twilio-sms'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Body = {
  tenantId: string
  orderId: string
  event: 'pickup_ready' | 'driver_en_route'
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

  if (!body.tenantId || !body.orderId || !body.event) {
    return json(400, { ok: false, error: 'tenantId, orderId, event erforderlich' })
  }

  const admin = createSupabaseAdmin()

  const { data: staff, error: sErr } = await admin
    .from('users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (sErr || !staff) {
    return json(403, { ok: false, error: 'Profil nicht gefunden' })
  }

  const stTenant = staff.tenant_id as string | null
  if (!stTenant || stTenant !== body.tenantId) {
    return json(403, { ok: false, error: 'Kein Zugriff auf diesen Mandanten (tenant_id in public.users prüfen)' })
  }

  const role = String(staff.role ?? '')
  const kind = body.event === 'pickup_ready' ? 'sms_pickup_ready' : 'sms_driver_en_route'

  if (body.event === 'pickup_ready') {
    if (!['kitchen', 'admin'].includes(role)) {
      return json(403, { ok: false, error: 'Nur Küche/Admin' })
    }
  } else {
    if (!['driver', 'admin'].includes(role)) {
      return json(403, { ok: false, error: 'Nur Fahrer/Admin' })
    }
  }

  if (await alreadyDispatched(admin, body.tenantId, body.orderId, kind)) {
    return json(200, { ok: true, skipped: true, reason: 'already_sent' })
  }

  const { data: order, error: oErr } = await admin
    .from('orders')
    .select('id, tenant_id, user_id, order_number, type, status, driver_id')
    .eq('id', body.orderId)
    .eq('tenant_id', body.tenantId)
    .maybeSingle()

  if (oErr || !order?.user_id) {
    return json(400, { ok: false, error: 'Bestellung nicht gefunden' })
  }

  if (body.event === 'pickup_ready') {
    if (order.type !== 'pickup' || order.status !== 'ready') {
      return json(400, { ok: false, error: 'Nur Abholung im Status „fertig“' })
    }
  } else {
    if (order.type !== 'delivery' || order.status !== 'delivering') {
      return json(400, { ok: false, error: 'Nur Lieferung unterwegs' })
    }
    if (role === 'driver' && order.driver_id !== user.id) {
      return json(403, { ok: false, error: 'Nicht deine Lieferung' })
    }
  }

  const { data: customer } = await admin
    .from('users')
    .select('phone')
    .eq('id', order.user_id)
    .maybeSingle()

  const phone = (customer?.phone as string)?.trim()
  if (!phone) {
    return json(400, { ok: false, error: 'Kunde hat keine Telefonnummer (Profil)' })
  }

  const { data: tenant } = await admin.from('tenants').select('name').eq('id', body.tenantId).maybeSingle()
  const name = (tenant?.name as string) ?? 'Lekkr'
  const num = String(order.order_number)

  const msg =
    body.event === 'pickup_ready'
      ? `${name}: Deine Bestellung ${num} ist abholbereit.`
      : `${name}: Deine Lieferung ${num} ist unterwegs.`

  const sms = await sendTwilioSms(phone, msg)
  if (!sms.ok && !sms.skipped) {
    return json(500, { ok: false, error: sms.error ?? 'SMS fehlgeschlagen' })
  }

  await logDispatch(admin, body.tenantId, body.orderId, kind, 'sms')

  return json(200, { ok: true })
}
