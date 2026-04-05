import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { LocaleSwitcher } from '@/components/menu/LocaleSwitcher'
import { navLinkClass } from '@/components/layout/navStyles'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { useCartStore } from '@/store/cartStore'

type AppLayoutProps = {
  children: ReactNode
  title?: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const tenant = useTenant()
  const { t } = useLocale()
  const { user, loading, signOut } = useAuthSession()
  const [, navigate] = useLocation()
  const cartCount = useCartStore((s) => s.lines.reduce((a, l) => a + l.quantity, 0))
  const toggleCart = useCartStore((s) => s.toggleSidebar)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-brand-cream-dark bg-bg-secondary shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link href="/" className="font-heading text-xl font-semibold text-navy">
              Lekkr
            </Link>
            <p className="text-sm text-text-secondary">
              {tenant.slug}{' '}
              <span className="font-mono text-xs text-text-secondary/80">
                ({tenant.id.slice(0, 8)}…)
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LocaleSwitcher />
            <nav className="flex flex-wrap items-center gap-2">
              <Link href="/menu" className={navLinkClass}>
                {t('nav.menu')}
              </Link>
              <Link href="/coupons" className={navLinkClass}>
                {t('nav.coupons')}
              </Link>
              <Button type="button" variant="ghost" size="sm" onClick={toggleCart}>
                {t('nav.cart')}
                {cartCount > 0 ? (
                  <span className="ml-1 rounded-full bg-brand-red px-ds-xs py-ds-2xs text-ds-xs text-text-light">
                    {cartCount}
                  </span>
                ) : null}
              </Button>
              {loading ? (
                <span className="text-sm text-text-secondary">{t('nav.loading')}</span>
              ) : user ? (
                <>
                  <Link href="/profile" className={navLinkClass}>
                    {t('nav.profile')}
                  </Link>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" onClick={() => navigate('/login')}>
                  {t('nav.login')}
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      {title ? (
        <div className="border-b border-brand-cream-dark bg-bg-primary px-4 py-6">
          <div className="mx-auto max-w-5xl">
            <h1 className="font-heading text-3xl font-semibold text-navy">{title}</h1>
          </div>
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="mt-auto border-t border-brand-cream-dark bg-bg-secondary py-6 text-center text-sm text-text-secondary">
        © {new Date().getFullYear()} Lekkr
      </footer>
    </div>
  )
}
