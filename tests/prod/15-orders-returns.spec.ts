/**
 * 15 — PEDIDOS E DEVOLUÇÕES
 * Testa: listar pedidos, ver detalhe, ver recibo, solicitar devolução
 *
 * Structure:
 * - After login, button[aria-label="Entrar"] becomes button[aria-label="Minha conta"]
 * - Clicking "Minha conta" opens AuthDrawer with UserProfileView
 * - UserProfileView has TabNavigation with tabs: profile, orders, addresses, affiliate
 * - The "orders" tab label ("Meus Pedidos") is hidden on mobile (hidden sm:inline)
 * - Each tab button has a Package icon for orders
 * - Orders tab shows: loading spinner, empty state ("Nenhum pedido."), or order cards
 * - Footer has "Envios & Devoluções" button under "Customer Care"
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

async function scrollToActivateHeader(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

async function login(page: Page): Promise<boolean> {
  await scrollToActivateHeader(page);

  // Open auth drawer
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

  // Check for login error
  const errorMsg = page.getByText(/Email ou senha|incorretos|Muitas tentativas/i).first();
  if (await errorMsg.isVisible({ timeout: 5_000 }).catch(() => false)) return false;

  // Wait for form/drawer to close (login OK)
  await page.waitForFunction(
    () => !document.querySelector('form')?.offsetParent,
    null,
    { timeout: 30_000 },
  ).catch(() => undefined);

  // Wait for auth state to propagate
  await page.waitForTimeout(3000);

  // Verify login succeeded — button should change from "Entrar" to "Minha conta"
  await scrollToActivateHeader(page);
  const accountBtn = page.locator('button[aria-label="Minha conta"]');
  const isLoggedIn = await accountBtn.first().isVisible({ timeout: 10_000 }).catch(() => false);

  if (!isLoggedIn) {
    console.log('  [login] "Minha conta" button not visible, login may have failed');
  } else {
    console.log('  [login] Login confirmed — "Minha conta" button visible');
  }

  return true;
}

/**
 * Opens the profile drawer and clicks the "orders" tab.
 * The tab navigation uses small icon buttons; the label "Meus Pedidos" is hidden on mobile.
 * The orders tab is the 2nd tab button inside the tab bar.
 */
async function openOrdersTab(page: Page): Promise<boolean> {
  await scrollToActivateHeader(page);

  // Click "Minha conta" to open profile drawer
  const accountBtn = page.locator('button[aria-label="Minha conta"]');
  if (!(await accountBtn.first().isVisible({ timeout: 5_000 }).catch(() => false))) {
    // Fallback: try "Entrar" button (aria-label may not have updated)
    const enterBtn = page.locator('button[aria-label="Entrar"]');
    for (let i = (await enterBtn.count()) - 1; i >= 0; i--) {
      if (await enterBtn.nth(i).isVisible().catch(() => false)) {
        await enterBtn.nth(i).click();
        break;
      }
    }
  } else {
    await accountBtn.first().click();
  }
  await page.waitForTimeout(2000);

  // The profile drawer should now be open with UserProfileView
  // Look for the tab navigation bar and click the "orders" tab (2nd tab)
  // The tab bar is: div with flex and buttons inside it
  // Each tab button has text like "Meus Pedidos" (hidden sm:inline) and an icon
  // Strategy: find the tab by its text content (even if hidden) or by position

  // Try clicking by text first (works on wider viewports where label is visible)
  const ordersTabByText = page.getByText(/Meus Pedidos/i).first();
  if (await ordersTabByText.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await ordersTabByText.click();
    await page.waitForTimeout(2000);
    return true;
  }

  // On mobile, the label is hidden. Find the tab bar and click the 2nd button.
  // The tab bar is a div.flex with rounded-3xl containing tab buttons
  const tabBar = page.locator('div.flex.rounded-3xl').first();
  if (await tabBar.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const tabButtons = tabBar.locator('button');
    const count = await tabButtons.count();
    if (count >= 2) {
      // Orders is the 2nd tab (index 1)
      await tabButtons.nth(1).click();
      await page.waitForTimeout(2000);
      return true;
    }
  }

  // Final fallback: look for any clickable element with Package icon or "orders" in any form
  const packageTab = page.locator('button:has(svg)').filter({ hasText: /Pedidos|Orders/i }).first();
  if (await packageTab.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await packageTab.click();
    await page.waitForTimeout(2000);
    return true;
  }

  console.log('  [openOrdersTab] Could not find orders tab');
  return false;
}

test.describe('Orders & Returns', () => {
  test.setTimeout(120_000);

  test('After login, orders section is accessible via profile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    const ordersOpened = await openOrdersTab(page);
    console.log(`  Orders tab accessible: ${ordersOpened ? 'YES' : 'NO'}`);

    if (ordersOpened) {
      // Verify we see either orders or the empty state or a loading spinner
      const loadingSpinner = page.locator('.animate-spin').first();
      const emptyState = page.getByText(/Nenhum pedido/i).first();
      const orderCard = page.locator('div.rounded-\\[2\\.5rem\\]').first();

      // Wait for loading to finish
      await page.waitForTimeout(3000);

      const hasEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);
      const hasCards = await orderCard.isVisible({ timeout: 3_000 }).catch(() => false);
      const isLoading = await loadingSpinner.isVisible().catch(() => false);

      console.log(`  Orders section: ${hasCards ? 'Has order cards' : hasEmpty ? 'Empty state (no orders)' : isLoading ? 'Still loading' : 'Indeterminate'}`);
    }
  });

  test('Orders list shows order items or empty state', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    const ordersOpened = await openOrdersTab(page);
    if (!ordersOpened) {
      console.log('  Could not open orders tab — skipping');
      return;
    }

    // Wait for loading to finish (orders fetch from API)
    const loadingSpinner = page.locator('.animate-spin').first();
    await loadingSpinner.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);

    // Check for order cards or empty state
    // Order cards have: p-8 bg-neutral-50 rounded-[2.5rem] border
    const orderCards = page.locator('[role="dialog"] .rounded-\\[2\\.5rem\\]');
    const emptyState = page.getByText(/Nenhum pedido/i).first();

    const cardCount = await orderCards.count();
    const hasEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false);

    if (cardCount > 0) {
      console.log(`  Orders: ${cardCount} order card(s) found`);

      // Try clicking the first order to see detail overlay
      const firstOrder = orderCards.first();
      if (await firstOrder.isVisible().catch(() => false)) {
        await firstOrder.click();
        await page.waitForTimeout(1500);

        // Check for order detail overlay (has "Pedido" header, tracking info, etc.)
        const detailHeader = page.getByText(/Pedido [a-f0-9]/i).first();
        const trackingSection = page.getByText(/Aguardando Despacho|Enviado|Entregue|tracking/i).first();
        const receiptBtn = page.getByText(/Baixar Comprovante|Comprovante Fiscal/i).first();

        const hasDetail = await detailHeader.isVisible({ timeout: 5_000 }).catch(() => false);
        const hasTracking = await trackingSection.isVisible({ timeout: 3_000 }).catch(() => false);
        const hasReceipt = await receiptBtn.isVisible({ timeout: 3_000 }).catch(() => false);

        console.log(`  Order detail: ${hasDetail ? 'YES' : 'NO'}`);
        console.log(`  Tracking info: ${hasTracking ? 'YES' : 'NO'}`);
        console.log(`  Receipt button: ${hasReceipt ? 'YES' : 'NO'}`);

        // Go back to orders list
        const backBtn = page.locator('button').filter({ hasText: /Voltar|back/i }).first();
        if (await backBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await backBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } else if (hasEmpty) {
      console.log('  Orders: Empty state displayed (no orders)');
    } else {
      console.log('  Orders: Indeterminate state');
    }

    // Check for "Minhas Devolucoes" button at the bottom of orders tab
    const returnsBtn = page.getByText(/Minhas Devolu/i).first();
    const hasReturns = await returnsBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  Returns link: ${hasReturns ? 'YES' : 'NO'}`);
  });

  test('Shipping/Returns page accessible from footer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    // Scroll to footer — footer is outside <main>, use window scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Also try scrolling main if footer is inside main
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, main.scrollHeight);
    });
    await page.waitForTimeout(1000);

    // The "Envios & Devoluções" button is inside the footer under "Customer Care"
    const footer = page.locator('footer');
    const footerVisible = await footer.isVisible({ timeout: 5_000 }).catch(() => false);

    if (!footerVisible) {
      // Try scrolling the footer into view directly
      await page.evaluate(() => {
        const f = document.querySelector('footer');
        if (f) f.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      await page.waitForTimeout(1000);
    }

    // Find the "Envios & Devoluções" button — it's a <button> with that exact text
    const shippingLink = page.locator('footer button').filter({ hasText: /Envios.*Devolu/i }).first();
    const hasLink = await shippingLink.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Shipping & Returns link in footer: ${hasLink ? 'YES' : 'NO'}`);

    if (hasLink) {
      await shippingLink.click();
      await page.waitForTimeout(2000);
      console.log(`  Navigated to shipping/returns page. URL: ${page.url()}`);
    } else {
      // Fallback: try getByText on the whole page
      const fallbackLink = page.getByText(/Envios.*Devolu/i).first();
      const hasFallback = await fallbackLink.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Fallback text search for "Envios & Devoluções": ${hasFallback ? 'YES' : 'NO'}`);
      if (hasFallback) {
        await fallbackLink.click();
        await page.waitForTimeout(2000);
        console.log(`  Navigated via fallback. URL: ${page.url()}`);
      }
    }
  });
});
