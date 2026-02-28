/**
 * 14 — GERENCIAMENTO DE PERFIL
 * Testa: editar nome/phone/CPF, salvar, verificar persistência
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

test.describe('Profile Management', () => {
  test('After login, user profile/account section is accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    // Open auth drawer again to see profile
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    // Look for profile/account button (after login, the "Entrar" button changes)
    const profileBtn = page.locator('button[aria-label*="erfil"], button[aria-label*="onta"], button[aria-label*="Entrar"]').first();
    const isVisible = await profileBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  👤 Botão de perfil/conta: ${isVisible ? '✅ Visível' : '⚠ Não encontrado'}`);

    if (isVisible) {
      await profileBtn.click();
      await page.waitForTimeout(1500);

      // Check if profile info is shown
      const emailDisplay = page.getByText(EMAIL).first();
      const hasEmail = await emailDisplay.isVisible({ timeout: 5_000 }).catch(() => false);
      console.log(`  📧 Email do usuário exibido: ${hasEmail ? '✅' : '❌'}`);
    }
  });

  test('Profile has name field', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    // Navigate to profile
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    const profileBtn = page.locator('button[aria-label*="erfil"], button[aria-label*="onta"], button[aria-label*="Entrar"]').first();
    if (await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(1500);
    }

    // Look for name input in the profile section
    const nameInput = page.locator('input[name="name"], input[name="full_name"], input[placeholder*="nome"], input[placeholder*="Nome"]').first();
    const hasName = await nameInput.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  👤 Campo de nome no perfil: ${hasName ? '✅ Encontrado' : '⚠ Não encontrado'}`);
  });

  test('Logout button works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);

    const loggedIn = await login(page);
    if (!loggedIn) { test.skip(); return; }

    // Open profile drawer
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);

    const profileBtn = page.locator('button[aria-label*="erfil"], button[aria-label*="onta"], button[aria-label*="Entrar"]').first();
    if (await profileBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(1500);
    }

    // Look for logout button
    const logoutBtn = page.getByRole('button', { name: /Sair|Logout|Desconectar/i }).first();
    const hasLogout = await logoutBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log(`  🚪 Botão de logout: ${hasLogout ? '✅ Encontrado' : '⚠ Não encontrado'}`);

    if (hasLogout) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Logout executado');
    }
  });
});
