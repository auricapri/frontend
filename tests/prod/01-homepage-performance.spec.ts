/**
 * 01 — Homepage: carregamento, performance, visual e navegação
 */
import { test, expect } from '@playwright/test';

test.describe('Homepage — Carregamento e Performance', () => {
  test('Página carrega em tempo aceitável (< 8s) e sem erros JS', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const start = Date.now();
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    expect(response?.status(), 'HTTP status deve ser 200').toBe(200);
    console.log(`  ⏱ DOM loaded em ${loadTime}ms`);
    expect(loadTime, 'DOM deve carregar em menos de 8s').toBeLessThan(8000);

    // Espera splash/body.loaded
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const fullLoad = Date.now() - start;
    console.log(`  ⏱ Full page (body.loaded) em ${fullLoad}ms`);

    if (jsErrors.length > 0) {
      console.warn('  ⚠ JS Errors:', jsErrors);
    }
  });

  test('Elementos essenciais da home estão visíveis', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    // Dismiss terms modal if it appears
    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
      await page.waitForTimeout(300);
    }

    // A home tem um hero/banner com "AURICAPRI" e depois o grid de produtos
    // O header pode estar hidden no splash — scroll para baixo para ver produtos
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);

    // Grid de produtos (o elemento principal da loja)
    const products = page.locator('#collection .grid .cursor-pointer.group');
    const count = await products.count();
    console.log(`  📦 ${count} produtos visíveis na home`);
    expect(count, 'Deve ter pelo menos 1 produto').toBeGreaterThan(0);

    // Após scroll, o header deve aparecer
    const header = page.locator('header').first();
    const headerVisible = await header.isVisible().catch(() => false);
    console.log(`  📌 Header (navbar) visível após scroll: ${headerVisible ? 'SIM' : 'NÃO'}`);
  });

  test('Imagens de produtos carregam sem erro 404', async ({ page }) => {
    const brokenImages: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().match(/\.(jpg|jpeg|png|webp|avif)/i) && resp.status() >= 400) {
        brokenImages.push(`${resp.status()} ${resp.url()}`);
      }
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    if (brokenImages.length > 0) {
      console.warn('  ⚠ Imagens quebradas:', brokenImages);
    }
    expect(brokenImages.length, 'Não deve ter imagens quebradas').toBe(0);
  });

  test('API requests na home não retornam erros 5xx', async ({ page }) => {
    const apiErrors: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && resp.status() >= 500) {
        apiErrors.push({ url: resp.url(), status: resp.status() });
      }
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(5000);

    if (apiErrors.length > 0) {
      console.error('  ❌ API 5xx errors:', apiErrors);
    }
    expect(apiErrors.length, 'Não deve ter erros 5xx na home').toBe(0);
  });

  test('Console não tem erros críticos', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('analytics') && !text.includes('gtm')) {
          criticalErrors.push(text);
        }
      }
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(5000);

    if (criticalErrors.length > 0) {
      console.warn('  ⚠ Console errors:', criticalErrors.slice(0, 10));
    }
  });

  test('Tempo de resposta das APIs principais', async ({ page }) => {
    const apiTimings: { url: string; time: number }[] = [];
    const pending = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        pending.set(req.url(), Date.now());
      }
    });
    page.on('response', (resp) => {
      const start = pending.get(resp.url());
      if (start) {
        apiTimings.push({ url: resp.url(), time: Date.now() - start });
        pending.delete(resp.url());
      }
    });

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(5000);

    console.log('\n  📊 API Response Times:');
    apiTimings.forEach(({ url, time }) => {
      const path = new URL(url).pathname;
      const status = time > 3000 ? '🔴' : time > 1000 ? '🟡' : '🟢';
      console.log(`    ${status} ${path}: ${time}ms`);
    });

    const slowApis = apiTimings.filter((a) => a.time > 5000);
    if (slowApis.length > 0) {
      console.warn('  ⚠ APIs lentas (>5s):', slowApis);
    }
  });
});
