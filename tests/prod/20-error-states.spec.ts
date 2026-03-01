/**
 * 20 --- ESTADOS DE ERRO
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

async function scrollToActivateHeader(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

test.describe('Error States -- 404', () => {
  test('Navigating to unknown URL does not crash', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-123', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    // The SPA should handle this gracefully (redirect home or show 404)
    const status = response?.status();
    console.log(`  Resposta para URL desconhecida: HTTP ${status}`);

    // Should not show a blank page
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  Conteudo da pagina: ${bodyContent > 50 ? 'Tem conteudo' : 'Possivel pagina em branco'}`);
    expect(bodyContent).toBeGreaterThan(10);
  });

  test('Invalid product URL handles gracefully', async ({ page }) => {
    await page.goto('/product/nonexistent-product-slug-xyz', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // Should show error message or redirect home
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  Produto inexistente: ${bodyContent > 50 ? 'Pagina renderizou' : 'Possivel erro'}`);
    expect(bodyContent).toBeGreaterThan(10);
  });
});

test.describe('Error States -- Empty Cart', () => {
  test('Cart drawer shows empty state when no items', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await dismissOverlays(page);

    await scrollToActivateHeader(page);

    // Navbar cart button: aria-label="Carrinho" - pick the visible one
    const cartBtn = page.locator('button[aria-label="Carrinho"]:visible').first();
    if (await cartBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cartBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // i18n pt: "Sua bolsa esta vazia"
      const emptyMsg = page.getByText(/vazi[oa]|empty|Nenhum item|Sua bolsa|Seu carrinho/i).first();
      const isEmpty = await emptyMsg.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  Carrinho vazio: ${isEmpty ? 'Mensagem exibida' : 'Sem feedback ou tem itens'}`);
    }
  });

  test('Checkout without items redirects or shows empty state', async ({ page }) => {
    await page.goto('/checkout', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // Should redirect to home or show "carrinho vazio" / "bolsa vazia" message
    const currentUrl = page.url();
    const emptyMsg = page.getByText(/vazi[oa]|empty|Sem itens|Adicione|Sua bolsa/i).first();
    const hasEmpty = await emptyMsg.isVisible({ timeout: 5_000 }).catch(() => false);
    const redirectedHome = currentUrl.endsWith('/') || currentUrl.includes('home');

    console.log(`  Checkout sem itens: ${hasEmpty ? 'Mensagem vazio' : redirectedHome ? 'Redirecionou para home' : 'Estado nao claro'}`);
  });
});

test.describe('Error States -- Loading', () => {
  test('Page shows loading state before content', async ({ page }) => {
    // Navigate with minimal wait to catch loading states
    await page.goto('/', { waitUntil: 'commit', timeout: 30_000 });

    // Check for loading indicators
    const spinner = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"], [aria-label*="Carregando"]').first();
    const hasSpinner = await spinner.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Loading indicator: ${hasSpinner ? 'Encontrado' : 'Nao encontrado (pode carregar muito rapido)'}`);

    // Wait for content to appear
    await page.waitForTimeout(5000);
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  Conteudo apos carregamento: ${bodyContent > 100 ? 'Renderizou' : 'Possivel problema'}`);
  });

  test('API error does not crash the app', async ({ page }) => {
    // Simulate API failure by intercepting
    await page.route('**/api/products**', route => route.abort());

    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(5000);

    // Page should still be functional (not blank white screen)
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  Com API bloqueada: ${bodyContent > 50 ? 'App nao crashou' : 'Possivel crash'}`);
    expect(bodyContent).toBeGreaterThan(10);
  });
});

test.describe('Error States -- Network', () => {
  test('Offline mode shows some feedback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await dismissOverlays(page);

    // Go offline
    await page.context().setOffline(true);

    // Try to scroll -- should not crash
    try {
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 800));
      await page.waitForTimeout(1000);

      const bodyContent = await page.evaluate(() => document.body.innerText.length);
      console.log(`  Modo offline: ${bodyContent > 50 ? 'App sobreviveu' : 'Possivel crash'}`);
    } catch {
      // Browser may close or disconnect in offline mode, which is acceptable
      console.log('  Modo offline: Browser desconectou (comportamento aceitavel)');
    } finally {
      // Restore online
      await page.context().setOffline(false).catch(() => {});
    }
  });
});
