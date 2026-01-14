import { defineConfig, devices } from '@playwright/test';

const apiBaseUrl = process.env.PERF_API_BASE_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: './tests/performance',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 10 * 60 * 1000,
  reporter: [['line'], ['json', { outputFile: 'playwright-perf-results.json' }]],
  use: {
    baseURL: process.env.PERF_BASE_URL || 'http://localhost:3000',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:node',
      url: `${apiBaseUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      cwd: '../backend',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
