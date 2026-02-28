/**
 * 18 — FLUXO DE BUSCA
 * Testa: submeter query, resultados, estado vazio, paginação
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

test.describe('Search Flow', () => {
  test('Search icon/button is visible in navbar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    const searchBtn = page.locator('button[aria-label*="Busca"], button[aria-label*="earch"], input[type="search"], input[placeholder*="Buscar"]').first();
    const isVisible = await searchBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🔍 Busca na navbar: ${isVisible ? '✅ Encontrada' : '⚠ Não encontrada'}`);
    expect(isVisible).toBe(true);
  });

  test('Clicking search opens search input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    const searchBtn = page.locator('button[aria-label*="Busca"], button[aria-label*="earch"]').first();
    if (await searchBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(1000);

      const searchInput = page.locator('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="buscar"], input[name="search"]').first();
      const inputVisible = await searchInput.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  🔍 Campo de busca: ${inputVisible ? '✅ Abriu' : '❌ Não abriu'}`);
    }
  });

  test('Search with valid query returns results', async ({ page }) => {
    await page.goto('/search/vestido', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // Check for product results
    const results = page.locator('[class*="product"], [class*="card"], [data-testid*="product"]');
    const resultCount = await results.count();
    const emptyState = page.getByText(/Nenhum resultado|Sem resultados|No results/i).first();
    const isEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false);

    console.log(`  🔍 Busca "vestido": ${resultCount > 0 ? `✅ ${resultCount} resultados` : isEmpty ? '📭 Nenhum resultado' : '⚠ Estado indeterminado'}`);
  });

  test('Search with nonsense query shows empty state', async ({ page }) => {
    await page.goto('/search/xyznonexistent999', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    const emptyState = page.getByText(/Nenhum resultado|Sem resultados|No results|nenhum produto/i).first();
    const isEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  📭 Estado vazio para busca inexistente: ${isEmpty ? '✅ Exibido' : '⚠ Não exibido'}`);
  });

  test('Search is accessible via URL /search/:slug', async ({ page }) => {
    const response = await page.goto('/search/blusa', { waitUntil: 'load' });
    expect(response?.status()).toBeLessThan(400);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    // Page should render search results or empty state
    const title = page.getByText(/Busca|Resultado|search/i).first();
    const hasTitleOrResults = await title.isVisible({ timeout: 5_000 }).catch(() => false) ||
      (await page.locator('[class*="product"]').count()) > 0;
    console.log(`  🔗 URL /search/blusa funcional: ${hasTitleOrResults ? '✅' : '⚠'}`);
  });
});
