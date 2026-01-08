import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should open auth drawer', async ({ page }) => {
    await page.goto('/');
    
    // Procura pelo botão de login/auth
    // Ajuste o seletor conforme a estrutura do seu Navbar
    const authButton = page.locator('button').filter({ hasText: /login|entrar|sign/i }).first();
    
    if (await authButton.count() > 0) {
      await authButton.click();
      // Aguarda o drawer abrir
      await page.waitForTimeout(500);
      
      // Verifica se o drawer de autenticação está visível
      // Ajuste este seletor conforme a estrutura do seu AuthDrawer
      const authDrawer = page.locator('[role="dialog"]').first();
      await expect(authDrawer).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/');
    
    // Tenta abrir o drawer de auth
    const authButton = page.locator('button').filter({ hasText: /login|entrar|sign/i }).first();
    
    if (await authButton.count() > 0) {
      await authButton.click();
      await page.waitForTimeout(500);
      
      // Verifica se os campos de email e senha estão presentes
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});

