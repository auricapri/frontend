import { test, expect, Page } from '@playwright/test';
import { createFlowRecorder, trackApiRequests } from '../reporting/metrics';
import { createConfirmedE2EUser, loginViaAuthDrawer } from './helpers/auth';
import { ensureAtLeastOneProductWithStock } from './helpers/catalog';

async function closeBlockingDrawer(page: Page) {
  const close = page.getByRole('button', { name: 'Close drawer', exact: true });
  if (await close.first().isVisible().catch(() => false)) {
    await close.first().click({ force: true }).catch(() => null);
    await expect(close).toHaveCount(0);
  }
}

test.describe('E2E - Wishlist compartilhada e compra presente', () => {
  test.beforeAll(async () => {
    await ensureAtLeastOneProductWithStock({ minStock: 10 });
  });

  test('Login → Favoritar → Gerar link → Abrir wishlist compartilhada → Comprar curadoria', async ({ page }, testInfo) => {
    test.setTimeout(300000);

    const flow = createFlowRecorder(testInfo);
    const api = trackApiRequests(page);
    const dialogs: string[] = [];

    page.on('dialog', async d => {
      dialogs.push(d.message());
      await d.accept();
    });

    await flow.step('Abrir home', async () => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('nav').first()).toBeVisible({ timeout: 30000 });
    });

    await flow.step('Autenticar (signup/login)', async () => {
      const creds = await createConfirmedE2EUser();
      await loginViaAuthDrawer(page, creds);
      await closeBlockingDrawer(page);
    });

    await flow.step('Abrir produto com estoque', async () => {
      const cards = page.locator('#collection [class*="columns"] .cursor-pointer.group');
      for (let i = 0; i < 8; i += 1) {
        const card = cards.nth(i);
        await expect(card).toBeVisible({ timeout: 30000 });
        await card.locator('div[class*="aspect-[3/4]"]').first().click();
        await expect(page).toHaveURL(/\/product\//, { timeout: 30000 });

        const add = page.locator('button.bg-black.text-white').first();
        await expect(add).toBeVisible({ timeout: 30000 });
        if (await add.isEnabled().catch(() => false)) return;

        await page.goBack();
        await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
      }

      throw new Error('Could not find an addable product');
    });

    await flow.screenshot(page, 'wishlist-produto');

    await flow.step('Adicionar item à wishlist', async () => {
      const toggle = page.locator('div.pt-6.border-t.border-neutral-100.bg-white').getByRole('button', { name: 'Toggle wishlist' });
      await expect(toggle).toBeVisible({ timeout: 30000 });
      await toggle.click();
    });

    await flow.step('Abrir drawer de wishlist', async () => {
      await page.getByRole('button', { name: 'Wishlist', exact: true }).click({ force: true });
      await expect(page.getByText(/Favoritos/i)).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(/Sua lista está vazia/i)).toHaveCount(0);
    });

    await flow.screenshot(page, 'wishlist-drawer');

    let shareSlug: string | null = null;

    await flow.step('Gerar link de compartilhamento', async () => {
      const respPromise = page.waitForResponse(
        res => res.url().includes('/api/wishlist/share') && res.request().method() === 'GET',
        { timeout: 15000 }
      ).catch(() => null);

      const copyLink = page.locator('button[title="Copiar Link de Presente"]').first();
      await expect(copyLink).toBeVisible({ timeout: 30000 });
      await copyLink.click();

      const resp = await respPromise;
      if (resp) {
        const json = await resp.json().catch(() => null);
        if (json?.shareSlug) shareSlug = String(json.shareSlug);
      }

      if (!shareSlug && dialogs.length > 0) {
        const last = dialogs[dialogs.length - 1];
        const match = last.match(/\/wishlist\/([a-zA-Z0-9_-]+)/);
        if (match) shareSlug = match[1];
      }
    });

    await flow.step('Abrir wishlist compartilhada', async () => {
      expect(shareSlug, 'shareSlug deve ser gerado via /api/wishlist/share').toBeTruthy();
      await page.goto(`/wishlist/${shareSlug}`);
      await expect(page.getByText(/Wishlist Compartilhada/i)).toBeVisible({ timeout: 30000 });
      await expect(page.locator('img').first()).toBeVisible();
    });

    await flow.screenshot(page, 'wishlist-compartilhada');

    await flow.step('Comprar toda a curadoria (checkout interno)', async () => {
      const buyAll = page.getByRole('button', { name: /Comprar Toda a Curadoria/i });
      await expect(buyAll).toBeEnabled({ timeout: 30000 });
      await buyAll.click();

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

      await page.getByRole('button', { name: /PIX Instantâneo/i }).click();
      await page.getByRole('button', { name: /Revisar Pedido/i }).click();
      await page.getByRole('button', { name: /CONCLUIR COMPRA/i }).click();

      await expect(page).toHaveURL(/\/receipt$/, { timeout: 60000 });
      await expect(page.locator('#receipt-container')).toBeVisible({ timeout: 30000 });
    });

    await flow.screenshot(page, 'wishlist-compra-concluida');

    await testInfo.attach('dialogs', {
      body: Buffer.from(JSON.stringify({ dialogs }, null, 2), 'utf8'),
      contentType: 'application/json',
    });

    await api.attach(testInfo);
    await flow.flush();
  });
});
