/**
 * Resend REST API – https://resend.com/docs
 */

export type ResendPayload = {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendResendEmail(payload: ResendPayload): Promise<{ ok: boolean; id?: string; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM_EMAIL?.trim()
  if (!key || !from) {
    console.warn('[resend] RESEND_API_KEY oder RESEND_FROM_EMAIL fehlt – E-Mail übersprungen.')
    return { ok: true, skipped: true }
  }

  const toList = Array.isArray(payload.to) ? payload.to : [payload.to]

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject: payload.subject,
        html: payload.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` }
    }

    const body = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: body.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
