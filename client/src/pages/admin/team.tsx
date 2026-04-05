import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AdminPage } from '@/components/admin/AdminPage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useTenant } from '@/hooks/useTenant'
import { getPublicSiteUrl } from '@/lib/site'
import {
  createStaffInvitation,
  fetchStaffInvitations,
  revokeStaffInvitation,
} from '@/lib/queries/staffInvitations'

export function AdminTeamPage() {
  const tenant = useTenant()
  const qc = useQueryClient()
  const { user } = useAuthSession()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'kitchen' | 'driver'>('kitchen')
  const [copied, setCopied] = useState<string | null>(null)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['staff-invitations', tenant.id],
    queryFn: () => fetchStaffInvitations(tenant.id),
  })

  const createMut = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Session')
      return createStaffInvitation(tenant.id, email, role, user.id)
    },
    onSuccess: () => {
      setEmail('')
      void qc.invalidateQueries({ queryKey: ['staff-invitations', tenant.id] })
    },
  })

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeStaffInvitation(tenant.id, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff-invitations', tenant.id] }),
  })

  const baseUrl = getPublicSiteUrl()

  return (
    <AdminPage title="Team & Einladungen">
      <p className="mb-ds-lg max-w-2xl text-ds-sm text-text-secondary">
        Einladungen für Küche oder Fahrer. Nach dem Login mit derselben E-Mail kann die Einladung
        unter dem Link angenommen werden. E-Mail-Versand erfolgt später (Resend); vorerst Link
        kopieren.
      </p>

      <section className="mb-ds-xl max-w-xl rounded-md border border-brand-cream-darker bg-bg-secondary p-ds-lg">
        <h2 className="font-heading text-ds-lg text-navy">Neue Einladung</h2>
        <div className="mt-ds-md space-y-ds-md">
          <div>
            <label className="text-ds-sm font-medium text-navy" htmlFor="invite-email">
              E-Mail
            </label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-ds-xs"
              placeholder="mitarbeiter@example.com"
            />
          </div>
          <div>
            <label className="text-ds-sm font-medium text-navy" htmlFor="invite-role">
              Rolle
            </label>
            <select
              id="invite-role"
              className="mt-ds-xs w-full min-h-[44px] rounded-sm border border-brand-cream-darker bg-bg-primary px-ds-md py-ds-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as 'kitchen' | 'driver')}
            >
              <option value="kitchen">Küche</option>
              <option value="driver">Fahrer</option>
            </select>
          </div>
          <Button
            type="button"
            disabled={!email.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Einladung erstellen
          </Button>
          {createMut.isError ? (
            <p className="text-ds-sm text-[color:var(--color-error)]">
              {(createMut.error as Error).message}
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="font-heading text-ds-lg text-navy">Offene & vergangene Einladungen</h2>
        {isLoading ? (
          <p className="mt-ds-md text-text-secondary">Lade…</p>
        ) : (
          <ul className="mt-ds-md space-y-ds-md">
            {rows.map((r) => {
              const link = `${baseUrl.replace(/\/$/, '')}/invite/${r.token}`
              const pending = !r.accepted_at
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-ds-sm rounded-md border border-brand-cream-darker bg-bg-secondary p-ds-md md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-navy">{r.email}</p>
                    <p className="text-ds-sm text-text-secondary">
                      Rolle: {r.role === 'kitchen' ? 'Küche' : 'Fahrer'} ·{' '}
                      {pending ? (
                        <>läuft ab {new Date(r.expires_at).toLocaleDateString('de-DE')}</>
                      ) : (
                        <>angenommen {new Date(r.accepted_at!).toLocaleString('de-DE')}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-ds-sm">
                    {pending ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await navigator.clipboard.writeText(link)
                            setCopied(r.id)
                            window.setTimeout(() => setCopied(null), 2000)
                          }}
                        >
                          {copied === r.id ? 'Kopiert' : 'Link kopieren'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (window.confirm('Einladung wirklich löschen?')) {
                              revokeMut.mutate(r.id)
                            }
                          }}
                        >
                          Entfernen
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
            {rows.length === 0 ? (
              <li className="text-ds-sm text-text-secondary">Noch keine Einladungen.</li>
            ) : null}
          </ul>
        )}
      </section>
    </AdminPage>
  )
}
