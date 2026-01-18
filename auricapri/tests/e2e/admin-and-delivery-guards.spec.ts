import { test, expect } from '@playwright/test';
import { createFlowRecorder, trackApiRequests } from '../reporting/metrics';

test.describe('E2E - Guardas de Admin e Delivery', () => {
  test('Acesso a /admin exige login', async ({ page }, testInfo) => {
    const flow = createFlowRecorder(testInfo);
    const api = trackApiRequests(page, { onlyApi: false });

    await flow.step('Abrir /admin', async () => {
      await page.goto('/admin', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/admin(\/login)?$/);
    });

    await flow.screenshot(page, 'admin-guard');
    await api.attach(testInfo);
    await flow.flush();
  });

  test('Acesso a /admin/delivery exige login', async ({ page }, testInfo) => {
    const flow = createFlowRecorder(testInfo);
    const api = trackApiRequests(page, { onlyApi: false });

    await flow.step('Abrir /admin/delivery', async () => {
      await page.goto('/admin/delivery', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/admin\/delivery(\/login)?$/);
    });

    await flow.screenshot(page, 'delivery-guard');
    await api.attach(testInfo);
    await flow.flush();
  });
});
