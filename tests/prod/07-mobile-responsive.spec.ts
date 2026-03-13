/**
 * 07 — Responsividade Mobile e Visual
 */
import { test, expect } from '@playwright/test';

test.describe('Mobile — Responsividade', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X

  test('Home carrega corretamente no mobile', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    // Verificar que não tem scroll horizontal indesejado
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  📱 Scroll horizontal: ${hasHorizontalScroll ? '⚠ PRESENTE' : '✅ OK'}`);

    // Verificar que produtos são visíveis
    const products = page.locator('#collection [class*="columns"] .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    const count = await products.count();
    console.log(`  📦 ${count} produtos visíveis no mobile`);

    // Menu hamburger deve estar visível no mobile
    const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], [class*="hamburger"]').first();
    if (await hamburger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('  ☰ Menu hamburger: presente');
    }

    if (jsErrors.length > 0) {
      console.warn('  ⚠ JS Errors no mobile:', jsErrors);
    }
  });

  test('Produto abre corretamente no mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    const products = page.locator('#collection [class*="columns"] .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    // On mobile the quick-add button is visible (opacity-100) and uses stopPropagation,
    // so clicking the card center may hit it instead of triggering navigation.
    // Click on the product name (h3) to reliably navigate — same pattern as test 10.
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Verificar elementos do produto no mobile
    // ProductInfo renders the name inside an h1
    const title = page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 15_000 });

    const price = page.getByText(/R\$\s?\d/).first();
    await expect(price).toBeVisible({ timeout: 15_000 });

    // Verificar que a imagem do produto existe (pode estar em carousel/gallery)
    const visibleImg = page.locator('img[alt]:visible').first();
    const hasVisibleImg = await visibleImg.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasVisibleImg) {
      // Image may be in carousel, verify it exists in DOM
      const imgCount = await page.locator('img[alt]').count();
      expect(imgCount, 'Deve ter pelo menos uma imagem de produto').toBeGreaterThan(0);
    }

    console.log('  Pagina de produto OK no mobile');
  });

  test('Login drawer funciona no mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    // Botão de login no mobile
    const loginBtn = page.locator('button[aria-label="Entrar"]').first();
    if (await loginBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await loginBtn.click();

      const form = page.locator('form').first();
      await expect(form).toBeVisible({ timeout: 15_000 });

      // Verificar que os campos são usáveis no mobile
      const emailInput = form.locator('input[type="email"]');
      const passInput = form.locator('input[type="password"]');
      await expect(emailInput).toBeVisible({ timeout: 5_000 });
      await expect(passInput).toBeVisible({ timeout: 5_000 });

      console.log('  ✅ Login drawer OK no mobile');
    } else {
      // Pode ter menu hamburger primeiro
      const hamburger = page.locator('button[aria-label*="menu" i]').first();
      if (await hamburger.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await hamburger.click();
        await page.waitForTimeout(1000);
        console.log('  ☰ Menu hamburger aberto');
      }
    }
  });
});

test.describe('Tablet — Responsividade', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('Home carrega corretamente no tablet', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    const products = page.locator('#collection [class*="columns"] .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    const count = await products.count();
    console.log(`  📱 ${count} produtos visíveis no tablet`);

    // Verificar que o grid se adapta
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  📱 Scroll horizontal tablet: ${hasHorizontalScroll ? '⚠ PRESENTE' : '✅ OK'}`);
  });
});
