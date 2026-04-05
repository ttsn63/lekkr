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
- [ ] Warenkorb Supabase Tabelle
- [ ] Warenkorb Sidebar Komponente
- [ ] Produkt hinzufügen / entfernen
- [ ] Mengen ändern
- [ ] Mindestbestellwert Fortschrittsbalken
- [ ] Lieferung / Abholung Toggle
- [ ] Stripe Account verbinden
- [ ] Stripe Checkout einbauen
- [ ] Apple Pay + Google Pay aktivieren
- [ ] Bar bei Abholung Option
- [ ] Trinkgeld Option
- [ ] Bestellbestätigung Seite

## Woche 5 – Admin Bereich
- [ ] Supabase Tabellen – orders, order_items, users
- [ ] Admin Login – nur per Email + Passwort
- [ ] Admin Dashboard – Umsatz, KPIs
- [ ] Produkte verwalten – CRUD
- [ ] Kategorien verwalten
- [ ] Bulk Import CSV
- [ ] Bulk Actions – aktivieren, deaktivieren, löschen
- [ ] Bestellungen live anzeigen
- [ ] Bestellungen Archiv
- [ ] Bestellung ablehnen mit Begründung

## Woche 6 – Küche & Fahrer
- [ ] Supabase Realtime aktivieren
- [ ] Küchen-Display Seite
- [ ] Kanban Board – Neu, In Arbeit, Fertig
- [ ] Ton bei neuer Bestellung
- [ ] Farbe wechselt bei langer Wartezeit
- [ ] Touch-optimiert für Tablet
- [ ] Fahrer-Dashboard Seite
- [ ] Fahrer zuweisen zu Bestellung
- [ ] GPS Status Update
- [ ] Mitarbeiter Einladungs-System

## Woche 7 – Coupons
- [ ] Supabase Tabellen – coupons, coupon_usages
- [ ] Coupon-Builder im Admin
- [ ] Coupon Typen – Prozent, Fix, Bundle, Gratis
- [ ] Coupons-Seite für Kunden
- [ ] Coupon-Karte Komponente
- [ ] Coupon-Konfigurator – Kunde wählt Produkte
- [ ] Coupon Validierung im Checkout
- [ ] Coupon im Warenkorb anzeigen
- [ ] Coupon Statistiken im Admin
- [ ] Geburtstags-Coupon automatisch

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
- [ ] Resend Account verbinden
- [ ] Bestellbestätigung Email Template
- [ ] Double Opt-In Email Template
- [ ] Willkommens Email Template
- [ ] Geburtstags Email Template
- [ ] Inaktivitäts Email Template
- [ ] Twilio Account verbinden
- [ ] SMS bei Abholbereit
- [ ] SMS bei Fahrer unterwegs
- [ ] Cookie Banner einbauen
- [ ] Impressum Seite
- [ ] Datenschutz Seite
- [ ] AGB Seite
- [ ] Account löschen Funktion

## Woche 10 – Testen & Launch
- [ ] Playwright Tests einrichten
- [ ] GitHub Actions CI/CD einrichten
- [ ] Alle Seiten auf Mobile testen
- [ ] Performance messen – PageSpeed
- [ ] Alle Emails testen
- [ ] Alle SMS testen
- [ ] Stripe Zahlung testen
- [ ] helloCash Integration testen
- [ ] Koefteman Produkte importieren via CSV
- [ ] koefteman.de auf Netlify umzeigen
- [ ] **LAUNCH** 🚀

---

## Repo-Stand (bereits vorhanden, nicht identisch mit Woche-2+ Checkliste)

- Vite + React + TypeScript + Tailwind, Supabase-Client, Login mit Magic Link / Google / Apple im Code (`client/`)
- `netlify.toml` + Function-Stubs unter `netlify/functions/`
- Initiale SQL-Migration unter `supabase/migrations/`
