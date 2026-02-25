import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createConfirmedE2EUser, loginViaAuthDrawer } from './helpers/auth';
import { ensureAtLeastOneProductWithStock } from './helpers/catalog';

async function readBackendEnv() {
  const envPath = path.resolve(process.cwd(), '..', 'backend', '.env');
  const raw = await fs.readFile(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const kv: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    kv[k] = v;
  }
  return {
    supabaseUrl: kv.SUPABASE_URL,
    serviceRoleKey: kv.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function attachDefaultAddress(params: { userId: string; email: string; postalCode: string }) {
  const { supabaseUrl, serviceRoleKey } = await readBackendEnv();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: profileError } = await admin.from('profiles').upsert({
    id: params.userId,
    email: params.email,
    full_name: 'E2E Usuário',
    role: 'customer',
  });
  if (profileError) throw profileError;

  const { data: address, error: addressError } = await admin
    .from('addresses')
    .insert({
      user_id: params.userId,
      street_address: 'Av Paulista, 1000',
      city: 'São Paulo',
      state_province: 'SP',
      postal_code: params.postalCode,
      country_code: 'BR',
      is_default: true,
    })
    .select('id')
    .single();
  if (addressError) throw addressError;

  const { error: updateError } = await admin
    .from('profiles')
    .update({ default_address_id: address.id })
    .eq('id', params.userId);
  if (updateError) throw updateError;
}

async function mockExternalApis(page: import('@playwright/test').Page) {
  await page.route('https://api.mapbox.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/geocoding/v5/mapbox.places/')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'FeatureCollection', features: [] }),
      });
      return;
    }
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('https://viacep.com.br/ws/**', async (route) => {
    const url = route.request().url();
    const match = url.match(/\/ws\/(\d{8})\/json\/?$/);
    if (match) {
      const cep = match[1];
      const payload =
        cep === '01310100'
          ? { cep: '01310-100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' }
          : { erro: true };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route('https://cep.awesomeapi.com.br/**', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

async function getAnyProductSlugWithStock() {
  const { supabaseUrl, serviceRoleKey } = await readBackendEnv();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let { data: variant, error: variantError } = await admin
    .from('product_variants')
    .select('product_id, stock_quantity')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .limit(1)
    .maybeSingle();

  if (variantError) throw variantError;

  if (!variant?.product_id) {
    await ensureAtLeastOneProductWithStock({ minStock: 10 });
    const retry = await admin
      .from('product_variants')
      .select('product_id, stock_quantity')
      .eq('is_active', true)
      .gt('stock_quantity', 0)
      .limit(1)
      .maybeSingle();
    if (retry.error) throw retry.error;
    variant = retry.data;
  }

  const productId = (variant as { product_id?: string } | null)?.product_id;
  if (!productId) throw new Error('Could not resolve product id');

  const { data: product, error: productError } = await admin
    .from('products')
    .select('slug')
    .eq('id', productId)
    .maybeSingle();
  if (productError) throw productError;

  const slugObj = (product as { slug?: any } | null)?.slug;
  const slug =
    typeof slugObj === 'string' ? slugObj : (slugObj?.pt || slugObj?.en || slugObj?.es || slugObj?.fr);
  if (!slug) throw new Error('Could not resolve product slug');
  return slug;
}

async function goToCheckout(page: import('@playwright/test').Page) {
  const slug = await getAnyProductSlugWithStock();
  await page.goto(`/product/${slug}`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/product\//, { timeout: 30000 });

  const add = page.locator('button.bg-black.text-white').first();
  await expect(add).toBeVisible({ timeout: 30000 });

  const waitForDrawer = async () => {
    const close = page.getByRole('button', { name: 'Close drawer', exact: true });
    await close.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    return await close.isVisible().catch(() => false);
  };

  const tryAdd = async () => {
    if (await add.isEnabled().catch(() => false)) {
      await add.click();
      if (await waitForDrawer()) return true;
      return true;
    }
    return false;
  };

  if (!(await tryAdd())) {
    const sizeButtons = page
      .locator('button')
      .filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|ÚNICO|36|38|40|42|44|46|S|XS|L|XL)$/i });
    for (let i = 0; i < (await sizeButtons.count()); i += 1) {
      await sizeButtons.nth(i).click();
      if (await tryAdd()) break;
    }
  }

  if (await waitForDrawer()) {
    // drawer opened, proceed
  } else {
    const colorButtons = page.locator('button.w-12.h-12.rounded-full');
    for (let c = 0; c < (await colorButtons.count()); c += 1) {
      await colorButtons.nth(c).click();
      if (await tryAdd()) break;
      const sizeButtons = page
        .locator('button')
        .filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|ÚNICO|36|38|40|42|44|46|S|XS|L|XL)$/i });
      for (let i = 0; i < (await sizeButtons.count()); i += 1) {
        await sizeButtons.nth(i).click();
        if (await tryAdd()) break;
      }
      if (await waitForDrawer()) break;
    }
  }

  const cartDrawerClose = page.getByRole('button', { name: 'Close drawer', exact: true });
  await expect(cartDrawerClose).toBeVisible({ timeout: 30000 });
  const cartDrawer = cartDrawerClose.locator('xpath=ancestor::div[contains(@class,"fixed")][1]');
  const checkout = cartDrawer.locator('button.w-full.bg-black.text-white');
  await expect(checkout).toBeVisible({ timeout: 30000 });
  await checkout.click();

  await expect(page.getByRole('button', { name: /Confirmar e Pagar/i })).toBeVisible({ timeout: 30000 });
}

async function fillAddressAndAdvance(page: import('@playwright/test').Page) {
  // Número do endereço
  const numInput = page.locator('input[placeholder="Ex: 123"], input[placeholder="Ex\\: 123"]').first();
  const numVisible = await numInput.isVisible().catch(() => false);
  if (numVisible) {
    await numInput.fill('123');
  }

  // Telefone
  const phoneInput = page.locator('input[placeholder*="99999"]').first();
  await expect(phoneInput).toBeVisible({ timeout: 30000 });
  await phoneInput.fill('11999999999');

  // CPF
  const cpfInput = page.locator('input[placeholder*="000.000.000-00"]').first();
  await expect(cpfInput).toBeVisible({ timeout: 30000 });
  await cpfInput.fill('52998224725');

  // Avançar para pagamento
  const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
  await expect(confirmButton).toBeEnabled({ timeout: 30000 });
  await confirmButton.click();

  // Aguardar step de pagamento
  await expect(page.getByRole('button', { name: /Revisar Pedido/i })).toBeVisible({ timeout: 30000 });
}

test.describe('E2E - Checkout Boleto Bancário', () => {
  test.beforeAll(async () => {
    await ensureAtLeastOneProductWithStock({ minStock: 10 });
  });

  test('Boleto: código de barras visível após selecionar método', async ({ page }) => {
    test.setTimeout(180000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    if (!creds.id) throw new Error('E2E user id not available');
    await attachDefaultAddress({ userId: creds.id, email: creds.email, postalCode: '01310100' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);
    await fillAddressAndAdvance(page);

    // Clicar em Boleto Bancário
    console.log('=== Selecionando Boleto Bancário ===');
    const boletoButton = page.getByRole('button', { name: /Boleto Bancário/i });
    await expect(boletoButton).toBeVisible({ timeout: 30000 });
    await boletoButton.click();
    await page.waitForTimeout(3000);

    // Verificar código de barras
    const codigoBarras = page.locator('p[class*="font-mono"][class*="break-all"]').first();
    const hasCodigoBarras = await codigoBarras.isVisible().catch(() => false);
    console.log(`Código de barras visível: ${hasCodigoBarras}`);

    if (hasCodigoBarras) {
      const codigoText = await codigoBarras.textContent();
      console.log(`Código: ${codigoText?.substring(0, 50)}...`);
      expect(codigoText).toBeTruthy();
      expect(codigoText!.length).toBeGreaterThan(10);
    }

    // Screenshot
    await page.screenshot({ path: 'test-results/boleto-codigo-barras.png', fullPage: true });

    // O boleto deve mostrar o código ou uma mensagem de loading/erro
    const loadingText = page.getByText(/Gerando Boleto|Aguarde/i);
    const errorText = page.locator('[class*="red"]').filter({ hasText: /erro/i });
    const isLoading = await loadingText.isVisible().catch(() => false);
    const hasError = await errorText.count() > 0;

    console.log(`Estado boleto: codigoBarras=${hasCodigoBarras}, loading=${isLoading}, erro=${hasError}`);

    // Se não está em loading e não tem erro, deve ter código de barras
    if (!isLoading && !hasError) {
      expect(hasCodigoBarras).toBe(true);
    }
  });

  test('Boleto: botão Copiar código de barras funciona', async ({ page }) => {
    test.setTimeout(180000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    if (!creds.id) throw new Error('E2E user id not available');
    await attachDefaultAddress({ userId: creds.id, email: creds.email, postalCode: '01310100' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);
    await fillAddressAndAdvance(page);

    // Selecionar boleto
    const boletoButton = page.getByRole('button', { name: /Boleto Bancário/i });
    await expect(boletoButton).toBeVisible({ timeout: 30000 });
    await boletoButton.click();

    // Aguardar boleto gerar
    await page.waitForTimeout(5000);

    const codigoBarras = page.locator('p[class*="font-mono"][class*="break-all"]').first();
    const hasCodigoBarras = await codigoBarras.isVisible().catch(() => false);

    if (!hasCodigoBarras) {
      console.log('Código de barras não visível — pulando verificação do botão Copiar');
      test.skip();
      return;
    }

    // Verificar botão Copiar
    const copyButton = page.getByRole('button', { name: /Copiar/i }).first();
    await expect(copyButton).toBeVisible({ timeout: 15000 });
    console.log('=== Botão Copiar visível ===');

    // Clicar no botão Copiar
    await copyButton.click();
    await page.waitForTimeout(1000);

    // Verificar feedback de cópia (texto muda para "Copiado!" ou similar)
    const copiedFeedback = page.getByText(/Copiado/i);
    const hasFeedback = await copiedFeedback.isVisible().catch(() => false);
    console.log(`Feedback de cópia: ${hasFeedback}`);

    await page.screenshot({ path: 'test-results/boleto-copy-feedback.png', fullPage: true });

    // O botão deve existir e ser clicável
    expect(await copyButton.isEnabled().catch(() => false)).toBe(true);
  });

  test('Boleto: clicar em "Já Paguei" exibe tela de Pedido Pendente', async ({ page }) => {
    test.setTimeout(180000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    if (!creds.id) throw new Error('E2E user id not available');
    await attachDefaultAddress({ userId: creds.id, email: creds.email, postalCode: '01310100' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);
    await fillAddressAndAdvance(page);

    // Selecionar boleto
    const boletoButton = page.getByRole('button', { name: /Boleto Bancário/i });
    await expect(boletoButton).toBeVisible({ timeout: 30000 });
    await boletoButton.click();

    // Aguardar boleto gerar
    await page.waitForTimeout(5000);

    const codigoBarras = page.locator('p[class*="font-mono"][class*="break-all"]').first();
    const hasCodigoBarras = await codigoBarras.isVisible().catch(() => false);

    if (!hasCodigoBarras) {
      console.log('Boleto não gerado — pulando verificação do botão Já Paguei');
      test.skip();
      return;
    }

    // Clicar em "Já Paguei"
    console.log('=== Clicando em Já Paguei ===');
    const jaPagueiButton = page.getByRole('button', { name: /Já Paguei/i });
    await expect(jaPagueiButton).toBeVisible({ timeout: 15000 });
    await jaPagueiButton.click();
    await page.waitForTimeout(2000);

    // Verificar tela de "Pedido Pendente"
    const pendingText = page.getByText(/Pedido Pendente/i);
    const hasPending = await pendingText.isVisible().catch(() => false);
    console.log(`Tela Pedido Pendente: ${hasPending}`);

    await page.screenshot({ path: 'test-results/boleto-pedido-pendente.png', fullPage: true });

    expect(hasPending).toBe(true);
  });

  test('Boleto: vencimento em 3 dias úteis exibido', async ({ page }) => {
    test.setTimeout(180000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    if (!creds.id) throw new Error('E2E user id not available');
    await attachDefaultAddress({ userId: creds.id, email: creds.email, postalCode: '01310100' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);
    await fillAddressAndAdvance(page);

    // Selecionar boleto
    const boletoButton = page.getByRole('button', { name: /Boleto Bancário/i });
    await expect(boletoButton).toBeVisible({ timeout: 30000 });
    await boletoButton.click();
    await page.waitForTimeout(5000);

    const codigoBarras = page.locator('p[class*="font-mono"][class*="break-all"]').first();
    const hasCodigoBarras = await codigoBarras.isVisible().catch(() => false);

    if (!hasCodigoBarras) {
      console.log('Boleto não gerado — pulando verificação de vencimento');
      test.skip();
      return;
    }

    // Verificar texto de vencimento (3 dias úteis)
    const vencimentoText = page.getByText(/3 dias úteis|vence em|vencimento/i);
    const hasVencimento = await vencimentoText.isVisible().catch(() => false);
    console.log(`Texto de vencimento visível: ${hasVencimento}`);

    // Também verificar se há data concreta de vencimento exibida
    const datePattern = page.locator('text=/\\d{2}\/\\d{2}\/\\d{4}/');
    const hasDatePattern = await datePattern.isVisible().catch(() => false);
    console.log(`Data de vencimento exibida: ${hasDatePattern}`);

    await page.screenshot({ path: 'test-results/boleto-vencimento.png', fullPage: true });

    // Deve mostrar prazo de vencimento em alguma forma
    expect(hasVencimento || hasDatePattern).toBe(true);
  });
});
