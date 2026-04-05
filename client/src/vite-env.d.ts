/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** UUID des Standard-Tenants (z. B. Koefteman) für lokale Entwicklung */
  readonly VITE_DEFAULT_TENANT_ID: string
  /** Optional: kanonische Site-URL für Auth-Redirects (ohne trailing slash) */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_STRIPE_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
