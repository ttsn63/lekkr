import { useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/i18n/LocaleProvider'

export function HomeHero() {
  const [, navigate] = useLocation()
  const { t } = useLocale()

  return (
    <section className="relative overflow-hidden rounded-md border border-brand-cream-darker bg-gradient-to-br from-navy via-navy-light to-navy-dark px-ds-lg py-ds-3xl text-center text-text-light shadow-lg md:px-ds-2xl md:py-16">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-mint/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-brand-red/20 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-2xl space-y-ds-lg">
        <h1 className="font-heading text-ds-3xl font-bold tracking-tight md:text-5xl">{t('home.hero.title')}</h1>
        <p className="text-ds-lg text-text-light/90 md:text-ds-xl">{t('home.hero.subtitle')}</p>
        <div className="flex flex-wrap justify-center gap-ds-md pt-ds-sm">
          <Button type="button" size="lg" onClick={() => navigate('/menu')}>
            {t('home.hero.cta')}
          </Button>
        </div>
      </div>
    </section>
  )
}
