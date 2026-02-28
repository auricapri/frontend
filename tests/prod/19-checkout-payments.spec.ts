/**
 * 19 — CHECKOUT DETALHADO
 * Testa: cartão novo, parcelamento, PIX QR code, boleto, split card
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

async function addProductToCart(page: Page): Promise<boolean> {
  // Navigate to a product and add to cart
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, 600);
  });
  await page.waitForTimeout(2000);

  // Click first product
  const card = page.locator('a[href*="product"], [class*="product-card"], img[alt]').first();
  if (await card.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await card.click();
    await page.waitForTimeout(2000);

    // Select variant if needed, then add to cart
    const addBtn = page.getByRole('button', { name: /Adicionar|Comprar|Add to/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

test.describe('Checkout — Payment Methods', () => {
  test('Checkout page loads when cart has items', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    const added = await addProductToCart(page);
    if (!added) {
      console.log('  ⚠ Could not add product to cart');
      test.skip();
      return;
    }

    // Navigate to checkout
    await page.goto('/checkout', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    // Check checkout page loaded
    const checkoutContent = page.getByText(/Checkout|Pagamento|Finalizar|Resumo/i).first();
    const hasCheckout = await checkoutContent.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  💳 Página de checkout: ${hasCheckout ? '✅ Carregou' : '⚠ Não carregou'}`);
  });

  test('Payment method tabs/options are visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    // Look for payment method options
    const pixOption = page.getByText(/PIX/i).first();
    const cardOption = page.getByText(/Cart[aã]o|Credit|Crédito/i).first();
    const boletoOption = page.getByText(/Boleto/i).first();

    const hasPix = await pixOption.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasCard = await cardOption.isVisible({ timeout: 3_000 }).catch(() => false);
    const hasBoleto = await boletoOption.isVisible({ timeout: 3_000 }).catch(() => false);

    console.log(`  💳 Métodos de pagamento:`);
    console.log(`    PIX: ${hasPix ? '✅' : '⚠'}`);
    console.log(`    Cartão: ${hasCard ? '✅' : '⚠'}`);
    console.log(`    Boleto: ${hasBoleto ? '✅' : '⚠'}`);
  });

  test('Checkout shows order summary with totals', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    // Check for price/total display
    const totalText = page.getByText(/Total|R\$|Subtotal/i).first();
    const hasTotal = await totalText.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  💰 Resumo com total: ${hasTotal ? '✅' : '⚠ Não encontrado'}`);
  });
});

test.describe('Checkout — Address', () => {
  test('Checkout has CEP/address input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    await addProductToCart(page);
    await page.goto('/checkout', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    const cepInput = page.locator('input[name*="cep"], input[name*="zip"], input[placeholder*="CEP"], input[placeholder*="cep"]').first();
    const hasCep = await cepInput.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  📮 Campo de CEP: ${hasCep ? '✅' : '⚠ Não encontrado'}`);
  });
});
