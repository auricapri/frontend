import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração específica para geração de documentação visual
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/documentation.spec.ts', '**/full-documentation.spec.ts', '**/complete-navigation.spec.ts', '**/user-flow.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Executa um teste por vez para evitar conflitos
  reporter: [
    ['html', { outputFolder: 'playwright-report-docs' }],
    ['list'],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: 'off',
    headless: false, // Abre o navegador visível
    slowMo: 100, // Adiciona delay para visualizar melhor
  },

  timeout: 60000, // 60 segundos de timeout para cada teste

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

