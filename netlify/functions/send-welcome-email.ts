import type { Handler } from '@netlify/functions'
import { templateWelcome } from './_shared/email-templates'
import { logDispatch } from './_shared/notification-dispatch'
import { sendResendEmail } from './_shared/resend-mail'
import { createSupabaseAdmin, verifyUserJwt } from './_shared/supabase-admin'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...cors },
    body: JSON.stringify(body),
  }
}

function siteUrl(): string {
  return (
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.VITE_PUBLIC_SITE_URL ??
    'http://localhost:5173'
  ).replace(/\/$/, '')
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
  if (!user?.email) {
    return json(401, { ok: false, error: authErr ?? 'Nicht angemeldet' })
  }

  const admin = createSupabaseAdmin()
  const { data: row, error: rErr } = await admin
    .from('users')
    .select('welcome_email_sent_at, tenant_id, email')
    .eq('id', user.id)
    .maybeSingle()

  if (rErr || !row?.tenant_id) {
    return json(400, { ok: false, error: 'Profil unvollständig (tenant_id)' })
  }

  if (row.welcome_email_sent_at) {
    return json(200, { ok: true, skipped: true })
  }

  const tenantId = row.tenant_id as string
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

  const html = templateWelcome({
    brandName,
    accentColor: accent,
    siteUrl: `${siteUrl()}/menu`,
  })

  const r = await sendResendEmail({
    to: user.email,
    subject: `Willkommen bei ${brandName}`,
    html,
  })

  if (!r.ok && !r.skipped) {
    return json(500, { ok: false, error: r.error ?? 'Versand fehlgeschlagen' })
  }

  await admin
    .from('users')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', user.id)

  await logDispatch(admin, tenantId, null, 'welcome_email', 'email', user.id)

  return json(200, { ok: true })
}
