import { useMemo } from 'react'
import type { TenantContext } from '@/types/tenant'

/**
 * Mappt Hostname → Tenant. In Produktion später per Supabase (domain → tenant_id) auflösen.
 * Jede DB-Abfrage MUSS .eq('tenant_id', tenantId) nutzen.
 */
const DOMAIN_TENANTS: Record<
  string,
  { slug: string; id: string }
> = {
  localhost: {
    slug: 'koefteman',
    id: import.meta.env.VITE_DEFAULT_TENANT_ID,
  },
  '127.0.0.1': {
    slug: 'koefteman',
    id: import.meta.env.VITE_DEFAULT_TENANT_ID,
  },
  'koefteman.de': {
    slug: 'koefteman',
    id: import.meta.env.VITE_DEFAULT_TENANT_ID,
  },
  'www.koefteman.de': {
    slug: 'koefteman',
    id: import.meta.env.VITE_DEFAULT_TENANT_ID,
  },
}

function resolveTenant(host: string): TenantContext {
  const key = host.split(':')[0]?.toLowerCase() ?? 'localhost'
  const mapped = DOMAIN_TENANTS[key]

  if (mapped?.id) {
    return { id: mapped.id, slug: mapped.slug, host: key }
  }

  const fallbackId = import.meta.env.VITE_DEFAULT_TENANT_ID
  if (!fallbackId) {
    throw new Error(
      'Tenant: VITE_DEFAULT_TENANT_ID fehlt – für lokale Entwicklung in .env setzen.',
    )
  }

  return {
    id: fallbackId,
    slug: mapped?.slug ?? 'koefteman',
    host: key,
  }
}

export function useTenant(): TenantContext {
  const host =
    typeof window !== 'undefined' ? window.location.hostname : 'localhost'

  return useMemo(() => resolveTenant(host), [host])
}
