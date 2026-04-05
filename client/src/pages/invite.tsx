import { useMutation } from '@tanstack/react-query'
import { useLocation, useRoute } from 'wouter'
import { Button } from '@/components/ui/Button'
import { useAuthSession } from '@/hooks/useAuthSession'
import { supabase } from '@/lib/supabase'

export function InvitePage() {
  const [, params] = useRoute('/invite/:token')
  const token = params?.token
  const { user, loading } = useAuthSession()
  const [, navigate] = useLocation()

  const acceptMut = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Token fehlt')
      const { data, error } = await supabase.rpc('accept_staff_invitation', {
        p_token: token,
      })
      if (error) throw error
      const d = data as { ok?: boolean; error?: string }
      if (d?.ok) return d
      if (d?.error === 'email_mismatch') {
        throw new Error(
          'E-Mail passt nicht zur Einladung. Mit der eingeladenen Adresse anmelden.',
        )
      }
      if (d?.error === 'invalid_or_expired') {
        throw new Error('Einladung ungültig oder abgelaufen.')
      }
      throw new Error('Einladung konnte nicht angenommen werden.')
    },
    onSuccess: () => {
      navigate('/')
    },
  })

  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-ds-md p-ds-lg">
        <p className="text-text-secondary">Ungültiger Link.</p>
        <Button type="button" onClick={() => navigate('/')}>
          Zur Startseite
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-ds-lg">
        <p className="text-text-secondary">Lade…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-ds-lg p-ds-lg">
        <h1 className="font-heading text-ds-2xl text-navy">Team-Einladung</h1>
        <p className="text-text-secondary">
          Bitte zuerst anmelden – mit der E-Mail-Adresse, die eingeladen wurde (Magic Link oder
          Google/Apple).
        </p>
        <Button type="button" onClick={() => navigate('/login')}>
          Zum Login
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-ds-lg p-ds-lg">
      <h1 className="font-heading text-ds-2xl text-navy">Einladung annehmen</h1>
      <p className="text-ds-sm text-text-secondary">
        Dein Konto wird der Organisation mit der Rolle aus der Einladung zugeordnet.
      </p>
      {acceptMut.isError ? (
        <p className="text-ds-sm text-[color:var(--color-error)]">
          {(acceptMut.error as Error).message}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={acceptMut.isPending}
        onClick={() => acceptMut.mutate()}
      >
        {acceptMut.isPending ? 'Wird übernommen…' : 'Jetzt annehmen'}
      </Button>
      <Button type="button" variant="ghost" onClick={() => navigate('/')}>
        Abbrechen
      </Button>
    </div>
  )
}
