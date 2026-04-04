import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Bitte eine gültige E-Mail eingeben.'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const redirectUrl = `${window.location.origin}/`

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
    setMessage('Link gesendet – bitte Postfach prüfen.')
  }

  const oauth = async (provider: 'google' | 'apple') => {
    setError(null)
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    })
    if (oAuthError) setError(oAuthError.message)
  }

  return (
    <AppLayout title="Anmelden">
      <div className="mx-auto max-w-md space-y-8">
        <p className="text-text-secondary">
          Magic Link, Google oder Apple – nach erfolgreicher Anmeldung wirst du hierher
          zurückgeleitet. Redirect-URLs in Supabase müssen <code className="rounded bg-brand-cream-dark px-1 py-0.5 text-sm">{redirectUrl}</code>{' '}
          enthalten.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-brand-cream-darker bg-bg-secondary px-3 py-2 text-text-primary shadow-sm outline-none ring-navy focus:ring-2"
              {...register('email')}
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-[var(--color-error)]">{errors.email.message}</p>
            ) : null}
          </div>
          <Button type="submit" size="full" disabled={isSubmitting}>
            {isSubmitting ? 'Senden…' : 'Magic Link senden'}
          </Button>
        </form>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            size="full"
            onClick={() => void oauth('google')}
          >
            Mit Google fortfahren
          </Button>
          <Button type="button" variant="ghost" size="full" onClick={() => void oauth('apple')}>
            Mit Apple fortfahren
          </Button>
        </div>

        {message ? (
          <p className="rounded-md bg-brand-mint/20 px-3 py-2 text-sm text-navy">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-brand-red/10 px-3 py-2 text-sm text-[var(--color-error)]">
            {error}
          </p>
        ) : null}
      </div>
    </AppLayout>
  )
}
