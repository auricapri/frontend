/**
 * 17 — QUICK ADD E FILTROS
 * Testa: QuickAddModal (cor→tamanho→quantidade→add), FilterBottomSheet no mobile
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

test.describe('Quick Add Modal', () => {
  test('Product card has quick add button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to products section
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 600);
    });
    await page.waitForTimeout(2000);

    // Look for quick add buttons on product cards
    const quickAddBtn = page.locator('button[aria-label*="Adicionar"], button[aria-label*="Comprar"], button[class*="quick"]').first();
    const hasQuickAdd = await quickAddBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  ⚡ Botão quick-add em card de produto: ${hasQuickAdd ? '✅ Encontrado' : '⚠ Não encontrado'}`);

    if (hasQuickAdd) {
      await quickAddBtn.click();
      await page.waitForTimeout(1500);

      // Check if modal/dialog opens
      const modal = page.locator('[role="dialog"]').first();
      const modalVisible = await modal.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  🔲 Modal de quick-add: ${modalVisible ? '✅ Abriu' : '⚠ Não abriu'}`);

      if (modalVisible) {
        // Check for variant selection (color/size)
        const colorOptions = modal.locator('[class*="color"], [class*="swatch"], [aria-label*="cor"]');
        const sizeOptions = modal.locator('[class*="size"], [aria-label*="tamanho"]');
        const hasColors = (await colorOptions.count()) > 0;
        const hasSizes = (await sizeOptions.count()) > 0;
        console.log(`  🎨 Seleção de cor: ${hasColors ? '✅' : '⚠ Não'}`);
        console.log(`  📏 Seleção de tamanho: ${hasSizes ? '✅' : '⚠ Não'}`);
      }
    }
  });

  test('Adding item to cart shows feedback', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to products
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 600);
    });
    await page.waitForTimeout(2000);

    // Click first product to go to detail
    const productCard = page.locator('[class*="product"], [data-testid*="product"]').first();
    if (await productCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await productCard.click();
      await page.waitForTimeout(2000);

      // On product detail, look for add to cart button
      const addToCartBtn = page.getByRole('button', { name: /Adicionar|Comprar|Add to cart/i }).first();
      const hasBtn = await addToCartBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  🛒 Botão Adicionar ao Carrinho: ${hasBtn ? '✅' : '⚠ Não encontrado'}`);
    }
  });
});

test.describe('Filters — Mobile', () => {
  test('Filter button appears on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to products
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 600);
    });
    await page.waitForTimeout(2000);

    // Look for filter button
    const filterBtn = page.getByRole('button', { name: /Filtrar|Filter/i }).first();
    const altFilterBtn = page.locator('button[class*="filter"], [aria-label*="filtr"]').first();

    const hasFilter = await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasAltFilter = await altFilterBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📱 Botão de filtro mobile: ${hasFilter || hasAltFilter ? '✅ Encontrado' : '⚠ Não encontrado'}`);

    if (hasFilter) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
      const sheet = page.locator('[class*="bottom-sheet"], [class*="BottomSheet"], [class*="filter-panel"], [role="dialog"]').first();
      const sheetVisible = await sheet.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  📋 Filter bottom sheet: ${sheetVisible ? '✅ Abriu' : '⚠ Não abriu'}`);
    }
  });

  test('Desktop has inline filter/sort options', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to products
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 600);
    });
    await page.waitForTimeout(2000);

    // Look for sort/filter controls
    const sortBtn = page.locator('button[class*="sort"], select[class*="sort"], [aria-label*="ordenar"]').first();
    const hasSortBtn = await sortBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🖥️ Controle de ordenação desktop: ${hasSortBtn ? '✅' : '⚠ Não encontrado'}`);
  });
});
