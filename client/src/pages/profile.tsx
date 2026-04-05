import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { claimPendingReferralCode } from '@/lib/referralClaim'
import { formatEur } from '@/lib/format'
import { supabase } from '@/lib/supabase'

export function ProfilePage() {
  const tenant = useTenant()
  const { t, locale } = useLocale()
  const { user, loading: authLoading } = useAuthSession()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)

  const siteBase =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') ??
    (typeof window !== 'undefined' ? window.location.origin : '')

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-user', user?.id, tenant.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data: codeResult, error: rpcErr } = await supabase.rpc('ensure_my_referral_code')
      if (rpcErr) throw rpcErr

      const { data, error } = await supabase
        .from('users')
        .select('referral_code, referral_credits')
        .eq('id', user!.id)
        .maybeSingle()

      if (error) throw error
      const code = (data?.referral_code as string | null) ?? (codeResult as string | null)
      return {
        referralCode: code ?? '',
        balance: Number(data?.referral_credits ?? 0),
      }
    },
  })

  const claimRef = useCallback(async () => {
    if (!user) return
    await claimPendingReferralCode(supabase, tenant.id)
    await qc.invalidateQueries({ queryKey: ['profile-user', user.id, tenant.id] })
  }, [qc, tenant.id, user])

  useEffect(() => {
    if (!user) return
    void claimRef()
  }, [user, claimRef])

  const referralLink =
    profile?.referralCode && siteBase
      ? `${siteBase}/?ref=${encodeURIComponent(profile.referralCode)}`
      : ''

  async function copyLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (authLoading) {
    return (
      <AppLayout title={t('profile.title')}>
        <p className="text-text-secondary">{t('nav.loading')}</p>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title={t('profile.title')}>
        <p className="text-text-secondary">{t('checkout.loginRequired')}</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={t('profile.title')}>
      <div className="mx-auto max-w-lg space-y-ds-xl">
        <Card>
          <CardContent className="space-y-ds-md">
            <p className="font-heading text-ds-lg text-navy">{t('profile.referralBalance')}</p>
            <p className="text-ds-2xl font-semibold text-navy">
              {profileLoading ? '…' : formatEur(locale, profile?.balance ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-ds-md">
            <p className="font-heading text-ds-lg text-navy">{t('profile.referralLink')}</p>
            <p className="text-ds-sm text-text-secondary">{t('profile.referralHint')}</p>
            {referralLink ? (
              <>
                <p className="break-all rounded-sm bg-bg-secondary px-ds-sm py-ds-xs font-mono text-ds-xs">
                  {referralLink}
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={() => void copyLink()}>
                  {copied ? '✓' : t('profile.referralCopy')}
                </Button>
              </>
            ) : (
              <p className="text-ds-sm text-text-secondary">{t('nav.loading')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
