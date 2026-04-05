import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/products', label: 'Produkte' },
  { href: '/admin/categories', label: 'Kategorien' },
  { href: '/admin/orders', label: 'Bestellungen' },
  { href: '/admin/coupons', label: 'Coupons' },
  { href: '/admin/customers', label: 'Kunden' },
  { href: '/admin/settings', label: 'Einstellungen' },
  { href: '/admin/theme', label: 'Theme' },
] as const

type AdminLayoutProps = {
  title: string
  children: ReactNode
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const [loc] = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary md:flex-row">
      <aside className="border-b border-brand-cream-darker bg-navy text-text-light md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="p-ds-md">
          <p className="font-heading text-ds-lg font-semibold">Lekkr Admin</p>
          <p className="mt-ds-xs text-ds-xs opacity-80">Multitenant · tenant_id in allen Abfragen</p>
        </div>
        <nav className="flex flex-wrap gap-ds-xs px-ds-md pb-ds-md md:flex-col md:gap-0">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm px-ds-sm py-ds-xs text-ds-sm md:py-ds-sm ${
                loc === item.href || loc.startsWith(item.href + '/')
                  ? 'bg-white/15 font-medium'
                  : 'hover:bg-white/10'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-ds-md">
          <Link href="/" className="text-ds-sm text-brand-mint underline">
            ← Zur Website
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-ds-md w-full border border-white/20 text-text-light hover:bg-white/10"
            onClick={() => void supabase.auth.signOut()}
          >
            Abmelden
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-brand-cream-darker bg-bg-secondary px-ds-lg py-ds-md">
          <h1 className="font-heading text-ds-2xl font-semibold text-navy">{title}</h1>
        </header>
        <main className="p-ds-lg">{children}</main>
      </div>
    </div>
  )
}
