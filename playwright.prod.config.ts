import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for PRODUCTION testing
 * Targets: https://www.auricapri.com.br (store) & https://www.admin.auricapri.com.br (admin)
 * No local webServer needed — tests run against live deployments.
 */
export default defineConfig({
  testDir: './tests/prod',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report-prod' }],
    ['json', { outputFile: 'playwright-results-prod.json' }],
    ['list'],
  ],
  outputDir: 'test-results-prod',
  use: {
    baseURL: 'https://www.auricapri.com.br',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on-first-retry',
    headless: false,
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'store-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'store-mobile',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'admin-desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://admin.auricapri.com.br',
      },
    },
  ],
});
