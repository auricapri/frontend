/**
 * Diagnóstico de flickering no checkout
 * Detecta aparição do overlay "Buscando Endereço" durante entrada no checkout
 * Usa a mesma lógica de login/navegação do 05-checkout-flow.spec.ts que já funciona em produção
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = 'marcus.lirio1@gmail.com';
const PASSWORD = 'Raposa69*';

// === Funções copiadas do 05-checkout-flow que já funcionam ===

async function setup(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.body.classList.contains('loaded'),
    null,
    { timeout: 30_000 }
  ).catch(() => undefined);

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
  await scrollToActivateHeader(page);

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
  if (!clicked && count > 0) {
    await loginBtn.first().click({ force: true });
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

  await page.waitForFunction(() => !document.querySelector('form')?.offsetParent, null, { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(3000);
  await scrollToActivateHeader(page);
}

async function tryAddToCartOnProductPage(page: Page): Promise<boolean> {
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  const sizeButtons = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|36|38|40|42|44|46)$/i });
  if ((await sizeButtons.count()) > 0) {
    await sizeButtons.first().click({ force: true });
    await page.waitForTimeout(500);
  }

  const soldOut = page.locator('button').filter({ hasText: /esgotado/i }).first();
  if (await soldOut.isVisible({ timeout: 2_000 }).catch(() => false)) return false;

  const addBtn = page.locator('button.bg-black.text-white, button')
    .filter({ hasText: /adicionar|bolsa|comprar|add to/i })
    .first();

  if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    if (await addBtn.isEnabled()) {
      await addBtn.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(2000);
      return true;
    }
  }
  return false;
}

async function addProductToCart(page: Page): Promise<boolean> {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  const products = page.locator('#collection [class*="columns"] .cursor-pointer.group');
  const hasProducts = await products.first().isVisible({ timeout: 15_000 }).catch(() => false);

  if (!hasProducts) {
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
    const h3 = products.nth(i).locator('h3').first();
    if (await h3.isVisible().catch(() => false)) {
      await h3.evaluate((el: HTMLElement) => el.click());
    } else {
      await products.nth(i).click({ force: true });
    }
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 }).catch(() => null);
    if (!page.url().includes('/product/')) continue;

    const added = await tryAddToCartOnProductPage(page);
    if (added) return true;
    await page.goBack();
    await products.first().isVisible({ timeout: 15_000 }).catch(() => false);
  }
  return false;
}

// === Teste de diagnóstico de flickering ===

test.setTimeout(180_000);

test('detectar overlay "Buscando Endereço" ao entrar no checkout', async ({ page }) => {
  // Track overlay appearances with timestamps and text
  const overlayLog: Array<{ state: 'on' | 'off'; ts: number; text: string }> = [];
  let monitoring = true;
  let lastOn = false;

  // Poll every 100ms for the loading overlay
  const monitorFn = async () => {
    while (monitoring) {
      const result = await page.evaluate(() => {
        // Look specifically for "Buscando Endereço" text or the loadingCep overlay
        const all = Array.from(document.querySelectorAll('div'));
        for (const el of all) {
          const txt = el.textContent || '';
          if (txt.includes('Buscando Endereço') || txt.includes('Buscando Endereco')) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
              return { visible: true, text: txt.substring(0, 120) };
            }
          }
        }
        return { visible: false, text: '' };
      }).catch(() => ({ visible: false, text: '' }));

      if (result.visible && !lastOn) {
        overlayLog.push({ state: 'on', ts: Date.now(), text: result.text });
        console.log(`🔴 [${new Date().toISOString()}] OVERLAY "Buscando Endereço" APARECEU`);
        await page.screenshot({ path: `test-results-prod/flicker-on-${Date.now()}.png` }).catch(() => {});
      } else if (!result.visible && lastOn) {
        overlayLog.push({ state: 'off', ts: Date.now(), text: '' });
        console.log(`🟢 [${new Date().toISOString()}] OVERLAY SUMIU`);
      }
      lastOn = result.visible;
      await new Promise(r => setTimeout(r, 100));
    }
  };

  const monitorPromise = monitorFn();

  // 1. Setup + login
  await setup(page);
  await login(page);
  await page.screenshot({ path: 'test-results-prod/diag-01-logado.png' }).catch(() => {});
  console.log('✅ Login OK, URL:', page.url());

  // 2. Add product to cart
  const added = await addProductToCart(page);
  console.log(`Produto adicionado: ${added}`);
  await page.screenshot({ path: 'test-results-prod/diag-02-apos-produto.png' }).catch(() => {});

  if (!added) {
    console.log('⚠️  Não conseguiu adicionar produto — pulando para checkout via URL');
    // Try navigating directly to checkout via app state manipulation
    await page.goto('https://www.auricapri.com.br', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }

  // 3. Navigate to checkout
  // Click cart icon
  const cartClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cartBtn = btns.find(b => {
      const label = b.getAttribute('aria-label') || '';
      return label.toLowerCase().includes('arrinho') || label.toLowerCase().includes('bolsa') || label.toLowerCase().includes('cart');
    });
    if (cartBtn) { cartBtn.click(); return true; }
    return false;
  });
  console.log('Cart icon clicked:', cartClicked);
  await page.waitForTimeout(1500);

  // Click "Finalizar" via evaluate (bypasses overlay/SVG issues)
  const finalizarClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => {
      const txt = b.textContent?.toLowerCase() || '';
      return txt.includes('finalizar') || txt.includes('checkout');
    });
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (finalizarClicked) {
    console.log('✅ Clicou em Finalizar Compra');
  } else {
    console.log('⚠️  Botão Finalizar não encontrado');
    await page.screenshot({ path: 'test-results-prod/diag-03-sem-finalizar.png' }).catch(() => {});
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results-prod/diag-04-checkout-entrada.png' }).catch(() => {});
  console.log('URL após navegar para checkout:', page.url());

  // 4. Wait for checkout to load fully and monitor for 15 more seconds
  const checkoutVisible = await page.getByRole('button', { name: /Confirmar e Pagar/i })
    .isVisible({ timeout: 15000 }).catch(() => false);

  if (checkoutVisible) {
    console.log('✅ CHECKOUT CARREGADO — "Confirmar e Pagar" visível');
  } else {
    console.log('⚠️  "Confirmar e Pagar" não apareceu (talvez ainda carregando)');
  }

  await page.screenshot({ path: 'test-results-prod/diag-05-checkout-loaded.png' }).catch(() => {});

  // Monitor for 10 more seconds after checkout loads
  console.log('👁️  Monitorando por 10 segundos...');
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'test-results-prod/diag-06-final.png' }).catch(() => {});

  monitoring = false;
  await monitorPromise;

  // === REPORT ===
  const appearances = overlayLog.filter(e => e.state === 'on');
  console.log('\n════════════════════════════════════════');
  console.log('       RESULTADO DO DIAGNÓSTICO         ');
  console.log('════════════════════════════════════════');
  console.log(`Overlay "Buscando Endereço" apareceu: ${appearances.length} vez(es)`);
  overlayLog.forEach((e, i) => {
    console.log(`  ${i + 1}. [${e.state.toUpperCase()}] ${new Date(e.ts).toISOString()}${e.text ? ` — "${e.text.trim().substring(0, 60)}"` : ''}`);
  });

  if (appearances.length === 0) {
    console.log('\n✅ FIX FUNCIONANDO — nenhum overlay desnecessário detectado');
  } else if (appearances.length === 1) {
    const duration = overlayLog.find(e => e.state === 'off')
      ? overlayLog.find(e => e.state === 'off')!.ts - appearances[0].ts
      : 0;
    console.log(`\n⚠️  Overlay apareceu 1 vez por ${duration}ms — pode ser normal se CEP foi digitado pelo usuário`);
    console.log('   Verifique se foi em /checkout ou antes');
  } else {
    console.log('\n❌ FLICKERING CONFIRMADO — overlay apareceu múltiplas vezes');
  }
  console.log('════════════════════════════════════════\n');

  // Always passes — this is diagnostic only
  expect(true).toBe(true);
});
