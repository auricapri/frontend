/**
 * 11 — AUDITORIA UX/UI COMPLETA
 * Foco: usabilidade, feedback visual, acessibilidade, experiência do usuário
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

// ─── HOME PAGE UX ───────────────────────────────────────────────────

test.describe('UX — Home Page', () => {
  test('Hero/Splash: usuario consegue navegar para os produtos facilmente?', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Verificar se há indicação visual para scrollar (seta, texto, etc)
    const scrollIndicator = page.locator('[class*="scroll"], [class*="arrow-down"], [class*="chevron"]').first();
    const hasScrollHint = await scrollIndicator.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📜 Indicador de scroll na hero: ${hasScrollHint ? 'SIM' : '❌ NÃO — usuário pode não saber que deve scrollar'}`);

    // Verificar se os produtos estão visíveis sem scroll (above the fold)
    const productsAboveFold = await page.evaluate(() => {
      const grid = document.querySelector('#collection .grid');
      if (!grid) return false;
      const rect = grid.getBoundingClientRect();
      return rect.top < window.innerHeight;
    });
    console.log(`  📦 Produtos visíveis sem scroll: ${productsAboveFold ? 'SIM' : '❌ NÃO — escondidos pela hero'}`);

    // Verificar altura da hero section
    const heroHeight = await page.evaluate(() => {
      // A hero é provavelmente o primeiro child grande antes do #collection
      const body = document.body;
      const collection = document.querySelector('#collection');
      if (!collection) return 0;
      return (collection as HTMLElement).offsetTop;
    });
    console.log(`  📐 Altura da hero/splash: ${heroHeight}px (viewport: ${await page.evaluate(() => window.innerHeight)}px)`);
    if (heroHeight > 900) {
      console.log(`  ⚠ Hero ocupa mais que a tela inteira — produtos ficam escondidos`);
    }
  });

  test('Navbar: acessibilidade dos controles de navegação', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // Testar visibilidade da navbar em diferentes posições de scroll
    const positions = [0, 200, 400, 600, 800];
    for (const pos of positions) {
      await page.evaluate((y) => window.scrollTo(0, y), pos);
      await page.waitForTimeout(500);

      const navVisible = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (!nav) return false;
        const style = window.getComputedStyle(nav);
        const rect = nav.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.opacity !== '0' && rect.height > 0;
      });

      const headerVisible = await page.evaluate(() => {
        const header = document.querySelector('header');
        if (!header) return false;
        const style = window.getComputedStyle(header);
        return style.visibility !== 'hidden' && style.display !== 'none';
      });

      console.log(`  📍 Scroll ${pos}px → nav: ${navVisible ? '✅' : '❌ hidden'}, header: ${headerVisible ? '✅' : '❌ hidden'}`);
    }

    // Verificar se ícones da navbar tem labels acessíveis
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    const buttons = page.locator('nav button, header button');
    const btnCount = await buttons.count();
    let withLabel = 0;
    let withoutLabel = 0;
    for (let i = 0; i < btnCount; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label');
      if (label) withLabel++;
      else withoutLabel++;
    }
    console.log(`  ♿ Botões na navbar: ${withLabel} com aria-label, ${withoutLabel} sem`);
  });

  test('Banner de benefícios: legibilidade e conteúdo', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    // O banner de frete grátis / parcelas está no topo
    const topBanner = page.locator('[class*="fixed"][class*="top-0"], [class*="z-\\[51\\]"]').first();
    const bannerVisible = await topBanner.isVisible({ timeout: 5_000 }).catch(() => false);

    if (bannerVisible) {
      const bannerText = await topBanner.textContent();
      const bannerHeight = await topBanner.evaluate((el) => el.offsetHeight);
      const fontSize = await topBanner.evaluate((el) => window.getComputedStyle(el).fontSize);
      console.log(`  📢 Banner topo: "${bannerText?.substring(0, 80)}"`);
      console.log(`  📐 Altura: ${bannerHeight}px, Fonte: ${fontSize}`);

      // Verificar se texto é legível (muito pequeno?)
      const fSize = parseFloat(fontSize);
      if (fSize < 11) {
        console.log(`  ⚠ Fonte do banner muito pequena (${fSize}px) — difícil de ler`);
      }
    }
  });
});

// ─── PRODUCT PAGE UX ────────────────────────────────────────────────

test.describe('UX — Página de Produto', () => {
  test('CTA "Adicionar à Bolsa" está visível sem scroll?', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });

    // Esperar produto carregar
    await page.waitForTimeout(2000);

    // Verificar se o botão de adicionar está acima do fold
    const addBtnAboveFold = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('adicionar') || text.includes('bolsa')) {
          const rect = btn.getBoundingClientRect();
          return {
            visible: rect.top < window.innerHeight,
            top: rect.top,
            viewportHeight: window.innerHeight,
            text: btn.textContent?.trim(),
          };
        }
      }
      return null;
    });

    if (addBtnAboveFold) {
      const aboveFold = addBtnAboveFold.visible;
      console.log(`  🛒 Botão "${addBtnAboveFold.text}" posição: ${Math.round(addBtnAboveFold.top)}px (viewport: ${addBtnAboveFold.viewportHeight}px)`);
      console.log(`  🛒 Acima do fold: ${aboveFold ? '✅ SIM' : '❌ NÃO — usuário precisa scrollar para comprar!'}`);
    } else {
      console.log('  ❌ Botão "Adicionar à Bolsa" NÃO ENCONTRADO na página!');
    }

    // Verificar informações essenciais acima do fold
    const essentials = await page.evaluate(() => {
      const vh = window.innerHeight;
      const checks: Record<string, boolean> = {};

      // Título
      const h1 = document.querySelector('h1, h2');
      checks['titulo'] = h1 ? h1.getBoundingClientRect().top < vh : false;

      // Preço
      const priceEl = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.match(/R\$\s?\d/) && el.children.length === 0);
      checks['preco'] = priceEl ? priceEl.getBoundingClientRect().top < vh : false;

      // Imagem
      const img = document.querySelector('img[src*="cloudfront"], img[src*="supabase"], img[src*="storage"]');
      checks['imagem'] = img ? img.getBoundingClientRect().top < vh : false;

      return checks;
    });

    console.log(`  📋 Elementos acima do fold:`);
    console.log(`    Título: ${essentials.titulo ? '✅' : '❌'}`);
    console.log(`    Preço: ${essentials.preco ? '✅' : '❌'}`);
    console.log(`    Imagem: ${essentials.imagem ? '✅' : '❌'}`);
  });

  test('Feedback visual ao interagir com produto', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    // Hover no card de produto — verificar se tem efeito visual
    await products.first().hover();
    await page.waitForTimeout(500);

    // Verificar cursor
    const cursor = await products.first().evaluate((el) => window.getComputedStyle(el).cursor);
    console.log(`  👆 Cursor no card de produto: ${cursor}`);

    // Clicar num produto
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Scroll para ver seletor de tamanho
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(500);

    // Verificar feedback ao selecionar tamanho
    const sizes = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO)$/i });
    if (await sizes.count() > 0) {
      const beforeClass = await sizes.first().getAttribute('class');
      await sizes.first().click();
      await page.waitForTimeout(300);
      const afterClass = await sizes.first().getAttribute('class');
      const changed = beforeClass !== afterClass;
      console.log(`  📏 Feedback visual ao selecionar tamanho: ${changed ? '✅ muda estilo' : '❌ sem mudança visual'}`);
    }
  });

  test('Galeria de imagens do produto', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    await products.first().locator('h3').first().click();
    await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Quantas imagens do produto existem?
    const productImages = page.locator('img[src*="cloudfront"], img[src*="supabase"], img[src*="storage"]');
    const imgCount = await productImages.count();
    console.log(`  🖼 Imagens do produto: ${imgCount}`);

    // Verificar se tem thumbnails/navegação de galeria
    const thumbnails = page.locator('[class*="thumbnail"], [class*="thumb"], [class*="gallery"] img');
    const thumbCount = await thumbnails.count();
    console.log(`  🖼 Thumbnails de galeria: ${thumbCount > 0 ? `${thumbCount} encontrados` : '❌ sem thumbnails'}`);

    // Verificar se imagem principal tem zoom ou lightbox
    const mainImg = productImages.first();
    if (await mainImg.isVisible().catch(() => false)) {
      const imgCursor = await mainImg.evaluate((el) => window.getComputedStyle(el).cursor);
      console.log(`  🔍 Cursor na imagem: ${imgCursor} (esperado: zoom-in ou pointer para lightbox)`);
    }
  });
});

// ─── LOGIN/AUTH UX ──────────────────────────────────────────────────

test.describe('UX — Autenticação', () => {
  test('Feedback visual durante e após login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

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
    await expect(form).toBeVisible({ timeout: 10_000 });

    // Verificar se tem indicador de loading no submit
    await form.locator('input[type="email"]').fill(EMAIL);
    await form.locator('input[type="password"]').fill(PASSWORD);

    const submitBtn = form.locator('button[type="submit"]');
    const submitText = await submitBtn.textContent();
    console.log(`  📝 Texto do botão submit: "${submitText}"`);

    await submitBtn.click();

    // Verificar se botão muda para loading state
    await page.waitForTimeout(500);
    const loadingState = await submitBtn.evaluate((el) => {
      return {
        text: el.textContent?.trim(),
        disabled: (el as HTMLButtonElement).disabled,
        hasSpinner: !!el.querySelector('svg, [class*="spin"], [class*="load"]'),
        opacity: window.getComputedStyle(el).opacity,
      };
    });
    console.log(`  ⏳ Estado durante login: text="${loadingState.text}", disabled=${loadingState.disabled}, spinner=${loadingState.hasSpinner}`);

    // Esperar login completar
    await page.waitForTimeout(5000);

    // Verificar feedback pós-login
    // 1. Drawer fechou?
    const drawerClosed = !(await form.isVisible().catch(() => true));
    console.log(`  📋 Drawer fechou após login: ${drawerClosed ? '✅' : '❌ ainda aberto'}`);

    // 2. Toast/notificação de sucesso?
    const toast = page.locator('[class*="toast"], [role="alert"], [class*="notification"]').first();
    const hasToast = await toast.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📢 Toast de sucesso: ${hasToast ? '✅' : '❌ nenhum feedback visual de login!'}`);

    // 3. Ícone do usuário mudou?
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    const userIconState = await page.evaluate(() => {
      const btns = document.querySelectorAll('button[aria-label="Minha conta"], button[aria-label="Entrar"]');
      const results: { label: string; svgFill: boolean }[] = [];
      btns.forEach(btn => {
        const svg = btn.querySelector('svg');
        results.push({
          label: btn.getAttribute('aria-label') || 'none',
          svgFill: svg?.classList.contains('fill-current') || false,
        });
      });
      return results;
    });
    console.log(`  👤 Estado do ícone de usuário após login:`);
    userIconState.forEach(s => {
      console.log(`    aria-label="${s.label}", SVG preenchido: ${s.svgFill}`);
    });
  });
});

// ─── CART UX ────────────────────────────────────────────────────────

test.describe('UX — Carrinho', () => {
  test('Feedback ao adicionar produto ao carrinho', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { console.error('  ❌ Login falhou'); return; }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });

    // Navegar para produto e adicionar
    const total = await products.count();
    for (let i = 0; i < Math.min(total, 10); i++) {
      await products.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      const sizes = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO)$/i });
      if (await sizes.count() > 0) await sizes.first().click();
      await page.waitForTimeout(300);

      const addBtn = page.locator('button.bg-black.text-white').filter({ hasText: /adicionar|bolsa/i }).first();
      if (await addBtn.isVisible({ timeout: 3_000 }).catch(() => false) && await addBtn.isEnabled()) {
        // Capturar estado ANTES de adicionar
        const cartBadgeBefore = await page.evaluate(() => {
          const badges = document.querySelectorAll('[class*="badge"], [class*="count"]');
          let cartCount = '0';
          badges.forEach(b => {
            if (b.textContent?.match(/^\d+$/)) cartCount = b.textContent;
          });
          return cartCount;
        });

        await addBtn.click();

        // Verificar feedback IMEDIATO
        await page.waitForTimeout(500);

        // 1. Botão muda de estado?
        const btnAfterClick = await addBtn.evaluate((el) => ({
          text: el.textContent?.trim(),
          disabled: (el as HTMLButtonElement).disabled,
          hasCheck: !!el.querySelector('[class*="check"]'),
        }));
        console.log(`  🛒 Botão após click: text="${btnAfterClick.text}", disabled=${btnAfterClick.disabled}`);

        // 2. Drawer do carrinho abriu automaticamente?
        await page.waitForTimeout(1500);
        const drawerOpened = await page.locator('[class*="fixed"][class*="right"]').filter({ hasText: /bolsa|carrinho|cart/i }).first().isVisible({ timeout: 3_000 }).catch(() => false);
        console.log(`  📦 Drawer do carrinho abriu: ${drawerOpened ? '✅ auto' : '❌ não abriu'}`);

        // 3. Badge do carrinho na navbar atualizou?
        const cartBadgeAfter = await page.evaluate(() => {
          const badges = document.querySelectorAll('[class*="badge"], [class*="count"]');
          let cartCount = '0';
          badges.forEach(b => {
            if (b.textContent?.match(/^\d+$/)) cartCount = b.textContent;
          });
          return cartCount;
        });
        console.log(`  🔢 Badge carrinho: antes=${cartBadgeBefore}, depois=${cartBadgeAfter}`);

        // 4. Animação/toast?
        const toast = page.locator('[class*="toast"], [role="alert"]').first();
        const hasToast = await toast.isVisible({ timeout: 2_000 }).catch(() => false);
        console.log(`  📢 Toast/notificação: ${hasToast ? '✅' : 'nenhum'}`);

        break;
      }

      await page.goBack();
      await expect(products.first()).toBeVisible({ timeout: 15_000 });
    }
  });
});

// ─── CHECKOUT UX ────────────────────────────────────────────────────

test.describe('UX — Checkout', () => {
  test('Stepper e navegação do checkout são claros', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { console.error('  ❌ Login falhou'); return; }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Adicionar produto
    const products = page.locator('#collection .grid .cursor-pointer.group');
    await expect(products.first()).toBeVisible({ timeout: 30_000 });
    const total = await products.count();

    for (let i = 0; i < Math.min(total, 10); i++) {
      await products.nth(i).locator('h3').first().click();
      await expect(page).toHaveURL(/\/product\//, { timeout: 30_000 });
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      const sizes = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|ÚNICO|UNICO)$/i });
      if (await sizes.count() > 0) await sizes.first().click();
      await page.waitForTimeout(300);
      const addBtn = page.locator('button.bg-black.text-white').filter({ hasText: /adicionar|bolsa/i }).first();
      if (await addBtn.isVisible({ timeout: 3_000 }).catch(() => false) && await addBtn.isEnabled()) {
        await addBtn.click();
        await page.waitForTimeout(2000);
        break;
      }
      await page.goBack();
      await expect(products.first()).toBeVisible({ timeout: 15_000 });
    }

    // Ir para checkout
    const finalizar = page.getByRole('button', { name: /Finalizar/i }).first();
    if (await finalizar.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await finalizar.click();
      await page.waitForTimeout(3000);
    }

    // Verificar stepper
    const stepper = await page.evaluate(() => {
      const steps = document.querySelectorAll('[class*="step"], [class*="Step"]');
      const texts = Array.from(steps).map(s => s.textContent?.trim()).filter(Boolean);
      return texts;
    });
    console.log(`  📋 Steps do checkout: ${stepper.length > 0 ? stepper.join(' → ') : 'verificando...'}`);

    // Verificar se ENDEREÇO, PAGAMENTO, REVISÃO são visíveis
    const enderecoStep = page.getByText('ENDEREÇO');
    const pagamentoStep = page.getByText('PAGAMENTO');
    const revisaoStep = page.getByText('REVISÃO');

    console.log(`  📍 ENDEREÇO visível: ${await enderecoStep.isVisible({ timeout: 3_000 }).catch(() => false)}`);
    console.log(`  💳 PAGAMENTO visível: ${await pagamentoStep.isVisible({ timeout: 1_000 }).catch(() => false)}`);
    console.log(`  ✅ REVISÃO visível: ${await revisaoStep.isVisible({ timeout: 1_000 }).catch(() => false)}`);

    // Resumo do pedido visível?
    const sacola = page.getByText(/SUA SACOLA/i);
    console.log(`  🛒 Resumo "SUA SACOLA": ${await sacola.isVisible({ timeout: 3_000 }).catch(() => false)}`);

    // Cupom de desconto visível?
    const cupom = page.getByText(/CUPOM DE DESCONTO/i);
    console.log(`  🏷 Seção cupom: ${await cupom.isVisible({ timeout: 3_000 }).catch(() => false)}`);

    // Botão de voltar à loja?
    const voltarBtn = page.getByText(/VOLTAR À LOJA/i);
    console.log(`  ← Botão "VOLTAR À LOJA": ${await voltarBtn.isVisible({ timeout: 3_000 }).catch(() => false)}`);
  });
});
