/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** UUID des Standard-Tenants (z. B. Koefteman) für lokale Entwicklung */
  readonly VITE_DEFAULT_TENANT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
