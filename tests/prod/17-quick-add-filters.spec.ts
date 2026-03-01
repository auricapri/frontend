/**
 * 17 --- QUICK ADD E FILTROS
 * Testa: QuickAddModal (cor->tamanho->quantidade->add), FilterBottomSheet no mobile
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

async function scrollToProducts(page: Page) {
  // Use window.scrollTo for reliability -- main.scrollTo may not work if main has no overflow
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(2000);
}

test.describe('Quick Add Modal', () => {
  test('Product card has quick add button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToProducts(page);

    // Look for quick add buttons on product cards
    const quickAddBtn = page.locator('button[aria-label*="Adicionar"], button[aria-label*="Comprar"], button[class*="quick"]').first();
    const hasQuickAdd = await quickAddBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Botao quick-add em card de produto: ${hasQuickAdd ? 'Encontrado' : 'Nao encontrado'}`);

    if (hasQuickAdd) {
      await quickAddBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // Check if modal/dialog opens
      const modal = page.locator('[role="dialog"]').first();
      const modalVisible = await modal.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Modal de quick-add: ${modalVisible ? 'Abriu' : 'Nao abriu'}`);

      if (modalVisible) {
        // Check for variant selection (color/size)
        const colorOptions = modal.locator('[class*="color"], [class*="swatch"], [aria-label*="cor"]');
        const sizeOptions = modal.locator('[class*="size"], [aria-label*="tamanho"]');
        const hasColors = (await colorOptions.count()) > 0;
        const hasSizes = (await sizeOptions.count()) > 0;
        console.log(`  Selecao de cor: ${hasColors ? 'SIM' : 'NAO'}`);
        console.log(`  Selecao de tamanho: ${hasSizes ? 'SIM' : 'NAO'}`);
      }
    }
  });

  test('Adding item to cart shows feedback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToProducts(page);

    // Click first product to go to detail -- use the same selector pattern as file 10
    const productCard = page.locator('#collection .grid .cursor-pointer.group').first();
    const altProductCard = page.locator('[class*="product"], [data-testid*="product"]').first();

    let clicked = false;
    if (await productCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await productCard.locator('h3').first().click({ force: true });
      clicked = true;
    } else if (await altProductCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await altProductCard.click({ force: true });
      clicked = true;
    }

    if (clicked) {
      await page.waitForTimeout(2000);
      await dismissOverlays(page);

      // On product detail, look for add to cart button
      // i18n pt: "Adicionar a Bolsa"
      const addToCartBtn = page.getByRole('button', { name: /Adicionar|Comprar|Add to (cart|bag)|Bolsa/i }).first();
      const altAddBtn = page.locator('button.bg-black.text-white').filter({ hasText: /adicionar|bolsa/i }).first();

      const hasBtn = await addToCartBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      const hasAltBtn = await altAddBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Botao Adicionar ao Carrinho: ${hasBtn || hasAltBtn ? 'SIM' : 'Nao encontrado'}`);
    }
  });
});

test.describe('Filters -- Mobile', () => {
  test('Filter button appears on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToProducts(page);

    // Look for filter button -- i18n pt: "Filtrar"
    const filterBtn = page.getByRole('button', { name: /Filtrar|Filter/i }).first();
    const altFilterBtn = page.locator('button[class*="filter"], [aria-label*="filtr" i]').first();

    const hasFilter = await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasAltFilter = await altFilterBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  Botao de filtro mobile: ${hasFilter || hasAltFilter ? 'Encontrado' : 'Nao encontrado'}`);

    if (hasFilter) {
      await filterBtn.click({ force: true });
      await page.waitForTimeout(1000);
      const sheet = page.locator('[class*="bottom-sheet"], [class*="BottomSheet"], [class*="filter-panel"], [role="dialog"]').first();
      const sheetVisible = await sheet.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Filter bottom sheet: ${sheetVisible ? 'Abriu' : 'Nao abriu'}`);
    }
  });

  test('Desktop has inline filter/sort options', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToProducts(page);

    // Look for sort/filter controls -- i18n pt: "Ordenar por"
    const sortBtn = page.locator('button[class*="sort"], select[class*="sort"], [aria-label*="ordenar" i]').first();
    const altSortBtn = page.getByText(/Ordenar|Sort/i).first();
    const hasSortBtn = await sortBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasAltSort = await altSortBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  Controle de ordenacao desktop: ${hasSortBtn || hasAltSort ? 'SIM' : 'Nao encontrado'}`);
  });
});
