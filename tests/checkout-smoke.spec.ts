import { test, expect } from '@playwright/test';

test.describe('Checkout smoke', () => {
  test('loads checkout and renders step headers', async ({ page }) => {
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /finalizar pedido/i })).toBeVisible();
    await expect(page.getByText(/endereço de entrega/i)).toBeVisible();
  });
});

