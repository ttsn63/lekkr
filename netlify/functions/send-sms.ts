import type { Handler } from '@netlify/functions'

/**
 * Hinweis: Produktiv werden SMS über `notify-customer` (Küche/Fahrer) mit Twilio versendet.
 * Dieser Endpunkt bleibt als Platzhalter für Tests.
 */
export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ok: true,
      message: 'SMS werden über notify-customer + Twilio ausgelöst (Abholbereit / Fahrer unterwegs).',
    }),
  }
}
