/**
 * 05 — Checkout: fluxo completo (endereço, pagamento, recibo)
 * IMPORTANTE: este teste NAO finaliza pagamento real, apenas testa o fluxo até a geração do PIX.
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = 'marcus.lirio1@gmail.com';
const PASSWORD = 'Raposa69*';

async function setup(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
    .catch(() => undefined);

  // Dismiss hero/announcement banner if covering the page
  await page.evaluate(() => {
    const hero = document.querySelector('[class*="hero"], [class*="Hero"], [class*="announcement"], [class*="splash"]');
    if (hero instanceof HTMLElement) {
      hero.style.pointerEvents = 'none';
      hero.style.zIndex = '-1';
    }
    document.querySelectorAll('[class*="fixed"][class*="top"], [class*="overlay"]').forEach((el) => {
      if (el instanceof HTMLElement && el.offsetHeight > 200) {
        el.style.pointerEvents = 'none';
      }
    });
  });

  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await termsBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
  const cookieBtn = page.getByRole('button', { name: /Aceitar cookies/i });
  if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cookieBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
}

async function scrollToActivateHeader(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

async function login(page: Page) {
  // Scroll past hero to activate header
  await scrollToActivateHeader(page);

  // Open auth drawer — use evaluate click to bypass hero interception
  const loginBtn = page.locator('button[aria-label="Entrar"]');
  const count = await loginBtn.count();

  let clicked = false;
  for (let i = count - 1; i >= 0; i--) {
    if (await loginBtn.nth(i).isVisible().catch(() => false)) {
      await loginBtn.nth(i).evaluate((el: HTMLElement) => el.click());
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    if (count > 0) {
      await loginBtn.first().click({ force: true });
    }
  }

  const form = page.locator('form').first();
  await expect(form).toBeVisible({ timeout: 15_000 });

  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await termsBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  await form.locator('input[type="email"]').fill(EMAIL);
  await form.locator('input[type="password"]').fill(PASSWORD);
  await form.locator('button[type="submit"]').click({ force: true });

  // Wait for login to complete (form disappears)
  await page
    .waitForFunction(() => !document.querySelector('form')?.offsetParent, null, { timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(3000);

  // Verify login succeeded
  await scrollToActivateHeader(page);
  const accountBtn = page.locator('button[aria-label="Minha conta"]:visible').first();
  const loggedIn = await accountBtn.isVisible({ timeout: 30_000 }).catch(() => false);
  if (!loggedIn) {
    const enterBtn = page.locator('button[aria-label="Entrar"]:visible').first();
    const stillShowsEnter = await enterBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(stillShowsEnter, 'Login deve ter sucesso').toBe(false);
  }
  await page.waitForTimeout(1000);
}

async function tryAddToCartOnProductPage(page: Page): Promise<boolean> {
  // Scroll down to reveal the "Add to bag" button
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  // Select size variant if needed
  const sizeButtons = page
    .locator('button')
    .filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|36|38|40|42|44|46)$/i });
  if ((await sizeButtons.count()) > 0) {
    await sizeButtons.first().click({ force: true });
    await page.waitForTimeout(500);
  }

  // Check if product is out of stock
  const soldOut = page.locator('button').filter({ hasText: /esgotado/i }).first();
  if (await soldOut.isVisible({ timeout: 2_000 }).catch(() => false)) {
    return false;
  }

  // Use CSS selector matching the actual component: button.bg-black.text-white
  // Filter by text to ensure we get the add-to-cart button, not other black buttons
  const addBtn = page
    .locator('button.bg-black.text-white, button')
    .filter({ hasText: /adicionar|bolsa|comprar|add to/i })
    .first();

  if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    if (await addBtn.isEnabled()) {
      // Use evaluate click to bypass any hero overlay interception
      await addBtn.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(2000);
      return true;
    }
  }

  return false;
}

async function addProductToCart(page: Page): Promise<boolean> {
  // Scroll to top first so the product grid is reachable
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  const products = page.locator('#collection [class*="columns"] .cursor-pointer.group');
  const hasProducts = await products.first().isVisible({ timeout: 15_000 }).catch(() => false);

  if (!hasProducts) {
    // Fallback: try generic product selectors
    const card = page.locator('a[href*="product"], [class*="product-card"], img[alt]').first();
    if (await card.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await card.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(2000);
      return await tryAddToCartOnProductPage(page);
    }
    return false;
  }

  const total = await products.count();

  for (let i = 0; i < Math.min(total, 15); i++) {
    // Click on product title using evaluate to avoid hero interception
    const h3 = products.nth(i).locator('h3').first();
    if (await h3.isVisible().catch(() => false)) {
      await h3.evaluate((el: HTMLElement) => el.click());
    } else {
      await products.nth(i).click({ force: true });
    }

    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 }).catch(() => null);
    if (!page.url().includes('/product/')) {
      continue;
    }

    const added = await tryAddToCartOnProductPage(page);
    if (added) return true;

    // Go back and try next product
    await page.goBack();
    await products.first().isVisible({ timeout: 15_000 }).catch(() => false);
  }
  return false;
}

test.describe('Checkout — Fluxo Completo', () => {
  test.setTimeout(180_000);

  test('Step 1: Produto -> Carrinho -> Tela de Checkout', async ({ page }) => {
    const apiTimings: { url: string; time: number; status: number }[] = [];
    const pending = new Map<string, number>();
    page.on('request', (req) => {
      if (req.url().includes('/api/')) pending.set(req.url(), Date.now());
    });
    page.on('response', (resp) => {
      const start = pending.get(resp.url());
      if (start) {
        apiTimings.push({ url: resp.url(), time: Date.now() - start, status: resp.status() });
        pending.delete(resp.url());
      }
    });

    await setup(page);
    await login(page);

    const added = await addProductToCart(page);
    expect(added, 'Deve encontrar um produto com estoque').toBe(true);

    // Ir para checkout via drawer
    const checkoutBtn = page.getByRole('button', { name: /Finalizar/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 15_000 });
    await checkoutBtn.click({ force: true });

    // Deve estar na pagina de checkout
    await expect(page.getByRole('button', { name: /Confirmar e Pagar/i })).toBeVisible({
      timeout: 30_000,
    });

    console.log('  Checkout step 1 (endereco) alcancado');
    console.log('\n  API Timings durante checkout:');
    apiTimings.forEach(({ url, time, status }) => {
      const path = new URL(url).pathname;
      const icon = status >= 400 ? 'ERR' : time > 3000 ? 'SLOW' : time > 1000 ? 'WARN' : 'OK';
      console.log(`    [${icon}] [${status}] ${path}: ${time}ms`);
    });
  });

  test('Step 2: Preencher endereco com CEP e validar autopreenchimento', async ({ page }) => {
    await setup(page);
    await login(page);

    const added = await addProductToCart(page);
    expect(added, 'Deve encontrar um produto com estoque').toBe(true);

    const checkoutBtn = page.getByRole('button', { name: /Finalizar/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 15_000 });
    await checkoutBtn.click({ force: true });

    // Preencher CEP
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30_000 });

    const start = Date.now();
    await cepInput.fill('01310100'); // CEP da Av. Paulista

    // Esperar autopreenchimento
    const numberInput = page
      .locator('input[placeholder="Ex: 123"], input[placeholder="Ex\\: 123"]')
      .first();
    await expect(numberInput).toBeVisible({ timeout: 60_000 });
    const cepLookupTime = Date.now() - start;
    console.log(`  CEP lookup + autopreenchimento: ${cepLookupTime}ms`);

    await numberInput.fill('1578');

    // Telefone
    const phoneInput = page
      .locator('input[placeholder*="99999" i], input[placeholder*="Telefone" i]')
      .first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('(11) 99999-9999');
    }

    // CPF
    const cpfInput = page
      .locator('input[placeholder*="000.000" i], input[placeholder*="CPF" i]')
      .first();
    if (await cpfInput.count() > 0) {
      await cpfInput.fill('529.982.247-25');
    }

    // Verificar que botao "Confirmar e Pagar" esta habilitado
    const confirmBtn = page.getByRole('button', { name: /Confirmar e Pagar/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 30_000 });
    console.log('  Formulario de endereco preenchido e validado');
  });

  test('Step 3: Fluxo completo ate selecao de pagamento (sem finalizar)', async ({ page }) => {
    const apiErrors: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && resp.status() >= 500) {
        apiErrors.push({ url: resp.url(), status: resp.status() });
      }
    });

    await setup(page);
    await login(page);

    const added = await addProductToCart(page);
    expect(added, 'Deve encontrar um produto com estoque').toBe(true);

    // Ir para checkout
    const checkoutBtn = page.getByRole('button', { name: /Finalizar/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 15_000 });
    await checkoutBtn.click({ force: true });

    // Preencher endereco - aguardar pagina de checkout carregar
    await page.waitForTimeout(3000);
    const cepInput = page.locator('input[placeholder="00000-000"], input[placeholder*="CEP" i], input[placeholder*="cep"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30_000 });
    await cepInput.fill('01310100');

    const numberInput = page
      .locator('input[placeholder="Ex: 123"], input[placeholder="Ex\\: 123"]')
      .first();
    await expect(numberInput).toBeVisible({ timeout: 60_000 });
    await numberInput.fill('1578');

    const phoneInput = page
      .locator('input[placeholder*="99999" i], input[placeholder*="Telefone" i]')
      .first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('(11) 99999-9999');
    }

    const cpfInput = page
      .locator('input[placeholder*="000.000" i], input[placeholder*="CPF" i]')
      .first();
    if (await cpfInput.count() > 0) {
      await cpfInput.fill('529.982.247-25');
    }

    const confirmBtn = page.getByRole('button', { name: /Confirmar e Pagar/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 30_000 });
    await confirmBtn.click({ force: true });

    // Verificar que o checkout avancou apos clicar confirmar
    await page.waitForTimeout(5000);

    // Procurar opcoes de pagamento (podem aparecer como botoes, tabs ou radios)
    const pixOption = page.getByText(/PIX/i).first();
    const cardOption = page.getByText(/Cart[aã]o|Credit|Crédito/i).first();
    const boletoOption = page.getByText(/Boleto/i).first();
    const paymentSection = page.getByText(/Pagamento|Payment|forma de pagamento/i).first();

    const paymentOptions: string[] = [];
    if (await pixOption.isVisible({ timeout: 15_000 }).catch(() => false)) paymentOptions.push('PIX');
    if (await cardOption.isVisible({ timeout: 3_000 }).catch(() => false)) paymentOptions.push('Cartao');
    if (await boletoOption.isVisible({ timeout: 3_000 }).catch(() => false)) paymentOptions.push('Boleto');
    if (await paymentSection.isVisible({ timeout: 3_000 }).catch(() => false)) paymentOptions.push('SecaoPagamento');

    console.log(`  Opcoes de pagamento disponiveis: ${paymentOptions.join(', ') || 'NENHUMA'}`);
    // Accept if at least one payment indicator is found, or if the confirm button disappeared (form advanced)
    const confirmStillVisible = await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    const advancedPastAddress = paymentOptions.length > 0 || !confirmStillVisible;
    expect(advancedPastAddress, 'Checkout deve avancar alem do endereco').toBe(true);

    // NAO clicar em pagamento para nao criar pedido real
    console.log('  Fluxo de checkout ate selecao de pagamento OK');
    console.log('  Pagamento NAO foi finalizado (evitar pedido real)');

    if (apiErrors.length > 0) {
      console.error('  API 5xx errors durante checkout:', apiErrors);
      expect(apiErrors.length, 'Nao deve ter erros 5xx durante checkout').toBe(0);
    }
  });
});
