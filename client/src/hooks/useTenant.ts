import { useMemo } from 'react'
import type { TenantContext } from '@/types/tenant'

/**
 * Demo-Mandant aus supabase/migrations/…_seed_demo_catalog.sql – Fallback, wenn
 * VITE_DEFAULT_TENANT_ID beim Build fehlt (z. B. Netlify ohne Env-Var).
 */
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'

let warnedMissingTenantEnv = false

function resolveDefaultTenantId(): string {
  const raw = import.meta.env.VITE_DEFAULT_TENANT_ID
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim()
  }
  if (!warnedMissingTenantEnv) {
    warnedMissingTenantEnv = true
    console.warn(
      '[lekkr] VITE_DEFAULT_TENANT_ID ist nicht gesetzt – nutze Demo-Tenant. ' +
        'Lokal: .env im Projektroot; Produktion: Netlify → Environment variables; danach neu deployen.',
    )
  }
  return DEMO_TENANT_ID
}

const tenantId = resolveDefaultTenantId()

/**
 * Mappt Hostname → Tenant. In Produktion später per Supabase (domain → tenant_id) auflösen.
 * Jede DB-Abfrage MUSS .eq('tenant_id', tenantId) nutzen.
 */
const DOMAIN_TENANTS: Record<string, { slug: string; id: string }> = {
  localhost: {
    slug: 'koefteman',
    id: tenantId,
  },
  '127.0.0.1': {
    slug: 'koefteman',
    id: tenantId,
  },
  'koefteman.de': {
    slug: 'koefteman',
    id: tenantId,
  },
  'www.koefteman.de': {
    slug: 'koefteman',
    id: tenantId,
  },
}

function resolveTenant(host: string): TenantContext {
  const key = host.split(':')[0]?.toLowerCase() ?? 'localhost'
  const mapped = DOMAIN_TENANTS[key]

  if (mapped?.id) {
    return { id: mapped.id, slug: mapped.slug, host: key }
  }

  return {
    id: tenantId,
    slug: mapped?.slug ?? 'koefteman',
    host: key,
  }
}

export function useTenant(): TenantContext {
  const host =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost'

  return useMemo(() => resolveTenant(host), [host])
}
