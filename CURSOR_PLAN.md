# Lekkr – Cursor-Bauplan

Siehe Nutzerdokument „Lekkr – Cursor Bauplan“ (Tech-Stack, Ordnerstruktur, Multitenant-Regeln).

**Kernregel:** Jede Datenbankabfrage mit `tenant_id` filtern. Keine Kundendaten an KI weitergeben.

**Phase 1 (aktuell):** Woche 1 – Vite, Struktur, Supabase-Client, Auth-UI, Netlify.

---

## Design System (Token – exakt für CSS & Tailwind)

Diese Werte entsprechen den Defaults in `tenant_settings` (Migration) und sind als CSS Custom Properties in `client/src/styles/global.css` definiert.

### Farben

| Token / Rolle | Hex | CSS-Variable |
|-----------------|-----|----------------|
| Primary (Markenrot) | `#CC2A40` | `--color-primary`, `--color-red` |
| Secondary (Navy) | `#183052` | `--color-secondary`, `--color-navy` |
| Hintergrund (Cream) | `#F5EFE4` | `--color-background`, `--color-cream`, `--color-bg-primary` |
| Akzent (Mint) | `#62E6BE` | `--color-accent`, `--color-mint` |

Abstufungen: `--color-navy-light` `#1e3d6b`, `--color-navy-dark` `#0f1f35`; Rot/Mint/Cream wie in `global.css` (`--color-red-light` …).

Semantisch: Erfolg `#1d9e75`, Warnung `#f5a623`, Fehler `#cc2a40` (`--color-success`, `--color-warning`, `--color-error`).

### Typografie

- **Überschriften:** Playfair Display (400, 600, 700)
- **Fließtext / UI:** DM Sans (300–700, opsz 9..40)

### Abstände (Spacing)

`--space-2xs` 2px · `--space-xs` 4px · `--space-sm` 8px · `--space-md` 16px · `--space-lg` 24px · `--space-xl` 32px · `--space-2xl` 48px · `--space-3xl` 64px

### Schatten

`--shadow-sm` · `--shadow-md` · `--shadow-lg` · `--shadow-xl`

### Ecken

`--radius-sm` 8px · `--radius-md` 16px · `--radius-lg` 24px · `--radius-full` 100px
