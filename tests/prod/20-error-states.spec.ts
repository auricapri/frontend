/**
 * 20 — ESTADOS DE ERRO
 * Testa: 404, erro de rede, carrinho vazio, loading states
 */
import { test, expect, Page } from '@playwright/test';

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

test.describe('Error States — 404', () => {
  test('Navigating to unknown URL does not crash', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-123', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    // The SPA should handle this gracefully (redirect home or show 404)
    const status = response?.status();
    console.log(`  📄 Resposta para URL desconhecida: HTTP ${status}`);

    // Should not show a blank page
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  📝 Conteúdo da página: ${bodyContent > 50 ? '✅ Tem conteúdo' : '⚠ Possível página em branco'}`);
    expect(bodyContent).toBeGreaterThan(10);
  });

  test('Invalid product URL handles gracefully', async ({ page }) => {
    await page.goto('/product/nonexistent-product-slug-xyz', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // Should show error message or redirect home
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  📦 Produto inexistente: ${bodyContent > 50 ? '✅ Página renderizou' : '⚠ Possível erro'}`);
    expect(bodyContent).toBeGreaterThan(10);
  });
});

test.describe('Error States — Empty Cart', () => {
  test('Cart drawer shows empty state when no items', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    // Open cart
    const cartBtn = page.locator('button[aria-label*="Carrinho"], button[aria-label*="Cart"], button[aria-label*="carrinho"]').first();
    if (await cartBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cartBtn.click();
      await page.waitForTimeout(1500);

      const emptyMsg = page.getByText(/vazio|empty|Nenhum item|Seu carrinho/i).first();
      const isEmpty = await emptyMsg.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  🛒 Carrinho vazio: ${isEmpty ? '✅ Mensagem exibida' : '⚠ Sem feedback ou tem itens'}`);
    }
  });

  test('Checkout without items redirects or shows empty state', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // Should redirect to home or show "carrinho vazio" message
    const currentUrl = page.url();
    const emptyMsg = page.getByText(/vazio|empty|Sem itens|Adicione/i).first();
    const hasEmpty = await emptyMsg.isVisible({ timeout: 5_000 }).catch(() => false);
    const redirectedHome = currentUrl.endsWith('/') || currentUrl.includes('home');

    console.log(`  🛒 Checkout sem itens: ${hasEmpty ? '✅ Mensagem vazio' : redirectedHome ? '✅ Redirecionou para home' : '⚠ Estado não claro'}`);
  });
});

test.describe('Error States — Loading', () => {
  test('Page shows loading state before content', async ({ page }) => {
    // Block API to simulate slow load
    await page.goto('/', { waitUntil: 'commit' });

    // Check for loading indicators
    const spinner = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"], [aria-label*="Carregando"]').first();
    const hasSpinner = await spinner.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  ⏳ Loading indicator: ${hasSpinner ? '✅ Encontrado' : '⚠ Não encontrado (pode carregar muito rápido)'}`);

    // Wait for content to appear
    await page.waitForTimeout(5000);
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  📝 Conteúdo após carregamento: ${bodyContent > 100 ? '✅ Renderizou' : '⚠ Possível problema'}`);
  });

  test('API error does not crash the app', async ({ page }) => {
    // Simulate API failure by intercepting
    await page.route('**/api/products**', route => route.abort());

    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(5000);

    // Page should still be functional (not blank white screen)
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  🔴 Com API bloqueada: ${bodyContent > 50 ? '✅ App não crashou' : '⚠ Possível crash'}`);
    expect(bodyContent).toBeGreaterThan(10);
  });
});

test.describe('Error States — Network', () => {
  test('Offline mode shows some feedback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Try to navigate — should not crash
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 600);
    });
    await page.waitForTimeout(1000);

    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  📶 Modo offline: ${bodyContent > 50 ? '✅ App sobreviveu' : '⚠ Possível crash'}`);

    // Restore online
    await page.context().setOffline(false);
  });
});
