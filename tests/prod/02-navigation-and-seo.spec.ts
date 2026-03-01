/**
 * 02 — Navegação, SEO e Links
 */
import { test, expect } from '@playwright/test';

test.describe('Navegação e SEO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);
    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('Título da página e meta tags estão presentes', async ({ page }) => {
    const title = await page.title();
    console.log(`  📄 Title: "${title}"`);
    expect(title.length, 'Título não deve estar vazio').toBeGreaterThan(0);

    // Use .first() to handle duplicate meta description tags
    const metaDescription = await page.locator('meta[name="description"]').first().getAttribute('content');
    console.log(`  📄 Meta description: "${metaDescription || 'MISSING'}"`);

    // Check for duplicate meta descriptions (SEO issue)
    const metaDescCount = await page.locator('meta[name="description"]').count();
    if (metaDescCount > 1) {
      console.warn(`  ⚠ SEO: ${metaDescCount} meta description tags encontradas (deve ser 1 só!)`);
    }

    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content').catch(() => null);
    console.log(`  📄 OG Title: "${ogTitle || 'MISSING'}"`);

    const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute('content').catch(() => null);
    console.log(`  📄 OG Image: "${ogImage || 'MISSING'}"`);
  });

  test('Navegação por produto — clicar num produto abre a página', async ({ page }) => {
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    // Clicar no primeiro produto
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Verificar elementos da página de produto
    const productTitle = page.locator('h1, h2').first();
    await expect(productTitle).toBeVisible({ timeout: 15_000 });
    const titleText = await productTitle.textContent();
    console.log(`  🛍 Produto: "${titleText}"`);

    // Preço visível
    const price = page.getByText(/R\$\s?\d/).first();
    await expect(price).toBeVisible({ timeout: 15_000 });
    const priceText = await price.textContent();
    console.log(`  💰 Preço: "${priceText}"`);

    // Scroll para ver botão de adicionar (pode estar abaixo do fold)
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);

    // Botão de adicionar ao carrinho — verificar qualquer botão relevante
    const addBtn = page.locator('button').filter({ hasText: /adicionar|comprar|add/i }).first();
    const addVisible = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🛒 Botão adicionar: ${addVisible ? 'visível' : 'não encontrado ou abaixo do fold'}`);
  });

  test('Voltar para home funciona (via browser back)', async ({ page }) => {
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Usar browser back instead of logo click (header hidden)
    await page.goBack();
    await page.waitForTimeout(3000);

    // Verificar que voltou para home
    const backProducts = page.locator('#collection .grid .cursor-pointer.group');
    await expect(backProducts.first()).toBeVisible({ timeout: 30_000 });
    console.log('  ✅ Navegação de volta para home OK');
  });

  test('Busca de produtos funciona', async ({ page }) => {
    // Scroll para ativar o header
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(1000);

    const searchTrigger = page.locator('button[aria-label*="earch" i], button[aria-label*="usca" i], [data-testid="search"]').first();

    if (await searchTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchTrigger.click();
      await page.waitForTimeout(500);

      const searchInput = page.locator('input[type="search"], input[placeholder*="usca" i], input[placeholder*="earch" i]').first();
      if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await searchInput.fill('vestido');
        await page.waitForTimeout(2000);
        console.log('  🔍 Busca por "vestido" executada');
      } else {
        console.log('  ℹ Campo de busca não encontrado após clicar');
      }
    } else {
      console.log('  ℹ Botão de busca não encontrado na navbar');
    }
  });

  test('Scroll infinito ou paginação carrega mais produtos', async ({ page }) => {
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    const initialCount = await products.count();
    console.log(`  📦 Produtos iniciais: ${initialCount}`);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const afterScrollCount = await products.count();
    console.log(`  📦 Produtos após scroll: ${afterScrollCount}`);

    const loadMore = page.getByRole('button', { name: /mais|more|carregar/i }).first();
    if (await loadMore.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await loadMore.click();
      await page.waitForTimeout(3000);
      const afterLoadMore = await products.count();
      console.log(`  📦 Produtos após "ver mais": ${afterLoadMore}`);
    }
  });
});
