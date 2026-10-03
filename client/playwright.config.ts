import { defineConfig, devices } from '@playwright/test';

/**
 * One smoke test against the real app: the built client served by the
 * server, on a real MongoDB with the demo data. CI starts the server first
 * (see .github/workflows/ci.yml); locally run it the same way and point
 * E2E_BASE_URL at it.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'he-IL',
    trace: 'retain-on-failure',
    // A preinstalled Chromium instead of Playwright's own download, if given
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
