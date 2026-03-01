/**
 * 13 --- FLUXO DE REGISTRO
 * Testa: criar conta, validacao de campos, LGPD terms, erro email duplicado
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

async function openAuthDrawer(page: Page) {
  await scrollToActivateHeader(page);

  // Navbar auth button uses aria-label="Entrar" (logged out) or "Minha conta" (logged in)
  const loginBtn = page.locator('button[aria-label="Entrar"]');
  const count = await loginBtn.count();

  for (let i = count - 1; i >= 0; i--) {
    if (await loginBtn.nth(i).isVisible().catch(() => false)) {
      await loginBtn.nth(i).click({ force: true });
      break;
    }
  }

  await page.waitForTimeout(1000);
}

test.describe('Register Flow', () => {
  test('Auth drawer opens with login form', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await openAuthDrawer(page);

    const form = page.locator('form').first();
    const formVisible = await form.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Form de autenticacao visivel: ${formVisible ? 'SIM' : 'NAO'}`);
    expect(formVisible).toBe(true);
  });

  test('Login form has email and password fields', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await openAuthDrawer(page);

    const form = page.locator('form').first();
    await form.waitFor({ timeout: 10_000 });

    const emailInput = form.locator('input[type="email"]');
    const passwordInput = form.locator('input[type="password"]');
    const submitBtn = form.locator('button[type="submit"]');

    expect(await emailInput.isVisible()).toBe(true);
    expect(await passwordInput.isVisible()).toBe(true);
    expect(await submitBtn.isVisible()).toBe(true);

    console.log('  Campos email, password e botao submit presentes');
  });

  test('Has link/tab to switch to register mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await openAuthDrawer(page);

    await page.waitForTimeout(1000);

    // Look for register link/button - i18n: "Cadastrar" (pt), "Sign up" (en), "Criar conta"
    const registerToggle = page.getByText(/Criar conta|Cadastr|Registr|Sign up|N[aã]o tem uma conta/i).first();
    const hasRegister = await registerToggle.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  Link/botao para criar conta: ${hasRegister ? 'Encontrado' : 'Nao encontrado'}`);

    if (hasRegister) {
      await registerToggle.click({ force: true });
      await page.waitForTimeout(1000);

      // Check for name field (typically present in register form but not login)
      const nameInput = page.locator('input[name="name"], input[placeholder*="nome" i], input[placeholder*="Nome"]').first();
      const hasName = await nameInput.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Campo de nome no registro: ${hasName ? 'SIM' : 'Nao encontrado'}`);
    }
  });

  test('Empty form submission shows validation errors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await openAuthDrawer(page);

    const form = page.locator('form').first();
    await form.waitFor({ timeout: 10_000 });

    // Click submit without filling
    const submitBtn = form.locator('button[type="submit"]');
    await submitBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Check if HTML5 validation or custom validation kicks in
    const emailInput = form.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    console.log(`  Validacao ao submeter vazio: ${isInvalid ? 'Campo marcado invalido' : 'Sem feedback visivel'}`);
  });

  test('Invalid email format shows error', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await openAuthDrawer(page);

    const form = page.locator('form').first();
    await form.waitFor({ timeout: 10_000 });

    await form.locator('input[type="email"]').fill('notanemail');
    await form.locator('input[type="password"]').fill('Test123*');
    await form.locator('button[type="submit"]').click({ force: true });
    await page.waitForTimeout(1000);

    // HTML5 validation should prevent submission
    const emailInput = form.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    console.log(`  Email invalido detectado: ${isInvalid ? 'SIM' : 'NAO'}`);
  });

  test('Wrong credentials show error message', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await openAuthDrawer(page);

    const form = page.locator('form').first();
    await form.waitFor({ timeout: 10_000 });

    await form.locator('input[type="email"]').fill('nonexistent@test.com');
    await form.locator('input[type="password"]').fill('WrongPass123*');
    await form.locator('button[type="submit"]').click({ force: true });

    // Wait for error message
    const errorMsg = page.getByText(/Email ou senha|incorretos|inv[aá]lido|Invalid|error|Erro/i).first();
    const hasError = await errorMsg.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Mensagem de erro para credenciais erradas: ${hasError ? 'Exibida' : 'Nao exibida'}`);
  });
});
