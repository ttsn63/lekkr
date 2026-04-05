import type { Handler } from '@netlify/functions'
import { createSupabaseAdmin } from './_shared/supabase-admin'

function siteUrl(): string {
  return (
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    process.env.VITE_PUBLIC_SITE_URL ??
    'http://localhost:5173'
  ).replace(/\/$/, '')
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const token = event.queryStringParameters?.token?.trim()
  if (!token) {
    return {
      statusCode: 302,
      headers: { Location: `${siteUrl()}/profile?newsletter=error` },
    }
  }

  const admin = createSupabaseAdmin()
  const { data: row } = await admin
    .from('users')
    .select('id')
    .eq('marketing_confirm_token', token)
    .maybeSingle()

  if (!row?.id) {
    return {
      statusCode: 302,
      headers: { Location: `${siteUrl()}/profile?newsletter=invalid` },
    }
  }

  await admin
    .from('users')
    .update({
      marketing_confirm_token: null,
      marketing_consent: true,
      marketing_confirmed_at: new Date().toISOString(),
    })
    .eq('id', row.id as string)

  return {
    statusCode: 302,
    headers: { Location: `${siteUrl()}/profile?newsletter=ok` },
  }
}
