# Lekkr – Launch-Checkliste (Woche 10)

Vor Go-Live **manuell** in Staging/Produktion abarbeiten. Automatisiert sind: `npm run build`, `npm run test:e2e`, GitHub Actions CI.

## 1. Umgebung & Secrets

| Wo | Was |
|----|-----|
| **Netlify** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEFAULT_TENANT_ID`, `VITE_PUBLIC_SITE_URL` (finale Domain), `VITE_STRIPE_PUBLIC_KEY` |
| **Netlify Functions** | `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_*`, `TWILIO_*`, optional `HELLOCASH_*` |
| **Supabase** | Auth-URLs, Redirects, E-Mail-Templates; Migrationen angewendet |
| **Stripe** | Webhook-URL auf Netlify `/.netlify/functions/stripe-webhook` (oder eurer Route) |

## 2. E-Mails (Resend)

- [ ] Bestellbestätigung nach Kartenzahlung (Webhook) und nach Barbestellung
- [ ] Willkommensmail (Profil, einmalig)
- [ ] Newsletter Double-Opt-In (`send-marketing-opt-in` → Link `/api/confirm-marketing`)
- [ ] Geburtstagsmail (Scheduled Function, nur mit `marketing_consent` + Geburtstag)
- [ ] Inaktivitätsmail (Scheduled Function, wöchentlich)

**Hinweis:** Domain bei Resend verifizieren (`RESEND_FROM_EMAIL`).

## 3. SMS (Twilio)

- [ ] Testnummer in **Profil** hinterlegen (E.164)
- [ ] **Abholbereit:** Küche → Status „Fertig“ bei Abholung → SMS
- [ ] **Fahrer unterwegs:** Lieferung → „Übernehmen“ oder Fahrer zuweisen → SMS

## 4. Stripe

- [ ] Testmodus: Checkout durchspielen bis Bestätigungsseite
- [ ] Webhook-Events in Stripe-Dashboard prüfen (`checkout.session.completed`)
- [ ] Live-Schalter nur nach erfolgreichem Staging-Test

## 5. helloCash

- [ ] `HELLOCASH_API_BASE_URL`, `HELLOCASH_API_KEY` gesetzt
- [ ] Nach bezahlter Bestellung Rechnungsversand prüfen (Logs)
- [ ] Artikel mit `hellocash_article_id` → Bestandsbewegung prüfen

## 6. Koefteman – CSV-Import

1. Admin → **Produkte** → „CSV importieren“
2. Spalten: `name`, `price`, optional `category_id`, `active`
3. Beispieldatei: `docs/samples/koefteman-products-sample.csv`

## 7. Domain (koefteman.de → Netlify)

- [ ] Domain bei Netlify hinzufügen, DNS (A/CNAME) setzen
- [ ] SSL aktiv
- [ ] `VITE_PUBLIC_SITE_URL` = `https://koefteman.de` (Deploy neu bauen)

## 8. Performance (PageSpeed / Lighthouse)

Siehe **`docs/PERFORMANCE.md`**. Ziel: LCP/CLS in den grünen Bereich; bei Bedarf Bilder optimieren, Code-Splitting prüfen.

## 9. Playwright (lokal)

```bash
npm run test:e2e
```

Mobile + Desktop Chromium; siehe `playwright.config.ts` und `e2e/`.

---

**LAUNCH:** Wenn alle Punkte für eure Umgebung grün sind → Deploy auf `main`, Monitoring (Netlify/Supabase) im Blick behalten.
