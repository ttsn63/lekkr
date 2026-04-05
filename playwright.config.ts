import { defineConfig, devices } from '@playwright/test'

/**
 * E2E gegen Vite dev/preview. In CI: `npm run build` + `vite preview`.
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (siehe CI-Workflow).
 */
const isCi = Boolean(process.env.CI)
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  (isCi ? 'http://127.0.0.1:4173' : 'http://127.0.0.1:5173')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 2 : undefined,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: isCi
    ? {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
