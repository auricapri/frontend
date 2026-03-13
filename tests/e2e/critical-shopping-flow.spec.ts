import { test, expect } from '@playwright/test';
import { createFlowRecorder, trackApiRequests } from '../reporting/metrics';
import { createConfirmedE2EUser, loginViaAuthDrawer } from './helpers/auth';
import { ensureAtLeastOneProductWithStock } from './helpers/catalog';

test.describe('E2E - Compra e navegação crítica', () => {
  test.beforeAll(async () => {
    await ensureAtLeastOneProductWithStock({ minStock: 10 });
  });

  test('Home → Produto → Carrinho → Checkout (PIX) → Recibo', async ({ page }, testInfo) => {
    test.setTimeout(240000);

    const flow = createFlowRecorder(testInfo);
    const api = trackApiRequests(page);

    await flow.step('Abrir home', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    });

    await flow.step('Esperar grid de produtos', async () => {
      await page
        .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 60000 })
        .catch(() => undefined);
      const firstProduct = page.locator('#collection [class*="columns"] .cursor-pointer.group').first();
      await expect(firstProduct).toBeVisible({ timeout: 90000 });
    });

    await flow.screenshot(page, 'home');

    await flow.step('Autenticar (para liberar checkout)', async () => {
      const creds = await createConfirmedE2EUser();
      await loginViaAuthDrawer(page, creds);
    });

    await flow.step('Abrir produto com estoque', async () => {
      const cards = page.locator('#collection [class*="columns"] .cursor-pointer.group');
      for (let i = 0; i < 8; i += 1) {
        await cards.nth(i).locator('div[class*="aspect-[3/4]"]').first().click();
        await expect(page).toHaveURL(/\/product\//, { timeout: 30000 });

        const add = page.locator('button.bg-black.text-white').first();
        await expect(add).toBeVisible({ timeout: 30000 });
        if (await add.isEnabled().catch(() => false)) return;

        await page.goBack();
        await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
      }

      throw new Error('Could not find an addable product');
    });

    await flow.screenshot(page, 'produto');

    await flow.step('Selecionar tamanho (se necessário)', async () => {
      const sizeLabel = page.getByText(/^tamanho$/i);
      if (await sizeLabel.first().isVisible().catch(() => false)) {
        const sizeButtons = page
          .locator('button')
          .filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|ÚNICO|36|38|40|42|44|46)$/i });
        if (await sizeButtons.count()) {
          await sizeButtons.first().click();
        }
      }
    });

    await flow.step('Adicionar à bolsa', async () => {
      const add = page.locator('button.bg-black.text-white').first();
      await expect(add).toBeVisible({ timeout: 30000 });
      await add.click();
      await expect(page.getByRole('button', { name: 'Close drawer', exact: true })).toBeVisible({ timeout: 30000 });
    });

    await flow.step('Ir para checkout', async () => {
      const cartDrawer = page
        .getByRole('button', { name: 'Close drawer', exact: true })
        .locator('xpath=ancestor::div[contains(@class,"fixed")][1]');

      const checkout = cartDrawer.locator('button.w-full.bg-black.text-white');
      await expect(checkout).toBeVisible({ timeout: 30000 });
      await checkout.click();
      await expect(page.getByRole('button', { name: /Confirmar e Pagar/i })).toBeVisible({ timeout: 30000 });
    });

    await flow.screenshot(page, 'checkout-step-1');

    await flow.step('Preencher endereço e confirmar', async () => {
      const cep = page.locator('input[placeholder="00000-000"]').first();
      await expect(cep).toBeVisible({ timeout: 30000 });
      await cep.fill('01310100');

      const numero = page.locator('input[placeholder="Ex: 123"], input[placeholder="Ex\: 123"]').first();
      await expect(numero).toBeVisible({ timeout: 60000 });
      await numero.fill('123');

      const phone = page.locator('input[placeholder*="99999" i], input[placeholder*="Telefone" i]').first();
      if (await phone.count()) {
        await phone.fill('(11) 99999-9999');
      }

      const confirm = page.getByRole('button', { name: /Confirmar e Pagar/i });
      await expect(confirm).toBeEnabled({ timeout: 60000 });
      await confirm.click();
    });

    await flow.screenshot(page, 'checkout-step-2');

    await flow.step('Escolher PIX e revisar', async () => {
      await page.getByRole('button', { name: /PIX Instantâneo/i }).click();
      await page.getByRole('button', { name: /Revisar Pedido/i }).click();
      await expect(page.getByRole('button', { name: /CONCLUIR COMPRA/i })).toBeVisible({ timeout: 30000 });
    });

    await flow.screenshot(page, 'checkout-step-3');

    await flow.step('Concluir compra e validar recibo', async () => {
      await page.getByRole('button', { name: /CONCLUIR COMPRA/i }).click();
      await expect(page).toHaveURL(/\/receipt$/, { timeout: 60000 });
      await expect(page.locator('#receipt-container')).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/Confirmado/i)).toBeVisible({ timeout: 30000 });
    });

    await flow.screenshot(page, 'recibo');

    await api.attach(testInfo);
    await flow.flush();
  });
});
