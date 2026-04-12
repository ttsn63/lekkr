import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { LocaleSwitcher } from '@/components/menu/LocaleSwitcher'
import { getMobileNavLinkClass, getNavLinkClass } from '@/components/layout/navStyles'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useTenant } from '@/hooks/useTenant'
import { useLocale } from '@/i18n/LocaleProvider'
import { useCartStore } from '@/store/cartStore'

type AppLayoutProps = {
  children: ReactNode
  title?: string
  mainClassName?: string
}

export function AppLayout({ children, title, mainClassName = '' }: AppLayoutProps) {
  const tenant = useTenant()
  const { t } = useLocale()
  const { user, loading, signOut } = useAuthSession()
  const [location, navigate] = useLocation()
  const cartCount = useCartStore((s) => s.lines.reduce((a, l) => a + l.quantity, 0))
  const toggleCart = useCartStore((s) => s.toggleSidebar)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const isRouteActive = (route: string) => {
    if (route === '/') return location === '/'
    return location === route || location.startsWith(`${route}/`)
  }

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/menu', label: t('nav.menu') },
    { href: '/coupons', label: t('nav.coupons') },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-brand-cream-dark bg-bg-secondary shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
            <Link href="/" className="font-heading text-xl font-semibold text-navy">
              Lekkr
            </Link>
            <p className="text-sm text-text-secondary">
              {tenant.slug}{' '}
                <span className="hidden font-mono text-xs text-text-secondary/80 sm:inline">
                ({tenant.id.slice(0, 8)}…)
              </span>
            </p>
          </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={toggleCart}
              >
                {t('nav.cart')}
                {cartCount > 0 ? (
                  <span className="ml-1 rounded-full bg-brand-red px-ds-xs py-ds-2xs text-ds-xs text-text-light">
                    {cartCount}
                  </span>
                ) : null}
              </Button>
              <div className="hidden md:block">
                <LocaleSwitcher />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="md:hidden"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-site-nav"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              >
                <span className="sr-only">{isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}</span>
                <span aria-hidden="true" className="relative block h-4 w-5">
                  <span
                    className={`absolute left-0 top-0 h-0.5 w-5 bg-navy transition-transform duration-200 ${
                      isMobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[7px] h-0.5 w-5 bg-navy transition-opacity duration-200 ${
                      isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[14px] h-0.5 w-5 bg-navy transition-transform duration-200 ${
                      isMobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                    }`}
                  />
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-4 hidden items-center justify-between gap-3 md:flex">
            <nav className="flex flex-wrap items-center gap-2" aria-label="Main">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={getNavLinkClass(isRouteActive(link.href))}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-2">
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
                  <Link href="/profile" className={getNavLinkClass(isRouteActive('/profile'))}>
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
            </div>
          </div>

          {isMobileMenuOpen ? (
            <div id="mobile-site-nav" className="mt-4 border-t border-brand-cream-dark pt-4 md:hidden">
              <div className="mb-3">
                <LocaleSwitcher />
              </div>
              <nav className="flex flex-col gap-2" aria-label="Mobile">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={getMobileNavLinkClass(isRouteActive(link.href))}
                    onClick={closeMobileMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                {loading ? (
                  <span className="px-3 py-2 text-sm text-text-secondary">{t('nav.loading')}</span>
                ) : user ? (
                  <>
                    <Link
                      href="/profile"
                      className={getMobileNavLinkClass(isRouteActive('/profile'))}
                      onClick={closeMobileMenu}
                    >
                      {t('nav.profile')}
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        void signOut()
                        closeMobileMenu()
                      }}
                    >
                      {t('nav.logout')}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      navigate('/login')
                      closeMobileMenu()
                    }}
                  >
                    {t('nav.login')}
                  </Button>
                )}
              </nav>
            </div>
          ) : null}
        </div>
      </header>
      {title ? (
        <div className="border-b border-brand-cream-dark bg-bg-primary px-4 py-6">
          <div className="mx-auto max-w-5xl">
            <h1 className="font-heading text-3xl font-semibold text-navy">{title}</h1>
          </div>
        </div>
      ) : null}
      <main className={`mx-auto w-full max-w-5xl flex-1 px-4 py-8 ${mainClassName}`}>{children}</main>
      <footer className="mt-auto border-t border-brand-cream-dark bg-bg-secondary py-6 text-center text-sm text-text-secondary">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-2 px-4">
          <Link href="/impressum" className="underline hover:text-navy">
            Impressum
          </Link>
          <Link href="/datenschutz" className="underline hover:text-navy">
            Datenschutz
          </Link>
          <Link href="/agb" className="underline hover:text-navy">
            AGB
          </Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} Lekkr</p>
      </footer>
    </div>
  )
}
