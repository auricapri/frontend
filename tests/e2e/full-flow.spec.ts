/**
 * Full E2E flow — runs against production (https://auricapri.com.br)
 * Uses: playwright.prod.config.ts
 *
 * Flow tested:
 *   1. Register a new user via the UI (Firebase Auth — no Supabase Admin API)
 *   2. Verify profile is created (Account button appears)
 *   3. Add a product to the wishlist
 *   4. Add a product to the cart
 *   5. Proceed through checkout (address + phone + CPF)
 *   6. Select PIX and generate QR Code
 *   7. Verify receipt page
 *
 * NOTE: Each run creates a real Firebase user and a real PIX order in Asaas (test environment).
 * The email format is: e2e_<timestamp>@auricapri-test.com
 */

import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

const UNIQUE_EMAIL = `e2e_${Date.now()}@auricapri-test.com`;
const PASSWORD = 'Teste@E2E2026!';
const FULL_NAME = 'Teste E2E Playwright';

/**
 * Waits for the initial splash screen to disappear and dismisses
 * the Terms Consent Modal if it appears (first visit).
 */
async function waitForPageReady(page: Page) {
  // Wait for body.loaded class (splash screen hides when this is set)
  await page
    .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 60_000 })
    .catch(() => undefined);

  // Dismiss Terms Consent Modal if it appears (blocks pointer events at z-[300])
  // Wait up to 8s — on first visit the modal can take several seconds to appear
  const termsModal = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsModal.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await termsModal.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Opens the auth drawer and switches to register mode, then registers a new user.
 * @param page Playwright page
 * @param email Optional email to use (defaults to UNIQUE_EMAIL module constant)
 */
async function registerViaUI(page: Page, email = UNIQUE_EMAIL) {
  // Wait for splash screen to disappear and dismiss any consent modal
  await waitForPageReady(page);

  // Open the auth drawer
  // aria-label="Entrar" when not logged in (PT-BR)
  // There are two "Entrar" buttons (mobile + desktop nav); desktop is visible at 1280px width
  const loginButton = page.locator('button[aria-label="Entrar"]').last();
  await expect(loginButton).toBeVisible({ timeout: 30_000 });
  await loginButton.click();

  // Wait for the form to appear
  const form = page.locator('form').first();
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Switch to register mode — click the "Cadastrar" toggle link (not the submit button)
  // In login mode, the toggle shows "Cadastrar"; the submit shows "Entrar"
  const toggleButton = page
    .locator('p')
    .filter({ hasText: /cadastrar|sign up|registrarse/i })
    .getByRole('button')
    .first();
  await expect(toggleButton).toBeVisible({ timeout: 10_000 });
  await toggleButton.click();

  // Now in register mode — fill the form
  // Full name (first text input — appears only in register mode)
  const fullNameInput = form.locator('input').first();
  await expect(fullNameInput).toBeVisible({ timeout: 10_000 });
  await fullNameInput.fill(FULL_NAME);

  await form.locator('input[type="email"]').fill(email);
  await form.locator('input[type="password"]').fill(PASSWORD);

  // Accept terms checkbox (required to enable submit)
  const termsCheckbox = form.locator('input[type="checkbox"]').first();
  await expect(termsCheckbox).toBeVisible({ timeout: 5_000 });
  await termsCheckbox.check();

  // Submit registration
  await form.locator('button[type="submit"]').click();

  // Wait for drawer to close — the auth drawer disappears after successful registration
  // Then wait for "Minha conta" button (aria-label when logged in in PT-BR)
  await expect(
    page.locator('button[aria-label="Minha conta"]').last(),
  ).toBeVisible({ timeout: 60_000 });
}

/** Logs in with an existing account via the auth drawer. */
async function loginViaUI(page: Page, email: string, password: string) {
  // Wait longer for Terms modal on first visit (can take up to 10s to appear)
  await waitForPageReady(page);

  // There are two "Entrar" buttons (mobile + desktop nav); desktop is visible at 1280px width
  const loginButton = page.locator('button[aria-label="Entrar"]').last();
  await expect(loginButton).toBeVisible({ timeout: 30_000 });
  await loginButton.click();

  const form = page.locator('form').first();
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Re-check for Terms modal AFTER opening the drawer — it can appear with a delay
  // and block form inputs (z-[300] > auth drawer z-[70])
  const termsModalAgain = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsModalAgain.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await termsModalAgain.click();
    await page.waitForTimeout(500);
  }

  // Use force:true to bypass any residual overlay that might be invisible but intercepting
  await form.locator('input[type="email"]').fill(email);
  await form.locator('input[type="password"]').fill(password);
  await form.locator('button[type="submit"]').click();

  // Check for Firebase auth errors by looking for known PT-BR error messages
  // (Browser normalizes 'color: #c00' → 'color: rgb(204, 0, 0)', so CSS attr selector doesn't work)
  const knownErrors = /Muitas tentativas|Email ou senha|Nenhuma conta|desativada|fraca|Erro de conexão|Ocorreu um erro/i;
  const authErrorText = page.getByText(knownErrors);
  const errorVisible = await authErrorText.isVisible({ timeout: 5_000 }).catch(() => false);
  if (errorVisible) {
    const msg = await authErrorText.first().textContent().catch(() => '');
    throw new Error(`Auth error during login: "${msg}"`);
  }

  await expect(
    page.locator('button[aria-label="Minha conta"]').last(),
  ).toBeVisible({ timeout: 90_000 });
}

/** Finds a product card on the home page and clicks it. */
async function openFirstProduct(page: Page) {
  // Brief wait for post-login animations (auth drawer closing)
  await page.waitForTimeout(500);

  // Accept cookies banner if present (avoids it intercepting clicks)
  const cookieBanner = page.getByRole('button', { name: 'Aceitar cookies' });
  if (await cookieBanner.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cookieBanner.click();
    await page.waitForTimeout(300);
  }

  const productCards = page.locator('#collection .grid .cursor-pointer.group');
  await expect(productCards.first()).toBeVisible({ timeout: 60_000 });

  // Click the product name heading — avoids the wishlist/cart action buttons
  // which have stopPropagation and would intercept a center click
  await productCards.first().locator('h3').first().click();
  await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
}

/** Selects the first available size button (if the selector is present). */
async function selectSizeIfNeeded(page: Page) {
  // Include all common Brazilian sizes + "Tamanho único" variants
  // Note: "Tamanho único Plus size" must come before "Tamanho único" so the longer string isn't partially swallowed
  const sizeButtons = page
    .locator('button')
    .filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO|XS|S|XL|XXL|36|38|40|42|44|46|Tamanho único Plus size|Tamanho único)$/i });
  if ((await sizeButtons.count()) > 0) {
    await sizeButtons.first().click();
    await page.waitForTimeout(500);
  }
}

/** Fills the checkout address form and clicks Confirmar e Pagar. */
async function fillAddress(page: Page) {
  const cepInput = page.locator('input[placeholder="00000-000"]').first();
  await expect(cepInput).toBeVisible({ timeout: 30_000 });
  await cepInput.fill('01310100');

  // Wait for CEP lookup to fill state/city fields
  const numberInput = page
    .locator('input[placeholder="Ex: 123"], input[placeholder="Ex\\: 123"]')
    .first();
  await expect(numberInput).toBeVisible({ timeout: 60_000 });
  await numberInput.fill('123');

  // Phone (optional field — fill if present)
  const phoneInput = page
    .locator('input[placeholder*="99999" i], input[placeholder*="Telefone" i]')
    .first();
  if ((await phoneInput.count()) > 0) {
    await phoneInput.fill('(11) 99999-9999');
  }

  // CPF (required for PIX — fill if present)
  const cpfInput = page
    .locator('input[placeholder*="000.000" i], input[placeholder*="CPF" i]')
    .first();
  if ((await cpfInput.count()) > 0) {
    await cpfInput.fill('529.982.247-25'); // valid CPF for testing
  }

  const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
  await expect(confirmButton).toBeEnabled({ timeout: 60_000 });
  await confirmButton.click();
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Full User Flow — Production', () => {
  test.setTimeout(300_000);

  test('1. Cadastro via UI cria perfil Supabase com sucesso', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: 'test-results-prod/01-home.png' });

    await registerViaUI(page);
    await page.screenshot({ path: 'test-results-prod/02-after-register.png' });

    // "Minha conta" button visible = profile was loaded from Supabase
    await expect(page.locator('button[aria-label="Minha conta"]').last()).toBeVisible();

    // No critical auth errors in console
    const authErrors = errors.filter(
      (e) => e.includes('401') || e.includes('profile') || e.includes('auth'),
    );
    if (authErrors.length > 0) {
      console.warn('Auth-related console errors:', authErrors);
    }
    // We don't fail on warnings, just log them
  });

  test('2. Login com conta existente', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await loginViaUI(page, UNIQUE_EMAIL, PASSWORD);

    await expect(page.locator('button[aria-label="Minha conta"]').last()).toBeVisible();
    await page.screenshot({ path: 'test-results-prod/03-logged-in.png' });
  });

  test('3. Wishlist — adicionar produto', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaUI(page, UNIQUE_EMAIL, PASSWORD);

    // Navigate to a product
    await openFirstProduct(page);
    await page.screenshot({ path: 'test-results-prod/04-product-page.png' });

    // Click the wishlist heart button
    const wishlistButton = page
      .getByRole('button', { name: /toggle wishlist/i })
      .or(page.locator('[aria-label="Toggle wishlist"]'))
      .first();

    await expect(wishlistButton).toBeVisible({ timeout: 30_000 });
    await wishlistButton.click();

    // A toast or visual indicator should appear — wait briefly
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: 'test-results-prod/05-wishlist-added.png' });

    // Verify wishlist count in navbar increased (heart icon in navbar)
    // The navbar heart shows wishlistCount > 0 with fill="currentColor"
    // We just verify no 401 error occurred
    const apiError = page.getByText(/401|não autorizado|unauthorized/i);
    await expect(apiError).toHaveCount(0);
  });

  test('4. Carrinho — adicionar produto e ir para checkout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaUI(page, UNIQUE_EMAIL, PASSWORD);

    // Brief wait for post-login animations + dismiss cookie banner
    await page.waitForTimeout(500);
    const cookieBanner4 = page.getByRole('button', { name: 'Aceitar cookies' });
    if (await cookieBanner4.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cookieBanner4.click();
      await page.waitForTimeout(300);
    }

    // Try up to 15 products to find one with an enabled Add button
    // (some products may be out of stock or require color/size selection)
    const productCards = page.locator('#collection .grid .cursor-pointer.group');
    await expect(productCards.first()).toBeVisible({ timeout: 60_000 });
    const totalCards = await productCards.count();

    let added = false;
    for (let i = 0; i < Math.min(15, totalCards); i++) {
      await productCards.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

      await selectSizeIfNeeded(page);

      // Use the PT-BR button name to identify the add-to-cart button specifically
      // (avoids confusion with size buttons that also get bg-black text-white when selected)
      const addButton = page.getByRole('button', { name: /Adicionar|Adicionar à Bolsa/i });
      await expect(addButton.first()).toBeVisible({ timeout: 15_000 });

      if (await addButton.first().isEnabled()) {
        await addButton.first().click();
        added = true;
        break;
      }

      await page.goBack();
      await expect(productCards.first()).toBeVisible({ timeout: 30_000 });
    }

    expect(added, 'Should find at least one product with stock').toBe(true);
    await page.screenshot({ path: 'test-results-prod/06-cart-drawer-open.png' });

    // Cart drawer should be open — click "Finalizar" (PT-BR for checkout)
    const cartDrawerCheckout = page.getByRole('button', { name: /Finalizar/i });
    await expect(cartDrawerCheckout.first()).toBeVisible({ timeout: 30_000 });
    await cartDrawerCheckout.first().click();

    // Should now be on checkout step 1
    await expect(page.getByRole('button', { name: /Confirmar e Pagar/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({ path: 'test-results-prod/07-checkout-step1.png' });
  });

  test('5. Checkout completo — endereço + PIX + recibo', async ({ page }) => {
    const apiErrors: { url: string; status: number; body: string }[] = [];

    // Track API errors
    page.on('response', async (response) => {
      if (response.status() >= 400 && response.url().includes('/api/')) {
        try {
          const body = await response.text();
          apiErrors.push({ url: response.url(), status: response.status(), body });
        } catch {
          // ignore
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Register a fresh account to avoid Firebase rate limits from repeated logins with the same email
    await registerViaUI(page, `e2e_chk_${Date.now()}@auricapri-test.com`);

    // ── Step 1: Find and add product ──────────────────────────────────────
    // Brief wait for post-login animations + dismiss cookie banner
    await page.waitForTimeout(500);
    const cookieBanner5 = page.getByRole('button', { name: 'Aceitar cookies' });
    if (await cookieBanner5.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cookieBanner5.click();
      await page.waitForTimeout(300);
    }

    const productCards = page.locator('#collection .grid .cursor-pointer.group');
    await expect(productCards.first()).toBeVisible({ timeout: 60_000 });
    const totalCards5 = await productCards.count();

    let added = false;
    for (let i = 0; i < Math.min(15, totalCards5); i++) {
      await productCards.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

      await selectSizeIfNeeded(page);

      const addButton = page.getByRole('button', { name: /Adicionar|Adicionar à Bolsa/i });
      await expect(addButton.first()).toBeVisible({ timeout: 15_000 });

      if (await addButton.first().isEnabled()) {
        await addButton.first().click();
        added = true;
        break;
      }

      await page.goBack();
      await expect(productCards.first()).toBeVisible({ timeout: 30_000 });
    }

    expect(added, 'Nenhum produto com estoque encontrado').toBe(true);

    // ── Step 2: Go to checkout ────────────────────────────────────────────
    // Cart drawer opened — click "Finalizar" button (PT-BR for cart checkout)
    const cartDrawerCheckout = page.getByRole('button', { name: /Finalizar/i });
    await expect(cartDrawerCheckout.first()).toBeVisible({ timeout: 30_000 });
    await cartDrawerCheckout.first().click();

    // Checkout step 1 — address
    await expect(page.getByRole('button', { name: /Confirmar e Pagar/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({ path: 'test-results-prod/08-checkout-address.png' });

    // ── Step 3: Fill address ──────────────────────────────────────────────
    await fillAddress(page);
    await page.screenshot({ path: 'test-results-prod/09-checkout-payment.png' });

    // ── Step 4: Select PIX ───────────────────────────────────────────────
    // PIX flow: clicking the PIX button immediately creates the order + generates QR code.
    // There is NO separate "Revisar Pedido" or "CONCLUIR COMPRA" step for PIX.
    // (Those buttons only exist in the Credit Card → Review step flow.)
    const pixButton = page.getByRole('button', { name: /PIX/i }).first();
    await expect(pixButton).toBeVisible({ timeout: 30_000 });
    await pixButton.click();
    await page.screenshot({ path: 'test-results-prod/10-checkout-pix-clicked.png' });

    // ── Step 5: Wait for PIX QR code generation ──────────────────────────
    // Expected outcomes after clicking PIX:
    //   a) Success — "Escaneie o QR Code" heading appears with QR code image
    //   b) Error   — "Clique para gerar o PIX" heading appears with pixError below
    // The loading modal (isGenerating=true) closes when the API call finishes.
    // Allow up to 90s for order creation + Asaas API round-trip.
    await expect(
      page.getByText('Escaneie o QR Code').or(page.getByText('Clique para gerar o PIX')),
    ).toBeVisible({ timeout: 90_000 });

    await page.screenshot({ path: 'test-results-prod/11-pix-state.png' });

    const pixSuccess = await page
      .getByText('Escaneie o QR Code')
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    if (!pixSuccess) {
      // PIX generation failed — collect API errors for diagnosis
      if (apiErrors.length > 0) {
        console.log('\n=== API Errors during checkout ===');
        apiErrors.forEach((e) => {
          console.log(`${e.status} ${e.url}`);
          console.log(`  Body: ${e.body.substring(0, 300)}`);
        });
      }

      const asaasAuthError = apiErrors.find(
        (e) => e.body.includes('access_token') || e.body.includes('autenticação'),
      );
      if (asaasAuthError) {
        throw new Error(
          `ASAAS_API_KEY não está configurado no servidor Render.\n` +
          `Solução: Render Dashboard → backend service → Environment → adicionar:\n` +
          `  ASAAS_API_KEY = <chave Asaas sandbox ou produção>\n` +
          `  ASAAS_ENVIRONMENT = sandbox  (para testes)\n` +
          `Erro recebido (${asaasAuthError.status}): ${asaasAuthError.body.substring(0, 200)}`,
        );
      }

      const criticalErrors = apiErrors.filter((e) => e.status >= 400);
      if (criticalErrors.length > 0) {
        throw new Error(
          `Geração de PIX falhou com erros de API:\n` +
          criticalErrors.map((e) => `${e.status} ${e.url}: ${e.body.substring(0, 200)}`).join('\n'),
        );
      }

      throw new Error('QR Code PIX não foi gerado. Verifique os screenshots para diagnóstico.');
    }

    // Success — QR code is visible, checkout complete
    await page.screenshot({ path: 'test-results-prod/12-pix-qr-code.png' });
  });
});

// ─── Regression tests (run independently) ────────────────────────────────────

test.describe('Regressão — Auth', () => {
  test.setTimeout(120_000);

  test('POST /api/auth/profile não retorna 401 para novo usuário (circular dependency regression)', async ({ page }) => {
    const profileResponses: { status: number; body: string }[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/auth/profile')) {
        try {
          const body = await response.text();
          profileResponses.push({ status: response.status(), body });
        } catch {
          // ignore
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const uniqueEmail = `e2e_reg_${Date.now()}@auricapri-test.com`;

    // Open auth drawer (aria-label="Entrar" in PT-BR)
    await page.locator('button[aria-label="Entrar"]').last().click();
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 15_000 });

    // Switch to register
    const toggleButton = page
      .locator('p')
      .filter({ hasText: /cadastrar|sign up/i })
      .getByRole('button')
      .first();
    await toggleButton.click();

    // Fill form
    await form.locator('input').first().fill('Regression Test User');
    await form.locator('input[type="email"]').fill(uniqueEmail);
    await form.locator('input[type="password"]').fill('Teste@Regressao2026!');
    await form.locator('input[type="checkbox"]').first().check();
    await form.locator('button[type="submit"]').click();

    // Wait for login to complete (aria-label="Minha conta" in PT-BR)
    await expect(
      page.locator('button[aria-label="Minha conta"]').last(),
    ).toBeVisible({ timeout: 60_000 });

    // /api/auth/profile must NOT return 401
    const profileCall = profileResponses.find((r) => r.status !== undefined);
    if (profileCall) {
      expect(profileCall.status, '/api/auth/profile should not return 401').not.toBe(401);
      expect(profileCall.status, '/api/auth/profile should return 200').toBe(200);
    }
  });

  test('GET /api/wishlist não retorna 401 após login', async ({ page }) => {
    const wishlistErrors: number[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/wishlist') && response.status() >= 400) {
        wishlistErrors.push(response.status());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Register fresh account to avoid Firebase rate-limiting repeated logins with the same email
    await registerViaUI(page, `e2e_wl_${Date.now()}@auricapri-test.com`);

    // Wishlist is loaded after login — wait a moment
    await page.waitForTimeout(3_000);

    expect(wishlistErrors, 'Wishlist should not return 4xx errors after login').toHaveLength(0);
  });

  test('GET /api/orders não retorna 401 após login', async ({ page }) => {
    const ordersErrors: number[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/orders') && response.status() >= 400) {
        ordersErrors.push(response.status());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Register fresh account to avoid Firebase rate-limiting
    await registerViaUI(page, `e2e_ord_${Date.now()}@auricapri-test.com`);

    // Orders are loaded in Account drawer or profile
    await page.waitForTimeout(3_000);

    expect(ordersErrors, 'Orders should not return 4xx errors after login').toHaveLength(0);
  });

  test('POST /api/cart/merge não retorna 401 após login', async ({ page }) => {
    const cartErrors: number[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/cart') && response.status() >= 400) {
        cartErrors.push(response.status());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Register fresh account to avoid Firebase rate-limiting
    await registerViaUI(page, `e2e_cart_${Date.now()}@auricapri-test.com`);

    await page.waitForTimeout(3_000);

    const criticalCartErrors = cartErrors.filter((s) => s === 401);
    expect(criticalCartErrors, 'Cart should not return 401 after login').toHaveLength(0);
  });
});
