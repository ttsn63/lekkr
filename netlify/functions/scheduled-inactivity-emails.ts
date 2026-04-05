import type { Handler } from '@netlify/functions'
import { templateInactivity } from './_shared/email-templates'
import { logDispatch } from './_shared/notification-dispatch'
import { sendResendEmail } from './_shared/resend-mail'
import { createSupabaseAdmin } from './_shared/supabase-admin'

function siteUrl(): string {
  return (
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.VITE_PUBLIC_SITE_URL ??
    'http://localhost:5173'
  ).replace(/\/$/, '')
}

const INACTIVE_DAYS = 45

/**
 * Netlify Scheduled Function – wöchentlich Nutzer ohne Bestellung seit X Tagen.
 */
export const handler: Handler = async () => {
  const admin = createSupabaseAdmin()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS)

  const { data: users, error } = await admin
    .from('users')
    .select('id, email, tenant_id, name, marketing_consent')
    .eq('role', 'customer')
    .not('tenant_id', 'is', null)
    .not('email', 'is', null)

  if (error) {
    console.error('[scheduled-inactivity]', error.message)
    return { statusCode: 500, body: 'error' }
  }

  for (const u of users ?? []) {
    if (!u.marketing_consent) continue
    const tenantId = u.tenant_id as string
    const uid = u.id as string

    const { data: lastOrder } = await admin
      .from('orders')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastOrder?.created_at) {
      const last = new Date(lastOrder.created_at as string)
      if (last > cutoff) continue
    } else {
      const created = await admin.from('users').select('created_at').eq('id', uid).maybeSingle()
      const joined = new Date((created.data?.created_at as string) ?? 0)
      if (joined > cutoff) continue
    }

    const { count } = await admin
      .from('notification_dispatch_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('kind', 'inactivity_email')
      .gte('created_at', new Date(Date.now() - 60 * 86400_000).toISOString())

    if ((count ?? 0) > 0) continue

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

    const html = templateInactivity({
      brandName,
      accentColor: accent,
      siteUrl: `${siteUrl()}/menu`,
      firstName: (u.name as string) ?? null,
    })

    const r = await sendResendEmail({
      to: u.email as string,
      subject: `Wir freuen uns auf dich – ${brandName}`,
      html,
    })

    if (r.ok || r.skipped) {
      await logDispatch(admin, tenantId, null, 'inactivity_email', 'email', uid)
    }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
