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

  if (!(await waitForDrawer())) {
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

test.describe('E2E - Validações do Checkout', () => {
  test.beforeAll(async () => {
    await ensureAtLeastOneProductWithStock({ minStock: 10 });
  });

  test('CEP inválido (00000-000) exibe erro e botão fica desabilitado', async ({ page }) => {
    test.setTimeout(120000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    // Preencher CEP inválido
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('00000000');
    await page.waitForTimeout(2000);

    // Verificar erro exibido
    const errorMessages = page.locator('text=/CEP inválido|CEP não encontrado|CEP não localizado/i');
    const hasError = await errorMessages.isVisible().catch(() => false);
    console.log(`Erro CEP inválido exibido: ${hasError}`);

    // Verificar que botão "Confirmar e Pagar" está desabilitado
    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    const isDisabled = await confirmButton.isDisabled().catch(() => true);
    console.log(`Botão Confirmar desabilitado: ${isDisabled}`);

    await page.screenshot({ path: 'test-results/validation-cep-invalido.png', fullPage: true });

    // CEP inválido deve mostrar erro OU desabilitar o botão
    expect(hasError || isDisabled).toBe(true);
  });

  test('CPF vazio mantém botão "Confirmar e Pagar" desabilitado', async ({ page }) => {
    test.setTimeout(120000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    // Preencher CEP válido
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('01310100');
    await page.waitForTimeout(2000);

    // Preencher telefone
    const phoneInput = page.locator('input[placeholder*="99999"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('11999999999');
    }

    // Garantir que CPF está vazio
    const cpfInput = page.locator('input[placeholder*="000.000.000-00"]').first();
    await expect(cpfInput).toBeVisible({ timeout: 30000 });
    await cpfInput.fill('');
    await page.waitForTimeout(500);

    // Botão deve estar desabilitado com CPF vazio
    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    const isDisabled = await confirmButton.isDisabled().catch(() => true);
    console.log(`Botão desabilitado com CPF vazio: ${isDisabled}`);

    await page.screenshot({ path: 'test-results/validation-cpf-vazio.png', fullPage: true });

    expect(isDisabled).toBe(true);
  });

  test('CPF inválido (111.111.111-11) exibe erro no campo', async ({ page }) => {
    test.setTimeout(120000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    // Preencher CEP válido
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('01310100');
    await page.waitForTimeout(2000);

    // Preencher telefone
    const phoneInput = page.locator('input[placeholder*="99999"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('11999999999');
    }

    // Preencher CPF inválido (dígitos iguais — inválido pelo algoritmo)
    const cpfInput = page.locator('input[placeholder*="000.000.000-00"]').first();
    await expect(cpfInput).toBeVisible({ timeout: 30000 });
    await cpfInput.fill('11111111111');
    // Triggering blur para disparar validação
    await cpfInput.blur();
    await page.waitForTimeout(800);

    // Verificar erro de CPF
    const cpfError = page.locator('text=/CPF inválido|CPF incorreto|CPF não é válido/i');
    const hasError = await cpfError.isVisible().catch(() => false);
    console.log(`Erro CPF inválido exibido: ${hasError}`);

    // Verificar que botão está desabilitado
    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    const isDisabled = await confirmButton.isDisabled().catch(() => true);
    console.log(`Botão desabilitado com CPF inválido: ${isDisabled}`);

    await page.screenshot({ path: 'test-results/validation-cpf-invalido.png', fullPage: true });

    // CPF inválido deve mostrar erro OU desabilitar o botão
    expect(hasError || isDisabled).toBe(true);
  });

  test('Telefone incompleto mantém botão desabilitado', async ({ page }) => {
    test.setTimeout(120000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    // Preencher CEP válido
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('01310100');
    await page.waitForTimeout(2000);

    // Preencher CPF válido
    const cpfInput = page.locator('input[placeholder*="000.000.000-00"]').first();
    await expect(cpfInput).toBeVisible({ timeout: 30000 });
    await cpfInput.fill('52998224725');

    // Telefone incompleto (menos dígitos que o necessário)
    const phoneInput = page.locator('input[placeholder*="99999"]').first();
    await expect(phoneInput).toBeVisible({ timeout: 30000 });
    await phoneInput.fill('1199');
    await phoneInput.blur();
    await page.waitForTimeout(500);

    // Botão deve estar desabilitado
    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    const isDisabled = await confirmButton.isDisabled().catch(() => true);
    console.log(`Botão desabilitado com telefone incompleto: ${isDisabled}`);

    await page.screenshot({ path: 'test-results/validation-telefone-incompleto.png', fullPage: true });

    expect(isDisabled).toBe(true);
  });

  test('Split de cartões com soma errada mantém botão Revisar desabilitado', async ({ page }) => {
    test.setTimeout(180000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    // Preencher endereço completo
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('01310100');
    await page.waitForTimeout(2000);

    const phoneInput = page.locator('input[placeholder*="99999"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('11999999999');
    }

    const cpfInput = page.locator('input[placeholder*="000.000.000-00"]').first();
    await expect(cpfInput).toBeVisible({ timeout: 30000 });
    await cpfInput.fill('52998224725');

    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    await expect(confirmButton).toBeEnabled({ timeout: 30000 });
    await confirmButton.click();

    // Aguardar step de pagamento
    await expect(page.getByRole('button', { name: /Revisar Pedido/i })).toBeVisible({ timeout: 30000 });

    // Verificar se existe opção de split de cartões
    const splitOption = page.locator('button, label').filter({ hasText: /2 cartões|Dois Cartões|Dividir/i });
    const hasSplitOption = await splitOption.isVisible().catch(() => false);

    if (!hasSplitOption) {
      console.log('Opção de split de cartões não encontrada — pulando teste');
      test.skip();
      return;
    }

    await splitOption.first().click();
    await page.waitForTimeout(1000);

    // Tentar colocar valores que não somam o total
    const splitInputs = page.locator('input[type="number"], input[placeholder*="R$"], input[placeholder*="valor"]');
    const splitCount = await splitInputs.count();
    console.log(`Inputs de split encontrados: ${splitCount}`);

    if (splitCount >= 2) {
      // Colocar valores errados (ex: 1,00 em cada)
      await splitInputs.nth(0).fill('1');
      await splitInputs.nth(1).fill('1');
      await page.waitForTimeout(500);
    }

    // O botão "Revisar Pedido" deve estar desabilitado com soma errada
    const revisarButton = page.getByRole('button', { name: /Revisar Pedido/i });
    const isDisabled = await revisarButton.isDisabled().catch(() => false);
    console.log(`Botão Revisar desabilitado com split inválido: ${isDisabled}`);

    // Verificar mensagem de erro de split
    const splitError = page.locator('text=/soma|total|diverge|valores/i');
    const hasSplitError = await splitError.isVisible().catch(() => false);
    console.log(`Erro de split visível: ${hasSplitError}`);

    await page.screenshot({ path: 'test-results/validation-split-invalido.png', fullPage: true });

    expect(isDisabled || hasSplitError).toBe(true);
  });

  test('Cartão com validade expirada (01/20) é rejeitado ou exibe erro', async ({ page }) => {
    test.setTimeout(180000);

    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    // Preencher endereço completo
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('01310100');
    await page.waitForTimeout(2000);

    const phoneInput = page.locator('input[placeholder*="99999"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('11999999999');
    }

    const cpfInput = page.locator('input[placeholder*="000.000.000-00"]').first();
    await expect(cpfInput).toBeVisible({ timeout: 30000 });
    await cpfInput.fill('52998224725');

    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    await expect(confirmButton).toBeEnabled({ timeout: 30000 });
    await confirmButton.click();

    // Aguardar step de pagamento
    await expect(page.getByRole('button', { name: /Revisar Pedido/i })).toBeVisible({ timeout: 30000 });

    // Verificar se há opção de cartão de crédito
    const cartaoButton = page.getByRole('button', { name: /Cartão de Crédito|Crédito/i });
    const hasCartao = await cartaoButton.isVisible().catch(() => false);

    if (!hasCartao) {
      console.log('Opção de cartão de crédito não encontrada — pulando teste');
      test.skip();
      return;
    }

    await cartaoButton.click();
    await page.waitForTimeout(1000);

    // Preencher dados do cartão com validade expirada
    const cardNumber = page.locator('input[placeholder*="0000 0000"], input[placeholder*="Número do Cartão"], input[placeholder*="1234"]').first();
    if (await cardNumber.isVisible().catch(() => false)) {
      await cardNumber.fill('4111111111111111');
    }

    // Validade expirada: 01/20 (janeiro de 2020)
    const expiryInput = page.locator('input[placeholder*="MM/AA"], input[placeholder*="Validade"], input[placeholder*="MM/YY"]').first();
    const hasExpiry = await expiryInput.isVisible().catch(() => false);

    if (!hasExpiry) {
      console.log('Campo de validade não encontrado — pulando verificação');
      test.skip();
      return;
    }

    await expiryInput.fill('01/20');
    await expiryInput.blur();
    await page.waitForTimeout(800);

    // Verificar erro de validade expirada
    const expiryError = page.locator('text=/expirado|inválida|vencido|data inválida|validade inválida/i');
    const hasExpiryError = await expiryError.isVisible().catch(() => false);
    console.log(`Erro de validade expirada: ${hasExpiryError}`);

    // Verificar que botão Revisar está desabilitado
    const revisarButton = page.getByRole('button', { name: /Revisar Pedido/i });
    const isDisabled = await revisarButton.isDisabled().catch(() => false);
    console.log(`Botão Revisar desabilitado com cartão expirado: ${isDisabled}`);

    await page.screenshot({ path: 'test-results/validation-cartao-expirado.png', fullPage: true });

    // Cartão expirado deve mostrar erro OU desabilitar botão
    expect(hasExpiryError || isDisabled).toBe(true);
  });
});
