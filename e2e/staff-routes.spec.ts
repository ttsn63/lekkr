import { test, expect } from '@playwright/test'

/**
 * Geschützte Bereiche: Seite lädt, ggf. Hinweis auf Login/Berechtigung.
 */
test.describe('Küche / Fahrer / Admin (ohne Session)', () => {
  for (const path of ['/kitchen', '/driver', '/admin/dashboard']) {
    test(`GET ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(res?.ok() ?? false).toBeTruthy()
      await expect(page.locator('body')).toBeVisible()
    })
  }
})
