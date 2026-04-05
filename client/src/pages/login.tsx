import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation } from 'wouter'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Input } from '@/components/ui'
import { useAuthSession } from '@/hooks/useAuthSession'
import { getPublicSiteUrl } from '@/lib/site'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail eingeben.'),
})

type LoginForm = z.infer<typeof loginSchema>

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.493 2.276-1.02 3.233-.723 1.345-1.87 2.45-3.03 2.32-1.292-.142-1.624-1.29-3.046-1.29-1.44 0-1.876 1.144-3.05 1.29-1.16.13-2.16-1.03-2.89-2.37C2.93 4.364 2.87 1.38 4.19.52 5.5-.34 7.3.06 8.83.64c1.24.47 2.11 1.11 3.14 1.11 1.02 0 2.65-1.35 4.22-1.15 1.78.24 3.06 1.13 3.89 2.87-.97.61-1.64 1.52-1.89 2.58zm-4.34 14.07c1.34 1.65 2.96 1.66 4.56.07 1.35-1.34 1.85-3.17 1.85-3.17s-1.2-.09-2.52.87c-1.14.83-2.47.74-3.25.06-.8-.7-1.2-1.6-1.2-1.6s-.9 1.1-.44 2.77z" />
    </svg>
  )
}

export function LoginPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user, loading } = useAuthSession()
  const [, navigate] = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const siteUrl = getPublicSiteUrl()
  const redirectUrl = `${siteUrl}/`

  useEffect(() => {
    if (!loading && user) {
      navigate('/')
    }
  }, [loading, user, navigate])

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    setMessage(null)
    const { error: signErr } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { emailRedirectTo: redirectUrl },
    })
    if (signErr) {
      setError(signErr.message)
      return
    }
    setMessage('Link gesendet – bitte Postfach prüfen (und Spam-Ordner).')
  }

  const oauth = async (provider: 'google' | 'apple') => {
    setError(null)
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    })
    if (oAuthError) setError(oAuthError.message)
  }

  if (loading) {
    return (
      <AppLayout title="Anmelden">
        <p className="text-center text-text-secondary">Lade Session…</p>
      </AppLayout>
    )
  }

  if (user) {
    return null
  }

  return (
    <AppLayout title="Anmelden">
      <div className="mx-auto max-w-md space-y-10">
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-2xl font-semibold text-navy">Bei Lekkr anmelden</h2>
          <p className="text-sm text-text-secondary">
            Magic Link per E-Mail oder Anmeldung mit Google bzw. Apple. Trage in Supabase unter{' '}
            <span className="font-medium">Authentication → URL Configuration</span> dieselbe
            Redirect-URL ein:{' '}
            <code className="rounded bg-brand-cream-dark px-1.5 py-0.5 text-xs">{redirectUrl}</code>
          </p>
        </div>

        <section aria-labelledby="email-login-heading" className="space-y-4">
          <h3 id="email-login-heading" className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Per E-Mail
          </h3>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="E-Mail"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" size="full" disabled={isSubmitting}>
              {isSubmitting ? 'Senden…' : 'Magic-Link senden'}
            </Button>
          </form>
        </section>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-brand-cream-dark" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bg-primary px-2 text-text-secondary">oder</span>
          </div>
        </div>

        <section aria-labelledby="oauth-heading" className="space-y-3">
          <h3 id="oauth-heading" className="sr-only">
            Mit Konto fortfahren
          </h3>
          <Button
            type="button"
            variant="secondary"
            size="full"
            className="border border-brand-cream-darker bg-bg-secondary text-navy hover:bg-brand-cream-dark"
            onClick={() => void oauth('google')}
          >
            <GoogleIcon />
            Mit Google fortfahren
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="full"
            className="border border-brand-cream-darker bg-navy text-text-light hover:bg-navy-light"
            onClick={() => void oauth('apple')}
          >
            <AppleIcon className="text-text-light" />
            Mit Apple fortfahren
          </Button>
        </section>

        {message ? (
          <p className="rounded-md bg-brand-mint/20 px-3 py-2 text-sm text-navy" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-brand-red/10 px-3 py-2 text-sm text-[var(--color-error)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </AppLayout>
  )
}
