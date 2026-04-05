# Performance & PageSpeed

## Google PageSpeed Insights (empfohlen für Launch)

1. Öffentliche URL der Produktions-Site öffnen: [PageSpeed Insights](https://pagespeed.web.dev/)
2. **Mobile** und **Desktop** einzeln messen
3. Core Web Vitals: **LCP**, **INP** (bzw. FID), **CLS**

Typische Hebel:

- Bilder: WebP/AVIF, sinnvolle Abmessungen, `loading="lazy"` wo passend
- Schriftarten: `font-display: swap`, nur benötigte Schnitte
- JS-Bundle: bei Bedarf dynamische Imports (React `lazy`) für große Admin-Bereiche
- CDN/Netlify: Assets unter `/assets/*` sind lang gecacht (`netlify.toml`)

## Lighthouse lokal (CLI)

Nach Build die statische Preview messen:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 &
npx lighthouse http://127.0.0.1:4173 --only-categories=performance --output=html --output-path=./lighthouse-report.html
```

(`npx lighthouse` installiert bei Bedarf das Paket temporär.)

## CI

Automatische Lighthouse-Läufe in GitHub Actions sind optional (häufig flaky). Für Launch reicht manuelle PSI + ein lokaler Lighthouse-Lauf gegen Staging/Prod-URL.
