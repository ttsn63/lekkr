import type { Handler } from '@netlify/functions'
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

  const admin = createSupabaseAdmin()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return json(500, { ok: false, error: error.message })
  }

  return json(200, { ok: true })
}
