import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { postNetlifyFunction } from '@/lib/api/netlify'
import { claimPendingReferralCode } from '@/lib/referralClaim'
import { formatEur } from '@/lib/format'
import { supabase } from '@/lib/supabase'

export function ProfilePage() {
  const tenant = useTenant()
  const { t, locale } = useLocale()
  const { user, loading: authLoading, signOut } = useAuthSession()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [phoneLocal, setPhoneLocal] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [newsletterBusy, setNewsletterBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const welcomeSendRef = useRef(false)

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
        .select(
          'referral_code, referral_credits, phone, welcome_email_sent_at, marketing_consent, marketing_confirmed_at, marketing_confirm_token',
        )
        .eq('id', user!.id)
        .maybeSingle()

      if (error) throw error
      const code = (data?.referral_code as string | null) ?? (codeResult as string | null)
      return {
        referralCode: code ?? '',
        balance: Number(data?.referral_credits ?? 0),
        phone: (data?.phone as string | null) ?? '',
        welcomeSent: Boolean(data?.welcome_email_sent_at),
        marketingConsent: Boolean(data?.marketing_consent),
        marketingConfirmedAt: (data?.marketing_confirmed_at as string | null) ?? null,
        marketingPendingToken: (data?.marketing_confirm_token as string | null) ?? null,
      }
    },
  })

  useEffect(() => {
    if (profile?.phone != null) setPhoneLocal(profile.phone)
  }, [profile?.phone])

  const claimRef = useCallback(async () => {
    if (!user) return
    await claimPendingReferralCode(supabase, tenant.id)
    await qc.invalidateQueries({ queryKey: ['profile-user', user.id, tenant.id] })
  }, [qc, tenant.id, user])

  useEffect(() => {
    if (!user) return
    void claimRef()
  }, [user, claimRef])

  useEffect(() => {
    if (!user || !profile || profile.welcomeSent || welcomeSendRef.current) return
    welcomeSendRef.current = true
    let cancelled = false
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token || cancelled) return
      const res = await postNetlifyFunction('send-welcome-email', {}, token)
      if (res.ok && !cancelled) {
        await qc.invalidateQueries({ queryKey: ['profile-user', user.id, tenant.id] })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, profile?.welcomeSent, qc])

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

  async function savePhone() {
    if (!user) return
    setSavingPhone(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ phone: phoneLocal.trim() || null })
        .eq('id', user.id)
      if (error) throw error
      await qc.invalidateQueries({ queryKey: ['profile-user', user.id, tenant.id] })
    } finally {
      setSavingPhone(false)
    }
  }

  async function toggleNewsletter(want: boolean) {
    if (!user) return
    setNewsletterBusy(true)
    try {
      if (!want) {
        const { error } = await supabase
          .from('users')
          .update({ marketing_consent: false, marketing_confirm_token: null })
          .eq('id', user.id)
        if (error) throw error
      } else if (profile?.marketingConfirmedAt) {
        const { error } = await supabase.from('users').update({ marketing_consent: true }).eq('id', user.id)
        if (error) throw error
      } else {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) return
        const res = await postNetlifyFunction('send-marketing-opt-in', {}, token)
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          window.alert(j.error ?? 'Versand fehlgeschlagen')
          return
        }
      }
      await qc.invalidateQueries({ queryKey: ['profile-user', user.id, tenant.id] })
    } finally {
      setNewsletterBusy(false)
    }
  }

  async function deleteAccount() {
    if (!user) return
    if (
      !window.confirm(
        'Konto wirklich unwiderruflich löschen? Alle zugehörigen Daten werden entfernt, soweit gesetzlich möglich.',
      )
    ) {
      return
    }
    setDeleteBusy(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return
      const res = await postNetlifyFunction('delete-account', {}, token)
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !j.ok) {
        window.alert(j.error ?? 'Löschen fehlgeschlagen')
        return
      }
      await signOut()
      window.location.href = '/'
    } finally {
      setDeleteBusy(false)
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

  const newsletterActive = Boolean(profile?.marketingConfirmedAt && profile?.marketingConsent)
  const newsletterPending = Boolean(profile?.marketingPendingToken && !profile?.marketingConfirmedAt)

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

        <Card>
          <CardContent className="space-y-ds-md">
            <p className="font-heading text-ds-lg text-navy">{t('profile.phoneLabel')}</p>
            <p className="text-ds-xs text-text-secondary">{t('profile.phoneHint')}</p>
            <Input
              type="tel"
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              placeholder="+49…"
              autoComplete="tel"
            />
            <Button type="button" size="sm" disabled={savingPhone} onClick={() => void savePhone()}>
              {savingPhone ? '…' : t('profile.savePhone')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-ds-md">
            <p className="font-heading text-ds-lg text-navy">{t('profile.newsletterTitle')}</p>
            {newsletterActive ? (
              <p className="text-ds-sm text-[color:var(--color-success)]">{t('profile.newsletterOn')}</p>
            ) : null}
            {newsletterPending ? (
              <p className="text-ds-sm text-[color:var(--color-warning)]">{t('profile.newsletterPending')}</p>
            ) : null}
            <label className="flex cursor-pointer items-center gap-ds-sm text-ds-sm">
              <input
                type="checkbox"
                checked={newsletterActive || newsletterPending}
                disabled={newsletterBusy}
                onChange={(e) => void toggleNewsletter(e.target.checked)}
              />
              <span>{t('profile.newsletterOptIn')}</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-ds-md">
            <p className="font-heading text-ds-lg text-navy">{t('profile.dangerZone')}</p>
            <p className="text-ds-sm text-text-secondary">{t('profile.deleteHint')}</p>
            <Button
              type="button"
              variant="secondary"
              className="border-[color:var(--color-error)] text-[color:var(--color-error)]"
              disabled={deleteBusy}
              onClick={() => void deleteAccount()}
            >
              {deleteBusy ? '…' : t('profile.deleteAccount')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
