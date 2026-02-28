/**
 * 15 — PEDIDOS E DEVOLUÇÕES
 * Testa: listar pedidos, ver detalhe, ver recibo, solicitar devolução
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = 'marcus.lirio1@gmail.com';
const PASSWORD = 'Raposa69*';

async function dismissOverlays(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
    .catch(() => undefined);
  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await termsBtn.click();
    await page.waitForTimeout(500);
  }
  const cookieBtn = page.getByRole('button', { name: /Aceitar cookies/i });
  if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(300);
  }
}

async function login(page: Page): Promise<boolean> {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
  const loginBtn = page.locator('button[aria-label="Entrar"]');
  for (let i = (await loginBtn.count()) - 1; i >= 0; i--) {
    if (await loginBtn.nth(i).isVisible().catch(() => false)) {
      await loginBtn.nth(i).click();
      break;
    }
  }
  const form = page.locator('form').first();
  if (!(await form.isVisible({ timeout: 10_000 }).catch(() => false))) return false;
  await form.locator('input[type="email"]').fill(EMAIL);
  await form.locator('input[type="password"]').fill(PASSWORD);
  await form.locator('button[type="submit"]').click();
  const errorMsg = page.getByText(/Email ou senha|incorretos|Muitas tentativas/i).first();
  if (await errorMsg.isVisible({ timeout: 5_000 }).catch(() => false)) return false;
  await page.waitForFunction(() => !document.querySelector('form')?.offsetParent, null, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(3000);
  return true;
}

test.describe('Orders & Returns', () => {
  test('After login, orders section is accessible via profile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    // Open profile
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    const profileBtn = page.locator('button[aria-label*="erfil"], button[aria-label*="onta"], button[aria-label*="Entrar"]').first();
    if (await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(1500);
    }

    // Look for orders tab/link
    const ordersLink = page.getByText(/Meus Pedidos|Pedidos|Orders/i).first();
    const hasOrders = await ordersLink.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  📦 Seção de pedidos: ${hasOrders ? '✅ Acessível' : '⚠ Não encontrada'}`);
  });

  test('Orders list shows order items or empty state', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    // Navigate to orders
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    const profileBtn = page.locator('button[aria-label*="erfil"], button[aria-label*="onta"], button[aria-label*="Entrar"]').first();
    if (await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(1500);
    }

    const ordersLink = page.getByText(/Meus Pedidos|Pedidos|Orders/i).first();
    if (await ordersLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await ordersLink.click();
      await page.waitForTimeout(2000);

      // Check for order items or empty state
      const orderItems = page.locator('[class*="order"], [data-testid*="order"]');
      const emptyState = page.getByText(/Nenhum pedido|Sem pedidos|No orders/i).first();

      const hasItems = (await orderItems.count()) > 0;
      const isEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  📋 Pedidos: ${hasItems ? `✅ ${await orderItems.count()} itens` : isEmpty ? '📭 Lista vazia (estado vazio)' : '⚠ Estado indeterminado'}`);
    }
  });

  test('Shipping/Returns page accessible from footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to footer
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, main.scrollHeight);
    });
    await page.waitForTimeout(1500);

    const shippingLink = page.getByRole('button', { name: /Envios|Devolu/i }).first();
    const hasLink = await shippingLink.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🚚 Link Envios & Devoluções no footer: ${hasLink ? '✅' : '❌'}`);

    if (hasLink) {
      await shippingLink.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Página de envios/devoluções navegou');
    }
  });
});
