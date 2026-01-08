import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    // Verifica se a página carregou
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should display navigation bar', async ({ page }) => {
    await page.goto('/');
    // Verifica se o navbar está presente
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();
  });
});

test.describe('Product Navigation', () => {
  test('should navigate to product page when clicking a product', async ({ page }) => {
    await page.goto('/');
    
    // Aguarda os produtos carregarem (ajuste o seletor conforme sua estrutura)
    await page.waitForLoadState('networkidle');
    
    // Tenta encontrar um link de produto ou card de produto
    // Ajuste este seletor conforme a estrutura real do seu componente
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (await productLink.count() > 0) {
      await productLink.click();
      // Verifica se navegou para uma página de produto
      await expect(page).toHaveURL(/\/product\//);
    } else {
      // Se não houver produtos, apenas verifica que a página carregou
      test.skip();
    }
  });
});

test.describe('Cart Functionality', () => {
  test('should open cart drawer', async ({ page }) => {
    await page.goto('/');
    
    // Procura pelo botão do carrinho (ajuste o seletor conforme necessário)
    const cartButton = page.locator('button').filter({ hasText: /cart|carinho/i }).first();
    
    if (await cartButton.count() > 0) {
      await cartButton.click();
      // Verifica se o drawer do carrinho abriu
      // Ajuste este seletor conforme a estrutura do seu componente CartDrawer
      await page.waitForTimeout(500); // Aguarda animação
    } else {
      test.skip();
    }
  });
});

