import { AppLayout } from '@/components/layout/AppLayout'
import { useTenantSettingsQuery } from '@/hooks/useTenantSettingsQuery'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { fetchTenantName } from '@/lib/queries/tenantSettings'
import { useQuery } from '@tanstack/react-query'

const DEFAULT_IMPRESSUM = `
<h2>Impressum</h2>
<p><strong>Angaben gemäß § 5 TMG</strong></p>
<p>Diese Vorlage ersetzt keine Rechtsberatung. Trage hier Firmenname, Anschrift, Kontakt, USt-ID und ggf. Registerdaten ein.</p>
<p>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: [Name, Anschrift]</p>
`

const DEFAULT_PRIVACY = `
<h2>Datenschutz</h2>
<p>Diese Datenschutzerklärung ist eine Platzhalter-Vorlage. Ergänze sie um deine konkreten Verarbeitungen (Hosting, Supabase, Stripe, Resend, Twilio, Analyse-Tools) und die Rechtsgrundlagen nach DSGVO.</p>
<p>Betroffenenrechte: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Beschwerde bei einer Aufsichtsbehörde.</p>
`

const DEFAULT_AGB = `
<h2>Allgemeine Geschäftsbedingungen (AGB)</h2>
<p>Platzhalter-AGB für Lekkr-Demo. Passe Vertragsgegenstand, Preise, Lieferung, Zahlung, Widerruf und Haftung an dein Angebot an.</p>
`

type Variant = 'impressum' | 'datenschutz' | 'agb'

const titles: Record<Variant, string> = {
  impressum: 'Impressum',
  datenschutz: 'Datenschutz',
  agb: 'AGB',
}

export function LegalPage({ variant }: { variant: Variant }) {
  const tenant = useTenant()
  const { t } = useLocale()
  const { data: settings } = useTenantSettingsQuery(tenant.id)

  const { data: tenantRow } = useQuery({
    queryKey: ['tenant-name', tenant.id],
    queryFn: () => fetchTenantName(tenant.id),
  })

  const custom =
    variant === 'impressum'
      ? settings?.legal_impressum
      : variant === 'datenschutz'
        ? settings?.legal_privacy
        : settings?.legal_terms

  const fallback =
    variant === 'impressum' ? DEFAULT_IMPRESSUM : variant === 'datenschutz' ? DEFAULT_PRIVACY : DEFAULT_AGB

  const displayName =
    settings?.company_display_name?.trim() ||
    tenantRow?.name ||
    tenant.slug

  const html = (typeof custom === 'string' && custom.trim().length > 0 ? custom : fallback).replace(
    /\{tenant_name\}/g,
    displayName,
  )

  return (
    <AppLayout title={titles[variant]}>
      <div className="mx-auto max-w-3xl px-ds-md py-ds-xl">
        <p className="mb-ds-lg text-ds-sm text-text-secondary">
          {t('legal.tenantLabel')}: <span className="font-mono text-ds-xs">{tenant.id}</span>
        </p>
        <article
          className="space-y-ds-md text-ds-base leading-relaxed text-text-primary [&_a]:text-navy [&_h2]:mt-ds-xl [&_h2]:font-heading [&_h2]:text-ds-xl [&_h2]:text-navy"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </AppLayout>
  )
}
