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

  const { error: updateError } = await admin.from('profiles').update({ default_address_id: address.id }).eq('id', params.userId);
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
      const payload: Record<string, string | boolean> =
        cep === '01310100'
          ? { cep: '01310-100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' }
          : cep === '01001000'
            ? { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' }
            : { erro: true };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
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

  const { data: product, error: productError } = await admin.from('products').select('slug').eq('id', productId).maybeSingle();
  if (productError) throw productError;
  const slugObj = (product as { slug?: any } | null)?.slug;
  const slug = typeof slugObj === 'string' ? slugObj : (slugObj?.pt || slugObj?.en || slugObj?.es || slugObj?.fr);
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

  if (await waitForDrawer()) return;

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

  const cartDrawerClose = page.getByRole('button', { name: 'Close drawer', exact: true });
  await expect(cartDrawerClose).toBeVisible({ timeout: 30000 });
  const cartDrawer = cartDrawerClose.locator('xpath=ancestor::div[contains(@class,"fixed")][1]');
  const checkout = cartDrawer.locator('button.w-full.bg-black.text-white');
  await expect(checkout).toBeVisible({ timeout: 30000 });
  await checkout.click();

  await expect(page.getByRole('button', { name: /Confirmar e Pagar/i })).toBeVisible({ timeout: 30000 });
}

test.describe('Checkout - CEP e fluxo sem CEP', () => {
  test.beforeAll(async () => {
    await ensureAtLeastOneProductWithStock({ minStock: 10 });
  });

  test('Ao apagar CEP, campo fica vazio e não repovoa com CEP salvo', async ({ page }) => {
    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    if (!creds.id) throw new Error('E2E user id not available');
    await attachDefaultAddress({ userId: creds.id, email: creds.email, postalCode: '01310100' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    const cep = page.getByTestId('checkout-cep-input');
    await expect(cep).toHaveValue('01310-100', { timeout: 60000 });

    await cep.fill('');
    await expect(cep).toHaveValue('');

    await page.waitForTimeout(600);
    await expect(cep).toHaveValue('');

    await cep.fill('01001000');
    await expect(cep).toHaveValue('01001-000', { timeout: 60000 });
  });

  test('Sem CEP: confirmar localização oculta minimapa e permite avançar', async ({ page }) => {
    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    await page.getByTestId('open-map-picker').click();
    await expect(page.getByText(/Localizador/i)).toBeVisible({ timeout: 30000 });

    await page.getByPlaceholder('NOME DA RUA').fill('Rua Exemplo');
    await page.getByPlaceholder('BAIRRO').fill('Centro');
    await page.getByPlaceholder('CIDADE').fill('São Paulo');
    await page.getByPlaceholder('UF').fill('SP');

    const manualCep = page.locator('input[placeholder="00000-000"]').nth(1);
    await manualCep.fill('');

    await page.getByTestId('manual-address-confirm').click();

    await expect(page.getByTestId('checkout-minimap')).toHaveCount(0);
    await expect(page.getByTestId('checkout-cep-input')).toHaveValue('');

    await page.locator('input[placeholder="Ex: 123"], input[placeholder="Ex\: 123"]').first().fill('123');
    const confirm = page.getByRole('button', { name: /Confirmar e Pagar/i });
    await expect(confirm).toBeEnabled({ timeout: 60000 });
    await confirm.click();
    await expect(page.getByRole('button', { name: /Revisar Pedido/i })).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Checkout - Sem CEP (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Sem CEP: minimapa não aparece em viewport mobile', async ({ page }) => {
    await mockExternalApis(page);

    const creds = await createConfirmedE2EUser();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await loginViaAuthDrawer(page, creds);
    await goToCheckout(page);

    await page.getByTestId('open-map-picker').click();
    await expect(page.getByText(/Localizador/i)).toBeVisible({ timeout: 30000 });

    await page.getByPlaceholder('NOME DA RUA').fill('Rua Exemplo');
    await page.getByPlaceholder('BAIRRO').fill('Centro');
    await page.getByPlaceholder('CIDADE').fill('São Paulo');
    await page.getByPlaceholder('UF').fill('SP');

    const manualCep = page.locator('input[placeholder="00000-000"]').nth(1);
    await manualCep.fill('');

    await page.getByTestId('manual-address-confirm').click();
    await expect(page.getByTestId('checkout-minimap')).toHaveCount(0);
  });
});
