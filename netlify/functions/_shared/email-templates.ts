/**
 * HTML-Templates für Resend (de-DE). Platzhalter werden serverseitig ersetzt.
 * tenant_id wird in Metadaten/Links genutzt, nicht im sichtbaren Text zwingend.
 */

function layout(inner: string, title: string, brandName: string, accentColor: string) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;font-family:Georgia,serif;background:#f5efe4;color:#183052;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5efe4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);">
        <tr><td style="background:${accentColor};padding:20px 24px;color:#fff;font-size:20px;font-weight:600;">${escapeHtml(brandName)}</td></tr>
        <tr><td style="padding:28px 24px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#183052;">${escapeHtml(title)}</h1>
          ${inner}
        </td></tr>
        <tr><td style="padding:16px 24px;font-size:12px;color:#666;border-top:1px solid #eee;">
          Diese Nachricht wurde automatisch gesendet. Bei Fragen antworte auf diese E-Mail oder nutze die Kontaktdaten im Impressum.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function templateOrderConfirmation(p: {
  brandName: string
  accentColor: string
  orderNumber: string
  totalFormatted: string
  orderTypeLabel: string
  linesHtml: string
  siteUrl: string
}) {
  const inner = `
    <p style="line-height:1.5;margin:0 0 16px;">Vielen Dank für deine Bestellung bei <strong>${escapeHtml(p.brandName)}</strong>.</p>
    <p style="line-height:1.5;margin:0 0 8px;"><strong>Bestellnummer:</strong> ${escapeHtml(p.orderNumber)}</p>
    <p style="line-height:1.5;margin:0 0 8px;"><strong>Art:</strong> ${escapeHtml(p.orderTypeLabel)}</p>
    <p style="line-height:1.5;margin:0 0 16px;"><strong>Gesamt:</strong> ${escapeHtml(p.totalFormatted)}</p>
    <div style="margin:16px 0;padding:12px;background:#f5efe4;border-radius:6px;">${p.linesHtml}</div>
    <p style="margin:20px 0 0;"><a href="${escapeHtml(p.siteUrl)}" style="color:${escapeHtml(p.accentColor)};">Zur Website</a></p>
  `
  return layout(inner, 'Bestellbestätigung', p.brandName, p.accentColor)
}

export function templateDoubleOptInMarketing(p: {
  brandName: string
  accentColor: string
  confirmUrl: string
}) {
  const inner = `
    <p style="line-height:1.5;margin:0 0 16px;">Du hast den Newsletter bei <strong>${escapeHtml(p.brandName)}</strong> angefordert.</p>
    <p style="line-height:1.5;margin:0 0 20px;">Bitte bestätige deine E-Mail-Adresse mit einem Klick:</p>
    <p style="margin:0 0 24px;"><a href="${escapeHtml(p.confirmUrl)}" style="display:inline-block;padding:12px 24px;background:${escapeHtml(p.accentColor)};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Jetzt bestätigen</a></p>
    <p style="font-size:13px;color:#666;">Wenn du diese Anmeldung nicht veranlasst hast, ignoriere diese E-Mail.</p>
  `
  return layout(inner, 'Newsletter bestätigen', p.brandName, p.accentColor)
}

export function templateWelcome(p: { brandName: string; accentColor: string; siteUrl: string }) {
  const inner = `
    <p style="line-height:1.5;margin:0 0 16px;">Willkommen bei <strong>${escapeHtml(p.brandName)}</strong>!</p>
    <p style="line-height:1.5;margin:0 0 16px;">Dein Konto ist aktiv. Stöbere in der Speisekarte und bestelle, wann du magst.</p>
    <p style="margin:20px 0 0;"><a href="${escapeHtml(p.siteUrl)}" style="color:${escapeHtml(p.accentColor)};">Zur Speisekarte</a></p>
  `
  return layout(inner, 'Willkommen', p.brandName, p.accentColor)
}

export function templateBirthday(p: {
  brandName: string
  accentColor: string
  siteUrl: string
  firstName?: string | null
}) {
  const greet = p.firstName ? `Hallo ${escapeHtml(p.firstName)},` : 'Hallo,'
  const inner = `
    <p style="line-height:1.5;margin:0 0 16px;">${greet}</p>
    <p style="line-height:1.5;margin:0 0 16px;">Alles Gute zum Geburtstag von <strong>${escapeHtml(p.brandName)}</strong>! 🎂</p>
    <p style="line-height:1.5;margin:0 0 16px;">Schau vorbei – es wartet vielleicht ein Geburtstags-Coupon auf dich.</p>
    <p style="margin:20px 0 0;"><a href="${escapeHtml(p.siteUrl)}" style="color:${escapeHtml(p.accentColor)};">Zur Website</a></p>
  `
  return layout(inner, 'Alles Gute zum Geburtstag', p.brandName, p.accentColor)
}

export function templateInactivity(p: {
  brandName: string
  accentColor: string
  siteUrl: string
  firstName?: string | null
}) {
  const greet = p.firstName ? `Hallo ${escapeHtml(p.firstName)},` : 'Hallo,'
  const inner = `
    <p style="line-height:1.5;margin:0 0 16px;">${greet}</p>
    <p style="line-height:1.5;margin:0 0 16px;">Wir vermissen dich bei <strong>${escapeHtml(p.brandName)}</strong>! Es ist schon eine Weile her seit deiner letzten Bestellung.</p>
    <p style="line-height:1.5;margin:0 0 16px;">Schnapp dir frische Gerichte – wir freuen uns auf dich.</p>
    <p style="margin:20px 0 0;"><a href="${escapeHtml(p.siteUrl)}" style="color:${escapeHtml(p.accentColor)};">Jetzt bestellen</a></p>
  `
  return layout(inner, 'Wir freuen uns auf dich', p.brandName, p.accentColor)
}
