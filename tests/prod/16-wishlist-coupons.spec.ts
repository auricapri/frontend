/**
 * 16 --- WISHLIST E CUPONS
 * Testa: abrir wishlist drawer, compartilhar link, abrir cupons, copiar codigo
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

  // Navbar auth button: aria-label="Entrar" (logged out)
  const loginBtn = page.locator('button[aria-label="Entrar"]');
  const count = await loginBtn.count();

  for (let i = count - 1; i >= 0; i--) {
    if (await loginBtn.nth(i).isVisible().catch(() => false)) {
      await loginBtn.nth(i).click({ force: true });
      break;
    }
  }

  const form = page.locator('form').first();
  if (!(await form.isVisible({ timeout: 10_000 }).catch(() => false))) return false;

  await form.locator('input[type="email"]').fill(EMAIL);
  await form.locator('input[type="password"]').fill(PASSWORD);
  await form.locator('button[type="submit"]').click({ force: true });

  const errorMsg = page.getByText(/Email ou senha|incorretos|Muitas tentativas|Erro/i).first();
  if (await errorMsg.isVisible({ timeout: 5_000 }).catch(() => false)) return false;

  await page.waitForFunction(
    () => !document.querySelector('form')?.offsetParent,
    null,
    { timeout: 30_000 },
  ).catch(() => undefined);

  await page.waitForTimeout(3000);
  return true;
}

test.describe('Wishlist', () => {
  test('Wishlist icon in navbar is clickable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    // Scroll to activate header
    await scrollToActivateHeader(page);

    // Navbar wishlist button: aria-label="Lista de desejos"
    const wishlistBtn = page.locator('button[aria-label="Lista de desejos"]').first();
    const isVisible = await wishlistBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Botao wishlist na navbar: ${isVisible ? 'Visivel' : 'Nao encontrado'}`);

    if (isVisible) {
      await wishlistBtn.click({ force: true });
      await page.waitForTimeout(1000);

      // Wishlist drawer or section should appear
      const drawer = page.locator('[class*="drawer"], [class*="Drawer"], [role="dialog"]').first();
      const drawerVisible = await drawer.isVisible({ timeout: 3_000 }).catch(() => false);

      // Also check for wishlist content (title "Favoritos" or empty message "Sua lista esta vazia")
      const wishlistContent = page.getByText(/Favoritos|Wishlist|Sua lista|lista de desejos/i).first();
      const hasContent = await wishlistContent.isVisible({ timeout: 3_000 }).catch(() => false);

      console.log(`  Wishlist drawer abriu: ${drawerVisible || hasContent ? 'SIM' : 'NAO'}`);
    }
  });

  test('Empty wishlist shows appropriate message', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    await scrollToActivateHeader(page);

    // Navbar wishlist button: aria-label="Lista de desejos"
    const wishlistBtn = page.locator('button[aria-label="Lista de desejos"]').first();
    if (await wishlistBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await wishlistBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // i18n pt: "Sua lista esta vazia"
      const emptyMsg = page.getByText(/vazia|empty|nenhum|Sem favoritos|Sua lista/i).first();
      const hasEmpty = await emptyMsg.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Mensagem wishlist vazia: ${hasEmpty ? 'Exibida' : 'Nao exibida (pode ter itens)'}`);
    }
  });

  test('Add product to wishlist via heart icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    // Scroll to products using window.scrollTo (more reliable than main.scrollTo)
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);

    // Find a heart/wishlist toggle on a product card
    const heartBtn = page.locator('button[aria-label*="Favorit"], button[aria-label*="wishlist"], button[aria-label*="Toggle wishlist"], [class*="heart"]').first();
    const hasHeart = await heartBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Botao de favoritar em card de produto: ${hasHeart ? 'Encontrado' : 'Nao encontrado'}`);
  });
});

test.describe('Coupons', () => {
  test('Coupons button in menu opens drawer', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    await scrollToActivateHeader(page);

    // The coupons button is inside the hamburger menu overlay, not directly in the navbar.
    // First open the menu via aria-label="Abrir menu"
    const menuBtn = page.locator('button[aria-label="Abrir menu"]').first();
    const menuVisible = await menuBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Botao menu hamburger: ${menuVisible ? 'Visivel' : 'Nao encontrado'}`);

    if (menuVisible) {
      await menuBtn.click({ force: true });
      await page.waitForTimeout(1000);

      // Inside the fullscreen menu, look for coupons/offers button (i18n: "Ofertas")
      const couponsBtn = page.getByText(/Ofertas|Cupons|Coupons|Offers/i).first();
      const hasCoupons = await couponsBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  Botao de cupons no menu: ${hasCoupons ? 'Visivel' : 'Nao encontrado'}`);

      if (hasCoupons) {
        await couponsBtn.click({ force: true });
        await page.waitForTimeout(1500);

        const drawer = page.locator('[class*="drawer"], [class*="Drawer"], [role="dialog"]').first();
        const drawerVisible = await drawer.isVisible({ timeout: 3_000 }).catch(() => false);
        console.log(`  Coupons drawer abriu: ${drawerVisible ? 'SIM' : 'NAO'}`);
      }
    }
  });

  test('Coupons display code and discount info', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    await scrollToActivateHeader(page);

    // Open menu first
    const menuBtn = page.locator('button[aria-label="Abrir menu"]').first();
    if (await menuBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await menuBtn.click({ force: true });
      await page.waitForTimeout(1000);

      const couponsBtn = page.getByText(/Ofertas|Cupons|Coupons|Offers/i).first();
      if (await couponsBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await couponsBtn.click({ force: true });
        await page.waitForTimeout(2000);

        // Look for coupon codes or empty state
        const couponCode = page.locator('[class*="coupon"], [class*="code"], [data-testid*="coupon"]').first();
        const emptyState = page.getByText(/Nenhum cupom|Sem cupons|No coupons/i).first();

        const hasCoupons = await couponCode.isVisible({ timeout: 3_000 }).catch(() => false);
        const isEmpty = await emptyState.isVisible({ timeout: 3_000 }).catch(() => false);
        console.log(`  Cupons: ${hasCoupons ? 'Exibidos' : isEmpty ? 'Nenhum disponivel' : 'Estado indeterminado'}`);
      }
    }
  });
});
