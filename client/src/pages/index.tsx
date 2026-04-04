import { useLocation } from 'wouter'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'

export function IndexPage() {
  const [, navigate] = useLocation()

  return (
    <AppLayout>
      <div className="space-y-8 text-center">
        <h1 className="font-heading text-4xl font-bold text-navy md:text-5xl">
          Willkommen bei Lekkr
        </h1>
        <p className="mx-auto max-w-xl text-lg text-text-secondary">
          Multitenant Restaurant-Plattform – eine Codebasis, eigene Domain und Design pro
          Restaurant.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button type="button" size="lg" onClick={() => navigate('/menu')}>
            Zur Speisekarte
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            Anmelden
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
