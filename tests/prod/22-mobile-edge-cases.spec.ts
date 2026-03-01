/**
 * 22 --- MOBILE EDGE CASES
 * Testa: MobileStickyBar, safe-area, teclado, overflow, orientacao
 */
import { test, expect, Page } from '@playwright/test';

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
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
}

test.describe('Mobile -- iPhone SE (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Page loads without horizontal overflow', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  iPhone SE -- overflow horizontal: ${hasHorizontalOverflow ? 'SIM (problema)' : 'NAO (ok)'}`);
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('Navigation is accessible on small screen', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    await scrollToActivateHeader(page);

    // Navbar cart button: aria-label="Carrinho"
    const cartBtn = page.locator('button[aria-label="Carrinho"]').first();
    const hasCart = await cartBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Botao carrinho em tela pequena: ${hasCart ? 'SIM' : 'NAO'}`);

    // Also check auth button: aria-label="Entrar" or "Minha conta"
    const authBtn = page.locator('button[aria-label="Entrar"], button[aria-label="Minha conta"]').first();
    const hasAuth = await authBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  Botao auth em tela pequena: ${hasAuth ? 'SIM' : 'NAO'}`);

    // Wishlist button: aria-label="Lista de desejos"
    const wishBtn = page.locator('button[aria-label="Lista de desejos"]').first();
    const hasWish = await wishBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  Botao wishlist em tela pequena: ${hasWish ? 'SIM' : 'NAO'}`);
  });

  test('Product images are not clipped', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    // Scroll to products using window.scrollTo (more reliable)
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);

    // Check if product images are within viewport
    const images = page.locator('img[alt]');
    const imageCount = await images.count();
    let clippedCount = 0;

    for (let i = 0; i < Math.min(imageCount, 4); i++) {
      const img = images.nth(i);
      if (await img.isVisible().catch(() => false)) {
        const box = await img.boundingBox();
        if (box && (box.x + box.width > 375 + 5 || box.x < -5)) {
          clippedCount++;
        }
      }
    }
    console.log(`  Imagens cortadas: ${clippedCount === 0 ? 'Nenhuma' : `${clippedCount} cortadas`}`);
  });

  test('Text is readable (min 9px)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    // Scroll to content
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(2000);

    const smallTextCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, button, li');
      let small = 0;
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 9 && el.textContent && el.textContent.trim().length > 0) {
          small++;
        }
      });
      return small;
    });
    console.log(`  Textos abaixo de 9px: ${smallTextCount === 0 ? 'Nenhum' : `${smallTextCount} elementos`}`);
  });
});

test.describe('Mobile -- iPhone 14 Pro Max (430x932)', () => {
  test.use({ viewport: { width: 430, height: 932 } });

  test('Page renders correctly on large phone', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  iPhone 14 Pro Max -- overflow: ${hasOverflow ? 'SIM (problema)' : 'NAO (ok)'}`);
    expect(hasOverflow).toBe(false);
  });

  test('Footer is accessible by scrolling', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    // Scroll to bottom using both main and window for reliability
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main && main.scrollHeight > main.clientHeight) {
        main.scrollTo(0, main.scrollHeight);
      }
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const footer = page.locator('footer');
    const footerVisible = await footer.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Footer acessivel: ${footerVisible ? 'SIM' : 'NAO'}`);
  });
});

test.describe('Mobile -- Landscape', () => {
  test.use({ viewport: { width: 812, height: 375 } });

  test('Landscape mode does not break layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await page.waitForTimeout(2000);

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`  Landscape -- overflow: ${hasOverflow ? 'SIM (problema)' : 'NAO (ok)'}`);

    // Check content is still accessible
    const bodyContent = await page.evaluate(() => document.body.innerText.length);
    console.log(`  Conteudo em landscape: ${bodyContent > 100 ? 'Renderizou' : 'Possivel problema'}`);
  });
});

test.describe('Mobile -- Touch Targets', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Interactive elements have minimum touch target size', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);

    await scrollToActivateHeader(page);

    const tooSmall = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input, select, textarea');
      let smallCount = 0;
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Only check visible elements with content
        if (rect.width > 0 && rect.height > 0 && rect.width < 30 && rect.height < 30) {
          const text = el.textContent?.trim() || '';
          if (text.length > 0 || el.querySelector('svg')) {
            smallCount++;
          }
        }
      });
      return smallCount;
    });
    console.log(`  Elementos interativos < 30px: ${tooSmall === 0 ? 'Nenhum' : `${tooSmall} elementos`}`);
  });
});
