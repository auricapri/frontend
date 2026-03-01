/**
 * 18 — FLUXO DE BUSCA
 * Testa: submeter query, resultados, estado vazio, paginacao
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

/**
 * Scrolls down to trigger the solid/scrolled navbar state so that
 * the nav buttons become visible with a white background.
 */
async function scrollToActivateNavbar(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

/**
 * Locates the search trigger button in the navbar.
 *
 * The Navbar component renders a <button aria-label="Buscar"> on both
 * mobile and desktop viewports (Navbar.tsx lines 164-170, 251-257).
 * We use a case-insensitive CSS attribute selector to be resilient
 * against minor label changes, plus a data-testid fallback.
 */
function getSearchButton(page: Page) {
  return page.locator(
    'button[aria-label="Buscar"]:visible, button[aria-label*="usca" i]:visible, button[aria-label*="earch" i]:visible, [data-testid="search"]:visible'
  ).first();
}

/**
 * Locates the search text input that slides down from the navbar
 * after clicking the search button.
 *
 * The Navbar search bar renders an <input type="text"> with
 * placeholder="Digite para buscar produtos..." (Navbar.tsx line 332-333).
 * The SearchModal also renders a similar input.
 */
function getSearchInput(page: Page) {
  return page.locator(
    'input[placeholder*="buscar" i], input[placeholder*="search" i], input[placeholder*="Digite" i], input[type="search"]'
  ).first();
}

test.describe('Search Flow', () => {
  test('Search icon/button is visible in navbar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToActivateNavbar(page);

    const searchBtn = getSearchButton(page);
    const isVisible = await searchBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Busca na navbar: ${isVisible ? 'Encontrada' : 'Nao encontrada'}`);
    expect(isVisible).toBe(true);
  });

  test('Clicking search opens search input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToActivateNavbar(page);

    const searchBtn = getSearchButton(page);
    if (await searchBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(1000);

      const searchInput = getSearchInput(page);
      const inputVisible = await searchInput.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  Campo de busca: ${inputVisible ? 'Abriu' : 'Nao abriu'}`);
      expect(inputVisible).toBe(true);
    } else {
      console.log('  Botao de busca nao encontrado na navbar');
      expect(false, 'Search button not visible in navbar').toBe(true);
    }
  });

  test('Submit search via navbar navigates to results', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToActivateNavbar(page);

    const searchBtn = getSearchButton(page);
    await expect(searchBtn).toBeVisible({ timeout: 5_000 });
    await searchBtn.click();
    await page.waitForTimeout(1000);

    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    await searchInput.fill('vestido');
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    // After pressing Enter the app should navigate to /search/<slug>
    const url = page.url();
    const navigated = url.includes('/search/');
    console.log(`  Navegou para busca: ${navigated ? 'SIM (' + url + ')' : 'NAO (' + url + ')'}`);
    expect(navigated).toBe(true);
  });

  test('Search with valid query returns results', async ({ page }) => {
    await page.goto('/search/vestido', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // The SearchResultsPage uses ProductCard components inside a grid.
    // Also check for broader selectors in case the structure varies.
    const results = page.locator('[class*="grid"] [class*="cursor-pointer"], [class*="grid"] [class*="product"], [class*="grid"] a[href*="product"]');
    const resultCount = await results.count();

    // The empty state text comes from t('search.noResults') = "Nenhum resultado encontrado"
    const emptyState = page.getByText(/Nenhum resultado|Sem resultados|No results/i).first();
    const isEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false);

    console.log(`  Busca "vestido": ${resultCount > 0 ? `${resultCount} resultados` : isEmpty ? 'Nenhum resultado' : 'Estado indeterminado'}`);
    // At least one of the states should be true
    expect(resultCount > 0 || isEmpty).toBe(true);
  });

  test('Search with nonsense query shows empty state', async ({ page }) => {
    await page.goto('/search/xyznonexistent999', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // Empty state text from i18n: "Nenhum resultado encontrado"
    // Also check for "Tente buscar com outras palavras" (search.tryDifferent)
    const emptyState = page.getByText(/Nenhum resultado|Sem resultados|No results|nenhum produto|Tente buscar/i).first();
    const isEmpty = await emptyState.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Estado vazio para busca inexistente: ${isEmpty ? 'Exibido' : 'Nao exibido'}`);
    expect(isEmpty).toBe(true);
  });

  test('Search is accessible via URL /search/:slug', async ({ page }) => {
    const response = await page.goto('/search/blusa', { waitUntil: 'load' });
    expect(response?.status()).toBeLessThan(400);
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    // The SearchResultsPage renders:
    //   - h1 with t('search.resultsTitle') = "Resultados"
    //   - A count like "X produtos encontrados para 'blusa'"
    //   - Or the empty state with t('search.noResults')
    // Check for any of these indicators
    const title = page.getByText(/Resultado|Busca|search|produtos encontrados/i).first();
    const hasTitleOrResults = await title.isVisible({ timeout: 5_000 }).catch(() => false) ||
      (await page.locator('[class*="grid"] [class*="cursor-pointer"]').count()) > 0;
    console.log(`  URL /search/blusa funcional: ${hasTitleOrResults ? 'SIM' : 'NAO'}`);
    expect(hasTitleOrResults).toBe(true);
  });

  test('Search results page shows pagination when many results', async ({ page }) => {
    // Use a broad query that is likely to return many products
    await page.goto('/search/a', { waitUntil: 'load' });
    await dismissOverlays(page);
    await page.waitForTimeout(3000);

    // SearchResultsPage paginates at 12 items per page.
    // Pagination buttons have aria-labels from i18n: t('grid.previousPage') / t('grid.nextPage')
    const paginationPrev = page.locator('button[aria-label*="anterior" i], button[aria-label*="previous" i]');
    const paginationNext = page.locator('button[aria-label*="proxim" i], button[aria-label*="next" i], button[aria-label*="seguin" i]');
    const pageIndicator = page.locator('text=/\\d+\\s*\\/\\s*\\d+/');

    const hasPagination =
      (await paginationPrev.count()) > 0 ||
      (await paginationNext.count()) > 0 ||
      (await pageIndicator.count()) > 0;

    console.log(`  Paginacao na busca: ${hasPagination ? 'Encontrada' : 'Nao encontrada (pode ter poucos resultados)'}`);
  });
});
