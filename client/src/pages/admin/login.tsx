import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'wouter'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Gültige E-Mail eingeben.'),
  password: z.string().min(6, 'Mindestens 6 Zeichen.'),
})

type Form = z.infer<typeof schema>

export function AdminLoginPage() {
  const [, navigate] = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setError(null)
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (signErr) {
      setError(signErr.message)
      return
    }
    navigate('/admin/dashboard')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-bg-primary px-ds-lg py-ds-3xl">
      <div className="rounded-md border border-brand-cream-darker bg-bg-secondary p-ds-xl shadow-md">
        <h1 className="font-heading text-ds-2xl font-semibold text-navy">Admin-Login</h1>
        <p className="mt-ds-sm text-ds-sm text-text-secondary">
          Nur E-Mail und Passwort (kein Magic Link). Konto muss in Supabase Auth angelegt und in{' '}
          <code className="rounded bg-brand-cream-dark px-1">public.users</code> die Rolle{' '}
          <code className="rounded bg-brand-cream-dark px-1">admin</code> haben.
        </p>
        <form className="mt-ds-lg space-y-ds-md" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input label="E-Mail" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Passwort"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {error ? (
            <p className="text-ds-sm text-[color:var(--color-error)]" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="full" disabled={isSubmitting}>
            {isSubmitting ? 'Anmelden…' : 'Anmelden'}
          </Button>
        </form>
        <p className="mt-ds-md text-center text-ds-sm">
          <Link href="/login" className="text-navy underline">
            Kunden-Login
          </Link>
        </p>
      </div>
    </div>
  )
}
