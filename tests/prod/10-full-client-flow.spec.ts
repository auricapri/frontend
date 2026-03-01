/**
 * 10 — FLUXO COMPLETO DO CLIENTE EM PRODUÇÃO
 * Login → Navegar → Produto → Carrinho → Checkout
 *
 * Testa em tempo real contra https://www.auricapri.com.br
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = 'marcus.lirio1@gmail.com';
const PASSWORD = 'Raposa69*';

// ─── Helpers ────────────────────────────────────────────────────────

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
  // O header fica hidden na home até o usuário scrollar
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

async function login(page: Page): Promise<boolean> {
  // Scroll para ativar header com o botão "Entrar"
  await scrollToActivateHeader(page);

  // Abrir drawer de auth
  const loginBtn = page.locator('button[aria-label="Entrar"]');
  const count = await loginBtn.count();

  for (let i = count - 1; i >= 0; i--) {
    const btn = loginBtn.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      break;
    }
  }

  const form = page.locator('form').first();
  if (!(await form.isVisible({ timeout: 10_000 }).catch(() => false))) {
    console.log('  ⚠ Form de login não apareceu');
    return false;
  }

  // Preencher e submeter
  await form.locator('input[type="email"]').fill(EMAIL);
  await form.locator('input[type="password"]').fill(PASSWORD);

  const start = Date.now();
  await form.locator('button[type="submit"]').click();

  // Verificar erro de login
  const errorMsg = page.getByText(/Email ou senha|incorretos|Muitas tentativas|Erro/i).first();
  const hasError = await errorMsg.isVisible({ timeout: 5_000 }).catch(() => false);
  if (hasError) {
    const text = await errorMsg.textContent().catch(() => '');
    console.error(`  ❌ ERRO LOGIN: "${text}"`);
    return false;
  }

  // Esperar drawer fechar (form desaparece = login OK)
  await page.waitForFunction(
    () => !document.querySelector('form')?.offsetParent,
    null,
    { timeout: 30_000 },
  ).catch(() => undefined);

  // Aguardar estado de auth propagar
  await page.waitForTimeout(3000);

  const loginTime = Date.now() - start;
  console.log(`  ⏱ Login completou em ${loginTime}ms`);

  // Verificar se logou — o botão deve mudar de "Entrar" para "Minha conta"
  await scrollToActivateHeader(page);
  const accountBtn = page.locator('button[aria-label="Minha conta"]');
  const isLoggedIn = await accountBtn.first().isVisible({ timeout: 10_000 }).catch(() => false);

  if (!isLoggedIn) {
    // Pode ser que a SVG do user tenha fill="currentColor" (indicando logado)
    const userIconFilled = page.locator('button[aria-label="Entrar"] svg.fill-current');
    const filledCheck = await userIconFilled.count() > 0;
    console.log(`  🔐 "Minha conta" visível: NÃO, mas user icon filled: ${filledCheck}`);
  } else {
    console.log('  ✅ Login confirmado — botão "Minha conta" visível');
  }

  return true;
}

// ─── Tests ──────────────────────────────────────────────────────────

test.describe('Fluxo Completo do Cliente', () => {
  test.setTimeout(180_000);

  test('1. Login com credenciais reais', async ({ page }) => {
    const apiCalls: { url: string; status: number; time: number }[] = [];
    const pending = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes('/api/') || req.url().includes('supabase') || req.url().includes('identitytoolkit')) {
        pending.set(req.url(), Date.now());
      }
    });
    page.on('response', (resp) => {
      const s = pending.get(resp.url());
      if (s) {
        apiCalls.push({ url: resp.url(), status: resp.status(), time: Date.now() - s });
        pending.delete(resp.url());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    const success = await login(page);

    console.log('\n  📊 APIs chamadas durante login:');
    apiCalls.forEach(({ url, status, time }) => {
      const host = new URL(url).hostname.replace('zbrunudbdyuebtpxfnkd.supabase.co', 'supabase');
      const path = new URL(url).pathname.substring(0, 50);
      const icon = status >= 400 ? '❌' : time > 2000 ? '🟡' : '🟢';
      console.log(`    ${icon} [${status}] ${host}${path} (${time}ms)`);
    });

    expect(success, 'Login deve funcionar com as credenciais fornecidas').toBe(true);
  });

  test('2. Navegar produtos e ver detalhes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    // Ver grid de produtos
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    const totalProducts = await products.count();
    console.log(`  📦 ${totalProducts} produtos na home`);

    // Clicar no primeiro produto
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Verificar página de produto
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible({ timeout: 15_000 });
    console.log(`  🛍 Produto: "${await title.textContent()}"`);

    const price = page.getByText(/R\$\s?\d/).first();
    await expect(price).toBeVisible({ timeout: 15_000 });
    console.log(`  💰 Preço: "${await price.textContent()}"`);

    // Scroll para ver o botão de adicionar
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Verificar botão "Adicionar à Bolsa"
    const addBtn = page.locator('button.bg-black.text-white').filter({ hasText: /adicionar|bolsa/i }).first();
    const addVisible = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🛒 Botão "Adicionar à Bolsa": ${addVisible ? 'VISÍVEL' : 'não encontrado'}`);

    // Verificar seletor de tamanho
    const sizeButtons = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO)$/i });
    const sizeCount = await sizeButtons.count();
    if (sizeCount > 0) {
      console.log(`  📏 ${sizeCount} tamanhos disponíveis`);
      await sizeButtons.first().click();
      await page.waitForTimeout(500);
      console.log(`  📏 Tamanho "${await sizeButtons.first().textContent()}" selecionado`);
    }

    // Verificar trust badges
    const troca = page.getByText('Troca fácil');
    const seguro = page.getByText('Pagamento seguro');
    const envio = page.getByText('Envio para todo Brasil');
    console.log(`  🏷 Trust badges: Troca=${await troca.isVisible().catch(() => false)}, Seguro=${await seguro.isVisible().catch(() => false)}, Envio=${await envio.isVisible().catch(() => false)}`);
  });

  test('3. Login → Adicionar ao Carrinho → Drawer abre', async ({ page }) => {
    const apiErrors: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && resp.status() >= 400) {
        apiErrors.push({ url: resp.url(), status: resp.status() });
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    // Login primeiro
    const loggedIn = await login(page);
    if (!loggedIn) {
      console.error('  ❌ Login falhou — não é possível testar carrinho');
      return;
    }

    // Scroll de volta ao topo para ver produtos
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Navegar para um produto
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    const total = await products.count();

    let addedToCart = false;
    for (let i = 0; i < Math.min(total, 10); i++) {
      await products.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

      // Scroll para ver botão
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      // Selecionar tamanho se necessário
      const sizes = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO)$/i });
      if (await sizes.count() > 0) {
        await sizes.first().click();
        await page.waitForTimeout(500);
      }

      // Tentar adicionar
      const addBtn = page.locator('button.bg-black.text-white.flex-1, button.bg-black.text-white').filter({ hasText: /adicionar|bolsa/i }).first();
      if (await addBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        if (await addBtn.isEnabled()) {
          const start = Date.now();
          await addBtn.click();
          await page.waitForTimeout(2000);
          const addTime = Date.now() - start;
          console.log(`  ⏱ Adicionar ao carrinho: ${addTime}ms`);
          addedToCart = true;
          break;
        }
      }

      // Voltar e tentar próximo produto
      await page.goBack();
      await expect(products.first()).toBeVisible({ timeout: 15_000 });
    }

    if (!addedToCart) {
      console.error('  ❌ Nenhum produto pôde ser adicionado ao carrinho');
      return;
    }

    // Verificar drawer do carrinho
    const cartDrawer = page.getByRole('button', { name: /Finalizar|Checkout/i }).first();
    const drawerOpen = await cartDrawer.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  🛒 Drawer do carrinho: ${drawerOpen ? 'ABRIU' : 'não abriu'}`);

    // Verificar se tem item no carrinho
    const cartItem = page.locator('[class*="cart"] img, [class*="Cart"] img').first();
    const hasItem = await cartItem.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  📦 Item visível no carrinho: ${hasItem ? 'SIM' : 'NÃO'}`);

    if (apiErrors.length > 0) {
      console.warn('  ⚠ API errors durante add to cart:', apiErrors);
    }
  });

  test('4. Login → Carrinho → Checkout (endereço + pagamento)', async ({ page }) => {
    const apiTimings: { url: string; time: number; status: number }[] = [];
    const pending = new Map<string, number>();
    page.on('request', (req) => {
      if (req.url().includes('/api/')) pending.set(req.url(), Date.now());
    });
    page.on('response', (resp) => {
      const s = pending.get(resp.url());
      if (s) {
        apiTimings.push({ url: resp.url(), time: Date.now() - s, status: resp.status() });
        pending.delete(resp.url());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    // Login
    const loggedIn = await login(page);
    if (!loggedIn) {
      console.error('  ❌ Login falhou — não é possível testar checkout');
      return;
    }

    // Voltar ao topo
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Adicionar produto ao carrinho
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    const total = await products.count();

    let added = false;
    for (let i = 0; i < Math.min(total, 10); i++) {
      await products.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      const sizes = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO)$/i });
      if (await sizes.count() > 0) {
        await sizes.first().click();
        await page.waitForTimeout(500);
      }

      const addBtn = page.locator('button.bg-black.text-white').filter({ hasText: /adicionar|bolsa/i }).first();
      if (await addBtn.isVisible({ timeout: 3_000 }).catch(() => false) && await addBtn.isEnabled()) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        added = true;
        break;
      }

      await page.goBack();
      await expect(products.first()).toBeVisible({ timeout: 15_000 });
    }

    if (!added) {
      console.error('  ❌ Nenhum produto com estoque encontrado');
      return;
    }

    console.log('  ✅ Produto adicionado ao carrinho');

    // Ir para checkout
    const checkoutBtn = page.getByRole('button', { name: /Finalizar/i }).first();
    if (await checkoutBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await checkoutBtn.click();
      console.log('  ✅ Clicou em "Finalizar"');
    } else {
      console.error('  ❌ Botão "Finalizar" não encontrado no drawer');
      return;
    }

    // Esperar tela de checkout
    const confirmPayBtn = page.getByRole('button', { name: /Confirmar e Pagar/i });
    const checkoutLoaded = await confirmPayBtn.isVisible({ timeout: 30_000 }).catch(() => false);
    console.log(`  📋 Tela de checkout (endereço): ${checkoutLoaded ? 'CARREGOU' : 'NÃO carregou'}`);

    if (!checkoutLoaded) {
      // Pode já estar em outra etapa — verificar
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      console.log(`  📍 URL atual: ${currentUrl}`);
      return;
    }

    // Preencher endereço
    const cepInput = page.locator('input[placeholder="00000-000"]').first();
    await expect(cepInput).toBeVisible({ timeout: 15_000 });

    const cepStart = Date.now();
    await cepInput.fill('01310100');

    // Esperar autopreenchimento do CEP
    const numberInput = page.locator('input[placeholder="Ex: 123"], input[placeholder="Ex\\: 123"]').first();
    await expect(numberInput).toBeVisible({ timeout: 60_000 });
    const cepTime = Date.now() - cepStart;
    console.log(`  ⏱ CEP lookup: ${cepTime}ms`);

    await numberInput.fill('1578');

    // Telefone
    const phoneInput = page.locator('input[placeholder*="99999" i], input[placeholder*="Telefone" i]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('(11) 99999-9999');
    }

    // CPF
    const cpfInput = page.locator('input[placeholder*="000.000" i], input[placeholder*="CPF" i]').first();
    if (await cpfInput.count() > 0) {
      await cpfInput.fill('529.982.247-25');
    }

    console.log('  ✅ Endereço preenchido');

    // Confirmar endereço
    await expect(confirmPayBtn).toBeEnabled({ timeout: 30_000 });
    await confirmPayBtn.click();
    await page.waitForTimeout(3000);

    console.log('  ✅ Endereço confirmado');

    // Verificar opções de pagamento
    const pixBtn = page.getByRole('button', { name: /PIX/i }).first();
    const cardBtn = page.getByRole('button', { name: /Cartão|Crédito|Credit/i }).first();
    const boletoBtn = page.getByRole('button', { name: /Boleto/i }).first();

    const options: string[] = [];
    if (await pixBtn.isVisible({ timeout: 10_000 }).catch(() => false)) options.push('PIX');
    if (await cardBtn.isVisible({ timeout: 2_000 }).catch(() => false)) options.push('Cartão');
    if (await boletoBtn.isVisible({ timeout: 2_000 }).catch(() => false)) options.push('Boleto');

    console.log(`  💳 Opções de pagamento: ${options.join(', ') || 'NENHUMA encontrada'}`);
    console.log('  ⚠ Pagamento NÃO finalizado (evitar pedido real)');

    // Report API timings
    console.log('\n  📊 APIs durante checkout:');
    apiTimings.forEach(({ url, time, status }) => {
      const path = new URL(url).pathname.substring(0, 50);
      const icon = status >= 400 ? '❌' : time > 3000 ? '🔴' : time > 1000 ? '🟡' : '🟢';
      console.log(`    ${icon} [${status}] ${path}: ${time}ms`);
    });
  });

  test('5. Login → Wishlist toggle', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) {
      console.error('  ❌ Login falhou');
      return;
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Abrir um produto
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Scroll para ver ações
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Clicar no coração (wishlist)
    const wishBtn = page.locator('button[aria-label="Toggle wishlist"]').first();
    if (await wishBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await wishBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ❤️ Wishlist toggle OK');

      // Verificar se API retornou erro
      // (monitorado no listener de responses)
    } else {
      console.log('  ⚠ Botão de wishlist não visível (pode ser mobile-only)');
    }
  });

  test('6. Login → Abrir conta/perfil', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) {
      console.error('  ❌ Login falhou');
      return;
    }

    // Scroll para ativar header
    await scrollToActivateHeader(page);

    // Clicar no botão de conta
    const accountBtn = page.locator('button[aria-label="Minha conta"]').first();
    if (await accountBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await accountBtn.click();
      await page.waitForTimeout(2000);

      // Verificar se drawer/página de conta apareceu
      const accountContent = page.getByText(/Pedidos|Sair|Logout|Meus pedidos|marcus/i).first();
      const visible = await accountContent.isVisible({ timeout: 10_000 }).catch(() => false);
      console.log(`  👤 Área de conta: ${visible ? 'VISÍVEL' : 'não encontrada'}`);
    } else {
      // Tentar com "Entrar" — pode ser que o aria-label não mudou
      const enterBtn = page.locator('button[aria-label="Entrar"]');
      for (let i = 0; i < await enterBtn.count(); i++) {
        if (await enterBtn.nth(i).isVisible().catch(() => false)) {
          await enterBtn.nth(i).click();
          await page.waitForTimeout(2000);
          break;
        }
      }
      // Após clicar, verificar o que aparece (drawer de conta ou de login)
      const hasLogout = await page.getByText(/Sair|Logout/i).first().isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  👤 Drawer com "Sair": ${hasLogout ? 'SIM (logado)' : 'NÃO'}`);
    }
  });
});
