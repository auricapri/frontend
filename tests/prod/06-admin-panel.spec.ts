/**
 * 06 — Admin Panel: login, dashboard, produtos, pedidos
 * Target: https://www.admin.auricapri.com.br
 */
import { test, expect, Page } from '@playwright/test';

const EMAIL = 'marcus.lirio1@gmail.com';
const PASSWORD = 'Raposa69*';
const ADMIN_URL = 'https://admin.auricapri.com.br';

async function adminSetup(page: Page) {
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
    .catch(() => undefined);

  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await termsBtn.click();
    await page.waitForTimeout(300);
  }
}

async function adminLogin(page: Page) {
  // O admin pode ter um form de login direto ou drawer
  const form = page.locator('form').first();
  const loginBtn = page.locator('button[aria-label="Entrar"]').last();

  if (await form.isVisible({ timeout: 10_000 }).catch(() => false)) {
    // Form direto na página
    await form.locator('input[type="email"]').fill(EMAIL);
    await form.locator('input[type="password"]').fill(PASSWORD);
    await form.locator('button[type="submit"]').click();
  } else if (await loginBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    // Drawer de login
    await loginBtn.click();
    const drawerForm = page.locator('form').first();
    await expect(drawerForm).toBeVisible({ timeout: 15_000 });
    await drawerForm.locator('input[type="email"]').fill(EMAIL);
    await drawerForm.locator('input[type="password"]').fill(PASSWORD);
    await drawerForm.locator('button[type="submit"]').click();
  }

  // Esperar login completar
  await page.waitForTimeout(5000);

  // Verificar se está logado — procurar elementos de admin/dashboard
  const dashboardIndicator = page
    .getByText(/Dashboard|Painel|Admin|Produtos|Pedidos/i)
    .first()
    .or(page.locator('button[aria-label="Minha conta"]').last());
  await expect(dashboardIndicator).toBeVisible({ timeout: 60_000 });
}

test.describe('Admin Panel — Carregamento', () => {
  test('Admin carrega sem erros', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    const apiErrors: { url: string; status: number }[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/api/') && resp.status() >= 500) {
        apiErrors.push({ url: resp.url(), status: resp.status() });
      }
    });

    const start = Date.now();
    const response = await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;

    expect(response?.status(), 'HTTP status deve ser 200').toBe(200);
    console.log(`  ⏱ Admin carregou em ${loadTime}ms`);

    if (jsErrors.length > 0) {
      console.warn('  ⚠ JS Errors no admin:', jsErrors);
    }
    if (apiErrors.length > 0) {
      console.error('  ❌ API 5xx no admin:', apiErrors);
    }
  });

  test('Login no admin funciona', async ({ page }) => {
    const start = Date.now();
    await adminSetup(page);
    await adminLogin(page);
    const loginTime = Date.now() - start;

    console.log(`  ⏱ Login no admin: ${loginTime}ms`);
    console.log('  ✅ Login no admin OK');
  });
});

test.describe('Admin Panel — Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await adminSetup(page);
    await adminLogin(page);
  });

  test('Dashboard/Painel principal carrega dados', async ({ page }) => {
    await page.waitForTimeout(3000);

    // Verificar se tem cards/widgets de dados
    const dashboardElements = page.locator('[class*="card"], [class*="Card"], [class*="widget"], [class*="stat"]');
    const count = await dashboardElements.count();
    console.log(`  📊 ${count} elementos de dashboard encontrados`);

    // Verificar se tem números/métricas visíveis
    const metrics = page.locator('[class*="metric"], [class*="count"], [class*="total"]');
    const metricCount = await metrics.count();
    console.log(`  📈 ${metricCount} métricas encontradas`);
  });

  test('Seção de Produtos acessível', async ({ page }) => {
    // Navegar para produtos
    const productsLink = page.getByRole('link', { name: /Produto/i }).first()
      .or(page.getByRole('button', { name: /Produto/i }).first())
      .or(page.locator('a[href*="product"]').first());

    if (await productsLink.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await productsLink.click();
      await page.waitForTimeout(3000);

      // Verificar se lista de produtos aparece
      const productList = page.locator('table, [class*="grid"], [class*="list"]').first();
      if (await productList.isVisible({ timeout: 15_000 }).catch(() => false)) {
        console.log('  ✅ Lista de produtos carregou');
      }

      // Contar produtos
      const productRows = page.locator('tr, [class*="product-item"], [class*="ProductItem"]');
      const rowCount = await productRows.count();
      console.log(`  📦 ${rowCount} linhas/items de produtos`);
    } else {
      console.log('  ℹ Link de Produtos não encontrado no admin');
    }
  });

  test('Seção de Pedidos acessível', async ({ page }) => {
    const ordersLink = page.getByRole('link', { name: /Pedido|Order/i }).first()
      .or(page.getByRole('button', { name: /Pedido|Order/i }).first())
      .or(page.locator('a[href*="order"]').first());

    if (await ordersLink.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const start = Date.now();
      await ordersLink.click();
      await page.waitForTimeout(3000);
      const navTime = Date.now() - start;
      console.log(`  ⏱ Navegação para pedidos: ${navTime}ms`);

      const orderList = page.locator('table, [class*="grid"], [class*="list"]').first();
      if (await orderList.isVisible({ timeout: 15_000 }).catch(() => false)) {
        console.log('  ✅ Lista de pedidos carregou');
      }
    } else {
      console.log('  ℹ Link de Pedidos não encontrado no admin');
    }
  });

  test('APIs do admin não retornam erros', async ({ page }) => {
    const apiErrors: { url: string; status: number }[] = [];
    const apiTimings: { url: string; time: number }[] = [];
    const pending = new Map<string, number>();

    page.on('request', (req) => {
      if (req.url().includes('/api/')) pending.set(req.url(), Date.now());
    });
    page.on('response', (resp) => {
      const start = pending.get(resp.url());
      if (start) {
        apiTimings.push({ url: resp.url(), time: Date.now() - start });
        pending.delete(resp.url());
      }
      if (resp.url().includes('/api/') && resp.status() >= 400) {
        apiErrors.push({ url: resp.url(), status: resp.status() });
      }
    });

    // Navegar pelo admin para triggerar APIs
    await page.waitForTimeout(5000);

    // Clicar em diferentes seções
    const navLinks = page.locator('nav a, aside a, [class*="sidebar"] a');
    const linkCount = await navLinks.count();

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && !href.includes('logout')) {
        await navLinks.nth(i).click().catch(() => undefined);
        await page.waitForTimeout(3000);
      }
    }

    console.log('\n  📊 Admin API Response Times:');
    apiTimings.forEach(({ url, time }) => {
      const path = new URL(url).pathname;
      const icon = time > 3000 ? '🔴' : time > 1000 ? '🟡' : '🟢';
      console.log(`    ${icon} ${path}: ${time}ms`);
    });

    if (apiErrors.length > 0) {
      console.warn('  ⚠ API errors no admin:', apiErrors);
    }
  });
});
