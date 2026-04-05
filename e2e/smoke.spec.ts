import { test, expect } from '@playwright/test'

/**
 * Smoke: Shell lädt (Lekkr-Header), kein weißer Bildschirm.
 * Supabase-Calls können fehlschlagen – Inhalt kann Fehlermeldungen zeigen.
 */
test.describe('Öffentliche Routen', () => {
  const paths = [
    '/',
    '/menu',
    '/cart',
    '/login',
    '/coupons',
    '/orders',
    '/tracking',
    '/profile',
    '/impressum',
    '/datenschutz',
    '/agb',
    '/admin/login',
    '/confirmation',
    '/invite/demo-token',
  ]

  for (const path of paths) {
    test(`GET ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(res?.ok() ?? false).toBeTruthy()
      await expect(page.locator('body')).toBeVisible()
      await expect(page.getByText(/Lekkr/i).first()).toBeVisible()
    })
  }

  test('Produkt-Detail (ungültige ID → NotFound-Text)', async ({ page }) => {
    await page.goto('/product/00000000-0000-0000-0000-000000000099', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Lekkr/i).first()).toBeVisible()
    await expect(
      page.getByText(/Produkt nicht gefunden|Product not found|Ürün bulunamadı/i),
    ).toBeVisible()
  })
})

test.describe('Cookie-Banner', () => {
  test('erscheint bis zur Entscheidung (localStorage leeren)', async ({ page, context }) => {
    await context.clearCookies()
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('lekkr_cookie_consent_v1')
      } catch {
        /* ignore */
      }
    })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('dialog', { name: /Cookie/i })).toBeVisible()
  })
})
