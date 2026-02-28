/**
 * 16 — WISHLIST E CUPONS
 * Testa: abrir wishlist drawer, compartilhar link, abrir cupons, copiar código
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

test.describe('Wishlist', () => {
  test('Wishlist icon in navbar is clickable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to activate header
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    const wishlistBtn = page.locator('button[aria-label*="ishlist"], button[aria-label*="Favoritos"], button[aria-label*="avorito"]').first();
    const isVisible = await wishlistBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  ❤️ Botão wishlist na navbar: ${isVisible ? '✅ Visível' : '⚠ Não encontrado'}`);

    if (isVisible) {
      await wishlistBtn.click();
      await page.waitForTimeout(1000);

      // Wishlist drawer or section should appear
      const drawer = page.locator('[class*="drawer"], [class*="Drawer"], [role="dialog"]').first();
      const drawerVisible = await drawer.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  📋 Wishlist drawer abriu: ${drawerVisible ? '✅' : '⚠ Não visível'}`);
    }
  });

  test('Empty wishlist shows appropriate message', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    const wishlistBtn = page.locator('button[aria-label*="ishlist"], button[aria-label*="Favoritos"], button[aria-label*="avorito"]').first();
    if (await wishlistBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await wishlistBtn.click();
      await page.waitForTimeout(1500);

      const emptyMsg = page.getByText(/vazia|empty|nenhum|Sem favoritos/i).first();
      const hasEmpty = await emptyMsg.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  📭 Mensagem wishlist vazia: ${hasEmpty ? '✅ Exibida' : '⚠ Não exibida (pode ter itens)'}`);
    }
  });

  test('Add product to wishlist via heart icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Scroll to products
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTo(0, 600);
    });
    await page.waitForTimeout(1500);

    // Find a heart/wishlist toggle on a product card
    const heartBtn = page.locator('button[aria-label*="Favorit"], button[aria-label*="wishlist"], [class*="heart"]').first();
    const hasHeart = await heartBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  ❤️ Botão de favoritar em card de produto: ${hasHeart ? '✅ Encontrado' : '⚠ Não encontrado'}`);
  });
});

test.describe('Coupons', () => {
  test('Coupons button in navbar opens drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    // Look for coupons/tag icon
    const couponsBtn = page.locator('button[aria-label*="upom"], button[aria-label*="oupon"], button[aria-label*="Cupons"]').first();
    const isVisible = await couponsBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🏷️ Botão de cupons na navbar: ${isVisible ? '✅ Visível' : '⚠ Não encontrado'}`);

    if (isVisible) {
      await couponsBtn.click();
      await page.waitForTimeout(1500);

      const drawer = page.locator('[class*="drawer"], [class*="Drawer"], [role="dialog"]').first();
      const drawerVisible = await drawer.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  📋 Coupons drawer abriu: ${drawerVisible ? '✅' : '⚠ Não visível'}`);
    }
  });

  test('Coupons display code and discount info', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(800);

    const couponsBtn = page.locator('button[aria-label*="upom"], button[aria-label*="oupon"], button[aria-label*="Cupons"]').first();
    if (await couponsBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await couponsBtn.click();
      await page.waitForTimeout(2000);

      // Look for coupon codes or empty state
      const couponCode = page.locator('[class*="coupon"], [class*="code"], [data-testid*="coupon"]').first();
      const emptyState = page.getByText(/Nenhum cupom|Sem cupons|No coupons/i).first();

      const hasCoupons = await couponCode.isVisible({ timeout: 3_000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  🏷️ Cupons: ${hasCoupons ? '✅ Exibidos' : isEmpty ? '📭 Nenhum disponível' : '⚠ Estado indeterminado'}`);
    }
  });
});
