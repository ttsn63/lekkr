import type { Handler } from '@netlify/functions'

/**
 * Diagnose: GET zeigt, ob HELLOCASH_API_KEY + Base-URL gesetzt sind (ohne echte API-Calls).
 * Rechnungen/Bestand werden aus create-checkout-session, stripe-webhook und create-order-cash angestoßen.
 */
export const handler: Handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors }
  }

  if (event.httpMethod === 'GET') {
    const base =
      process.env.HELLOCASH_API_BASE_URL ?? process.env.HELLOCASH_API_URL ?? ''
    const hasKey = Boolean(process.env.HELLOCASH_API_KEY?.trim())
    const configured = Boolean(base.trim()) && hasKey
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        ok: true,
        configured,
        hasApiKey: hasKey,
        baseUrlSet: Boolean(base.trim()),
      }),
    }
  }

  return {
    statusCode: 405,
    headers: cors,
    body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
  }
}
