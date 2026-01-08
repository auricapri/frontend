import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Testes de documentação visual da aplicação
 * Gera screenshots das principais funcionalidades
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '../docs/screenshots');

// Garante que o diretório existe
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Documentação Visual - Homepage', () => {
  test('Homepage - Vista completa', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Screenshot da homepage completa
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage-full.png'),
      fullPage: true,
    });
  });

  test('Homepage - Hero Section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Screenshot da seção hero
    const hero = page.locator('section, main').first();
    await hero.screenshot({
      path: path.join(screenshotsDir, '02-homepage-hero.png'),
    });
  });

  test('Homepage - Navbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Screenshot do navbar
    const navbar = page.locator('nav').first();
    if (await navbar.count() > 0) {
      await navbar.screenshot({
        path: path.join(screenshotsDir, '03-navbar.png'),
      });
    }
  });

  test('Homepage - Grid de Produtos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Aguarda produtos carregarem
    await page.waitForTimeout(2000);
    
    // Screenshot do grid de produtos
    const productGrid = page.locator('main, section').filter({ hasText: /product|produto/i }).first();
    if (await productGrid.count() > 0) {
      await productGrid.screenshot({
        path: path.join(screenshotsDir, '04-product-grid.png'),
      });
    } else {
      // Fallback: screenshot da área principal
      await page.screenshot({
        path: path.join(screenshotsDir, '04-product-grid.png'),
        fullPage: true,
      });
    }
  });
});

test.describe('Documentação Visual - Produto', () => {
  test('Página de Produto - Vista completa', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Tenta encontrar e clicar em um produto
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Screenshot da página de produto completa
      await page.screenshot({
        path: path.join(screenshotsDir, '05-product-page-full.png'),
        fullPage: true,
      });
    } else {
      test.skip();
    }
  });

  test('Página de Produto - Galeria de Imagens', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Screenshot da galeria de imagens
      const gallery = page.locator('img, [class*="gallery"], [class*="image"]').first();
      if (await gallery.count() > 0) {
        await gallery.screenshot({
          path: path.join(screenshotsDir, '06-product-gallery.png'),
        });
      }
    } else {
      test.skip();
    }
  });

  test('Página de Produto - Informações do Produto', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Scroll para a seção de informações
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      
      // Screenshot das informações do produto
      await page.screenshot({
        path: path.join(screenshotsDir, '07-product-info.png'),
        fullPage: false,
      });
    } else {
      test.skip();
    }
  });
});

test.describe('Documentação Visual - Carrinho', () => {
  test('Drawer do Carrinho', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Tenta abrir o carrinho
    const cartButton = page.locator('button').filter({ hasText: /cart|carinho|bag/i }).first();
    
    if (await cartButton.count() > 0) {
      await cartButton.click();
      await page.waitForTimeout(1000);
      
      // Screenshot do drawer do carrinho
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="modal"]').first();
      if (await drawer.count() > 0) {
        await drawer.screenshot({
          path: path.join(screenshotsDir, '08-cart-drawer.png'),
        });
      } else {
        // Fallback: screenshot da página inteira
        await page.screenshot({
          path: path.join(screenshotsDir, '08-cart-drawer.png'),
        });
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Documentação Visual - Autenticação', () => {
  test('Drawer de Login', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Tenta abrir o drawer de autenticação
    const authButton = page.locator('button').filter({ hasText: /login|entrar|sign|account/i }).first();
    
    if (await authButton.count() > 0) {
      await authButton.click();
      await page.waitForTimeout(1000);
      
      // Screenshot do drawer de autenticação
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="modal"]').first();
      if (await drawer.count() > 0) {
        await drawer.screenshot({
          path: path.join(screenshotsDir, '09-auth-drawer.png'),
        });
      } else {
        await page.screenshot({
          path: path.join(screenshotsDir, '09-auth-drawer.png'),
        });
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Documentação Visual - Mobile', () => {
  test('Homepage Mobile', async ({ page }) => {
    // Define viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot mobile
    await page.screenshot({
      path: path.join(screenshotsDir, '10-mobile-homepage.png'),
      fullPage: true,
    });
  });

  test('Página de Produto Mobile', async ({ page }) => {
    test.setTimeout(60000); // Aumenta timeout para 60s
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const productLink = page.locator('a[href*="/product/"]').first();
    
    if (await productLink.count() > 0) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, '11-mobile-product.png'),
        fullPage: true,
      });
    } else {
      test.skip();
    }
  });
});

test.describe('Documentação Visual - Tablet', () => {
  test('Homepage Tablet', async ({ page }) => {
    // Define viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '12-tablet-homepage.png'),
      fullPage: true,
    });
  });
});

