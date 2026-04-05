# Lekkr – TODO Phase 1

## Woche 1 – Fundament
- [x] Cursor auf MacBook installieren ✅
- [x] Repo `lekkr` auf MacBook clonen ✅
- [x] Node.js installieren
- [ ] Supabase Projekt URL + Anon Key notieren
- [x] `.env` Datei anlegen mit Supabase Keys
- [ ] Netlify Account mit GitHub verbinden
- [ ] Erstes Deployment auf Netlify testen
- [ ] Domain `lekkr.ai` auf Netlify verbinden
- [ ] Supabase Auth einschalten – Magic Link, Google, Apple
- [ ] Double Opt-In in Supabase aktivieren

## Woche 2 – Design System
- [x] Globale Farben als CSS Variablen definieren
- [x] Playfair Display + DM Sans Fonts einbinden
- [x] Button Komponente bauen – 5 Typen
- [x] Button Größen – SM, MD, LG, FULL
- [x] Input Komponente global
- [x] Card Komponente global
- [x] Modal Komponente global
- [x] Toast Benachrichtigung global
- [x] Spacing System definieren
- [x] Schatten System definieren

## Woche 3 – Speisekarte
- [x] Supabase Tabellen anlegen – tenants, products, categories
- [x] Startseite – Hero, Kategorien, Bestseller
- [x] Kategorien Komponente
- [x] Produkt-Karte Komponente
- [x] Speisekarte Seite – Filter, Kategorien
- [x] Produktdetail Seite – Bilder, Beschreibung
- [x] Video Player für Produkte
- [x] Allergene & Nährwerte Anzeige
- [x] Beliebtheits-Anzeige
- [x] Mehrsprachigkeit – Deutsch, Türkisch, Englisch

## Woche 4 – Warenkorb & Checkout
- [x] Warenkorb Supabase Tabelle
- [x] Warenkorb Sidebar Komponente
- [x] Produkt hinzufügen / entfernen
- [x] Mengen ändern
- [x] Mindestbestellwert Fortschrittsbalken
- [x] Lieferung / Abholung Toggle
- [x] Stripe Account verbinden
- [x] Stripe Checkout einbauen
- [x] Apple Pay + Google Pay aktivieren
- [x] Bar bei Abholung Option
- [x] Trinkgeld Option
- [x] Bestellbestätigung Seite

## Woche 5 – Admin Bereich
- [x] Supabase Tabellen – orders, order_items, users
- [x] Admin Login – nur per Email + Passwort
- [x] Admin Dashboard – Umsatz, KPIs
- [x] Produkte verwalten – CRUD
- [x] Kategorien verwalten
- [x] Bulk Import CSV
- [x] Bulk Actions – aktivieren, deaktivieren, löschen
- [x] Bestellungen live anzeigen
- [x] Bestellungen Archiv
- [x] Bestellung ablehnen mit Begründung

## Woche 6 – Küche & Fahrer
- [x] Supabase Realtime aktivieren
- [x] Küchen-Display Seite
- [x] Kanban Board – Neu, In Arbeit, Fertig
- [x] Ton bei neuer Bestellung
- [x] Farbe wechselt bei langer Wartezeit
- [x] Touch-optimiert für Tablet
- [x] Fahrer-Dashboard Seite
- [x] Fahrer zuweisen zu Bestellung
- [x] GPS Status Update
- [x] Mitarbeiter Einladungs-System

## Woche 7 – Coupons
- [x] Supabase Tabellen – coupons, coupon_usages
- [x] Coupon-Builder im Admin
- [x] Coupon Typen – Prozent, Fix, Bundle, Gratis
- [x] Coupons-Seite für Kunden
- [x] Coupon-Karte Komponente
- [x] Coupon-Konfigurator – Kunde wählt Produkte
- [x] Coupon Validierung im Checkout
- [x] Coupon im Warenkorb anzeigen
- [x] Coupon Statistiken im Admin
- [x] Geburtstags-Coupon automatisch

## Woche 8 – helloCash & Referral
- [ ] Supabase Tabellen – referrals, referral_credits
- [ ] helloCash API Key einrichten
- [ ] helloCash – Rechnung automatisch erstellen
- [ ] helloCash – Warenbestand sync
- [ ] Referral Link pro Kunde generieren
- [ ] Referral Tracking einbauen
- [ ] Guthaben gutschreiben automatisch
- [ ] Guthaben im Kundenprofil anzeigen
- [ ] Guthaben im Checkout einlösen
- [ ] Coupon ODER Referral – nicht beides Logik

## Woche 9 – Email, SMS & DSGVO
- [x] Resend Account verbinden (RESEND_* in Netlify / `.env`, `resend-mail.ts`)
- [x] Bestellbestätigung Email Template
- [x] Double Opt-In Email Template
- [x] Willkommens Email Template
- [x] Geburtstags Email Template (scheduled + `marketing_consent`)
- [x] Inaktivitäts Email Template (scheduled wöchentlich)
- [x] Twilio Account verbinden (TWILIO_*)
- [x] SMS bei Abholbereit
- [x] SMS bei Fahrer unterwegs
- [x] Cookie Banner einbauen
- [x] Impressum Seite
- [x] Datenschutz Seite
- [x] AGB Seite
- [x] Account löschen Funktion

## Woche 10 – Testen & Launch
- [x] Playwright Tests einrichten (`e2e/`, `playwright.config.ts`, `npm run test:e2e`)
- [x] GitHub Actions CI/CD einrichten (`.github/workflows/ci.yml`)
- [x] Alle Seiten auf Mobile testen (Playwright-Projekt `mobile-chromium`, Pixel 7)
- [x] Performance messen – PageSpeed (`docs/PERFORMANCE.md` + manuell PSI)
- [ ] Alle Emails testen *(manuell laut `docs/LAUNCH_CHECKLIST.md`)*
- [ ] Alle SMS testen *(manuell)*
- [ ] Stripe Zahlung testen *(manuell / Staging)*
- [ ] helloCash Integration testen *(manuell)*
- [ ] Koefteman Produkte importieren via CSV *(Admin → CSV, Sample: `docs/samples/koefteman-products-sample.csv`)*
- [ ] koefteman.de auf Netlify umzeigen *(DNS + Env)*
- [ ] **LAUNCH** 🚀 *(nach Checkliste)*

---

## Repo-Stand (bereits vorhanden, nicht identisch mit Woche-2+ Checkliste)

- Vite + React + TypeScript + Tailwind, Supabase-Client, Login mit Magic Link / Google / Apple im Code (`client/`)
- `netlify.toml` + Function-Stubs unter `netlify/functions/`
- Initiale SQL-Migration unter `supabase/migrations/`
