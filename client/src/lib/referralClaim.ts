import type { SupabaseClient } from '@supabase/supabase-js'
import { referralStorageKey } from '@/hooks/useReferralCapture'

export async function claimPendingReferralCode(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<{ ok: boolean }> {
  let code: string | null = null
  try {
    code = localStorage.getItem(referralStorageKey(tenantId))
  } catch {
    return { ok: false }
  }
  if (!code || code.length < 4) return { ok: true }

  const { data, error } = await supabase.rpc('link_referrer_code', {
    p_code: code,
    p_tenant_id: tenantId,
  })

  if (error) {
    console.warn('[referral] link_referrer_code', error.message)
    return { ok: false }
  }

  const row = data as { ok?: boolean; error?: string } | null
  if (row?.ok === true) {
    try {
      localStorage.removeItem(referralStorageKey(tenantId))
    } catch {
      /* ignore */
    }
  }

  return { ok: row?.ok === true }
}
