import type { Handler } from '@netlify/functions'
import { templateBirthday } from './_shared/email-templates'
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

function startOfUtcDay(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate())).toISOString()
}

/**
 * Netlify Scheduled Function – täglich Geburtstags-Mails (Resend).
 */
export const handler: Handler = async () => {
  const admin = createSupabaseAdmin()
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  const { data: users, error } = await admin
    .from('users')
    .select('id, email, tenant_id, name, birthday, marketing_consent')
    .eq('role', 'customer')
    .not('tenant_id', 'is', null)
    .not('birthday', 'is', null)
    .not('email', 'is', null)

  if (error) {
    console.error('[scheduled-birthday]', error.message)
    return { statusCode: 500, body: 'error' }
  }

  const dayStart = startOfUtcDay()

  for (const u of users ?? []) {
    const b = new Date(u.birthday as string)
    if (b.getMonth() + 1 !== month || b.getDate() !== day) continue
    if (!u.marketing_consent) continue

    const tenantId = u.tenant_id as string
    const uid = u.id as string

    const { count } = await admin
      .from('notification_dispatch_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('kind', 'birthday_email')
      .gte('created_at', dayStart)

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

    const html = templateBirthday({
      brandName,
      accentColor: accent,
      siteUrl: `${siteUrl()}/menu`,
      firstName: (u.name as string) ?? null,
    })

    const r = await sendResendEmail({
      to: u.email as string,
      subject: `Alles Gute zum Geburtstag – ${brandName}`,
      html,
    })

    if (r.ok || r.skipped) {
      await logDispatch(admin, tenantId, null, 'birthday_email', 'email', uid)
    }
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
