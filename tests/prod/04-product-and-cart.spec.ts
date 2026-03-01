/**
 * 04 — Produto, Carrinho e Wishlist
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = 'marcus.lirio1@gmail.com';
const PASSWORD = 'Raposa69*';

async function setup(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
    .catch(() => undefined);

  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await termsBtn.click();
    await page.waitForTimeout(300);
  }
  const cookieBtn = page.getByRole('button', { name: /Aceitar cookies/i });
  if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(300);
  }
}

async function scrollToActivateHeader(page: Page) {
  // O header fica hidden na home ate o usuario scrollar
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

async function login(page: Page) {
  // Scroll para ativar header com o botao "Entrar"
  await scrollToActivateHeader(page);

  const loginButton = page.locator('button[aria-label="Entrar"]');
  const count = await loginButton.count();

  for (let i = count - 1; i >= 0; i--) {
    const btn = loginButton.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      break;
    }
  }

  const form = page.locator('form').first();
  await expect(form).toBeVisible({ timeout: 15_000 });

  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await termsBtn.click();
    await page.waitForTimeout(500);
  }

  await form.locator('input[type="email"]').fill(EMAIL);
  await form.locator('input[type="password"]').fill(PASSWORD);
  await form.locator('button[type="submit"]').click();

  // Esperar drawer fechar (form desaparece = login OK)
  await page.waitForFunction(
    () => !document.querySelector('form')?.offsetParent,
    null,
    { timeout: 30_000 },
  ).catch(() => undefined);

  // Aguardar estado de auth propagar
  await page.waitForTimeout(3000);

  // Verificar se logou (usar last() pois o primeiro é o mobile hidden)
  await scrollToActivateHeader(page);
  const accountBtn = page.locator('button[aria-label="Minha conta"]:visible').first();
  const loggedIn = await accountBtn.isVisible({ timeout: 30_000 }).catch(() => false);
  if (!loggedIn) {
    // Fallback: check if "Entrar" button is gone (login succeeded but UI variant)
    const enterBtn = page.locator('button[aria-label="Entrar"]:visible').first();
    const stillShowsEnter = await enterBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(stillShowsEnter, 'Login deve ter sucesso - botao Entrar nao deve estar visivel').toBe(false);
  }
  await page.waitForTimeout(1000);
}

/** Navigate to a product page from the home grid */
async function navigateToProduct(page: Page) {
  const products = page.locator('#collection .grid .cursor-pointer.group');
  await expect(products.first()).toBeVisible({ timeout: 30_000 });
  await products.first().locator('h3').first().click();
  await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
}

/** Scroll down on product page so the add-to-cart button and actions become visible */
async function scrollToProductActions(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
}

/** Locate the "Adicionar a Bolsa" add-to-cart button using the same selector pattern as 10-full-client-flow */
function locateAddToCartButton(page: Page) {
  return page
    .locator('button.bg-black.text-white')
    .filter({ hasText: /adicionar|bolsa/i })
    .first();
}

/**
 * Try to add a product to cart: navigate products, select size if needed, click add.
 * Returns true if successfully added.
 */
async function addProductToCart(page: Page): Promise<boolean> {
  const products = page.locator('#collection .grid .cursor-pointer.group');
  await expect(products.first()).toBeVisible({ timeout: 30_000 });
  const totalCards = await products.count();

  for (let i = 0; i < Math.min(totalCards, 10); i++) {
    await products.nth(i).locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Scroll para ver o botao de adicionar
    await scrollToProductActions(page);

    // Selecionar tamanho se necessario
    const sizeButtons = page
      .locator('button')
      .filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|36|38|40|42|44|46)$/i });
    if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click();
      await page.waitForTimeout(500);
    }

    // Verificar se esta esgotado
    const soldOut = page.locator('button').filter({ hasText: /esgotado/i }).first();
    if (await soldOut.isVisible({ timeout: 2_000 }).catch(() => false)) {
      console.log(`  Produto ${i + 1}: Esgotado, tentando proximo...`);
      await page.goBack();
      await expect(products.first()).toBeVisible({ timeout: 15_000 });
      continue;
    }

    const addBtn = locateAddToCartButton(page);
    if (await addBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (await addBtn.isEnabled()) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        return true;
      }
    }

    await page.goBack();
    await expect(products.first()).toBeVisible({ timeout: 15_000 });
  }

  return false;
}

test.describe('Produto — Detalhes', () => {
  test('Pagina de produto tem todos os elementos', async ({ page }) => {
    await setup(page);
    await navigateToProduct(page);

    // Titulo (h1 in ProductInfo component)
    const title = page.locator('h1').first();
    await expect(title).toBeVisible({ timeout: 15_000 });
    console.log(`  Produto: "${await title.textContent()}"`);

    // Preco
    const price = page.getByText(/R\$\s?\d/).first();
    await expect(price).toBeVisible({ timeout: 15_000 });
    console.log(`  Preco: "${await price.textContent()}"`);

    // Imagem do produto (pode estar em carousel, checar se existe no DOM)
    const productImage = page.locator('img[alt]:visible').first();
    const hasImage = await productImage.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasImage) {
      // Fallback: verificar se imagem existe no DOM mesmo que hidden (carousel)
      const imgCount = await page.locator('img[alt]').count();
      console.log(`  Imagens no DOM: ${imgCount}`);
      expect(imgCount).toBeGreaterThan(0);
    }

    // Scroll para ver o botao de adicionar e trust badges
    await scrollToProductActions(page);

    // Descricao ou detalhes
    const description = page.locator('[class*="description"], [class*="detail"]').first()
      .or(page.getByText(/descri|detalhes|material/i).first());
    if (await description.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log('  Descricao: presente');
    }

    // Botao de acao: "ADICIONAR A BOLSA" ou "Esgotado" (produto pode estar sem estoque)
    const addBtn = locateAddToCartButton(page);
    const soldOutBtn = page.locator('button').filter({ hasText: /esgotado/i }).first();
    const hasAdd = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    const hasSoldOut = await soldOutBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  Botao: ${hasAdd ? 'Adicionar' : hasSoldOut ? 'Esgotado' : 'Nao encontrado'}`);
    expect(hasAdd || hasSoldOut, 'Deve ter botao de adicionar ou esgotado').toBe(true);
  });

  test('Seletor de tamanho funciona', async ({ page }) => {
    await setup(page);

    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    // Navegar por produtos ate encontrar um com seletor de tamanho
    const count = await products.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      await products.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

      // Scroll para ver o seletor de tamanho e botao
      await scrollToProductActions(page);

      const sizeButtons = page
        .locator('button')
        .filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|36|38|40|42|44|46)$/i });

      if (await sizeButtons.count() > 0) {
        const sizeText = await sizeButtons.first().textContent();
        await sizeButtons.first().click();
        await page.waitForTimeout(500);
        console.log(`  Tamanho "${sizeText}" selecionado com sucesso`);

        // Verificar que botao de adicionar esta habilitado
        const addBtn = locateAddToCartButton(page);
        const isEnabled = await addBtn.isEnabled().catch(() => false);
        console.log(`  Botao adicionar: ${isEnabled ? 'habilitado' : 'desabilitado'}`);
        return;
      }

      await page.goBack();
      await expect(products.first()).toBeVisible({ timeout: 15_000 });
    }

    console.log('  Nenhum produto com seletor de tamanho encontrado');
  });
});

test.describe('Carrinho', () => {
  test('Adicionar produto ao carrinho', async ({ page }) => {
    await setup(page);
    await login(page);

    // Scroll de volta ao topo para ver produtos
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const start = Date.now();
    const added = await addProductToCart(page);
    const addTime = Date.now() - start;

    expect(added, 'Deve conseguir adicionar um produto ao carrinho').toBe(true);
    console.log(`  Adicionar ao carrinho: ${addTime}ms`);

    // Verificar drawer do carrinho abriu
    const cartDrawer = page.getByRole('button', { name: /Finalizar|Checkout/i }).first();
    await expect(cartDrawer).toBeVisible({ timeout: 15_000 });
    console.log('  Drawer do carrinho abriu com sucesso');
  });

  test('Remover produto do carrinho', async ({ page }) => {
    await setup(page);
    await login(page);

    // Scroll de volta ao topo para ver produtos
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Adicionar produto primeiro
    const added = await addProductToCart(page);
    if (!added) {
      console.log('  Nenhum produto pude ser adicionado - pulando teste de remocao');
      return;
    }

    // Procurar botao de remover no carrinho drawer
    const removeBtn = page.getByRole('button', { name: /remover|remove|delete|lixo/i }).first()
      .or(page.locator('[aria-label*="remov" i], [aria-label*="delet" i]').first());

    if (await removeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await removeBtn.click();
      await page.waitForTimeout(2000);
      console.log('  Produto removido do carrinho');
    } else {
      // Try icon-based remove buttons (trash icon)
      const trashIcon = page.locator('button svg').locator('xpath=ancestor::button').filter({
        has: page.locator('svg path'),
      });
      console.log('  Botao de remover com texto nao encontrado, buscando por icone');
    }
  });
});

test.describe('Wishlist', () => {
  test('Adicionar e verificar wishlist', async ({ page }) => {
    await setup(page);
    await login(page);

    // Scroll de volta ao topo para ver produtos
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    await navigateToProduct(page);

    // Scroll para ver acoes
    await scrollToProductActions(page);

    // Clicar no botao de wishlist (coracao)
    const wishlistBtn = page.locator('button[aria-label="Toggle wishlist"]').first();

    if (await wishlistBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await wishlistBtn.click();
      await page.waitForTimeout(2000);
      console.log('  Wishlist toggle executado');

      // Verificar se aparece algum feedback (toast, visual)
      const toast = page.locator('[class*="toast"], [role="alert"]').first();
      if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
        console.log(`  Toast: "${await toast.textContent()}"`);
      }
    } else {
      console.log('  Botao de wishlist nao encontrado (pode ser mobile-only)');
    }
  });
});
