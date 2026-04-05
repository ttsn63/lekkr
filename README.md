# Lekkr

Multitenant-Restaurant-Shop (Vite, React, Supabase, Netlify Functions).

## Entwicklung

```bash
cp .env.example .env   # Supabase & Co. eintragen
npm install
npm run dev              # http://localhost:5173
```

## Build & Qualität

```bash
npm run build
npm run typecheck
npm run test:e2e         # Playwright (Chromium Desktop + Mobile), siehe playwright.config.ts
```

CI: GitHub Actions **CI** (`.github/workflows/ci.yml`) – Build + Playwright bei Push/PR auf `main`.

## Launch & Performance

- **`docs/LAUNCH_CHECKLIST.md`** – E-Mails, SMS, Stripe, helloCash, Domain, manuelle Tests
- **`docs/PERFORMANCE.md`** – PageSpeed Insights & Lighthouse
