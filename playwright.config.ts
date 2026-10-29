import { defineConfig, devices } from '@playwright/test'

// Uses the Microsoft Edge that ships with Windows (channel: 'msedge'), so no browser download is needed.
// Set PW_CHANNEL=chromium after `npx playwright install chromium` to use the bundled browser instead.
const channel = process.env.PW_CHANNEL ?? 'msedge'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5175',
    locale: 'he-IL',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: channel === 'chromium' ? undefined : channel } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, channel: channel === 'chromium' ? undefined : channel }, testMatch: /layout\.spec/ },
  ],
  webServer: {
    command: 'npx vite --port 5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
