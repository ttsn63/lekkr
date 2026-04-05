/**
 * Twilio Programmable SMS – REST mit Basic Auth
 */

export async function sendTwilioSms(toE164: string, body: string): Promise<{ ok: boolean; skipped?: boolean; error?: string; sid?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  const from = process.env.TWILIO_FROM_NUMBER?.trim()
  if (!sid || !token || !from) {
    console.warn('[twilio] TWILIO_* nicht gesetzt – SMS übersprungen.')
    return { ok: true, skipped: true }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')

  const form = new URLSearchParams()
  form.set('To', toE164)
  form.set('From', from)
  form.set('Body', body)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `Twilio ${res.status}: ${text.slice(0, 200)}` }
    }

    const json = (await res.json().catch(() => ({}))) as { sid?: string }
    return { ok: true, sid: json.sid }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
