import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Documentação Completa da Aplicação
 * Navega por todas as páginas e captura screenshots de tudo que encontrar
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '../docs/screenshots/full');

// Garante que o diretório existe
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Documentação Completa - Navegação por Todas as Páginas', () => {
  test('01 - Homepage - Vista Inicial', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage-inicial.png'),
      fullPage: true,
    });
  });

  test('02 - Homepage - Após Scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Scroll para ver mais conteúdo
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '02-homepage-scroll.png'),
      fullPage: true,
    });
    
    // Scroll até o final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, '03-homepage-final.png'),
      fullPage: true,
    });
  });

  test('03 - Navegação - Tentar Encontrar Produtos', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Tenta encontrar links de produtos
    const productLinks = await page.locator('a[href*="/product/"], a[href*="product"]').all();
    
    if (productLinks.length > 0) {
      // Captura screenshot mostrando os links encontrados
      await page.screenshot({
        path: path.join(screenshotsDir, '04-produtos-encontrados.png'),
        fullPage: true,
      });
      
      // Tenta clicar no primeiro produto
      await productLinks[0].click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, '05-pagina-produto.png'),
        fullPage: true,
      });
      
      // Scroll na página do produto
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '06-pagina-produto-scroll.png'),
        fullPage: true,
      });
      
      // Scroll até o final
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '07-pagina-produto-final.png'),
        fullPage: true,
      });
    } else {
      // Se não encontrar produtos, documenta a homepage
      await page.screenshot({
        path: path.join(screenshotsDir, '04-sem-produtos-visiveis.png'),
        fullPage: true,
      });
    }
  });

  test('04 - Navegação - Tentar Encontrar Coleções', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Tenta encontrar links de coleções
    const collectionLinks = await page.locator('a[href*="/collection/"], a[href*="collection"]').all();
    
    if (collectionLinks.length > 0) {
      await page.screenshot({
        path: path.join(screenshotsDir, '08-colecoes-encontradas.png'),
        fullPage: true,
      });
      
      // Clica na primeira coleção
      await collectionLinks[0].click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, '09-pagina-colecao.png'),
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: path.join(screenshotsDir, '08-sem-colecoes-visiveis.png'),
        fullPage: true,
      });
    }
  });

  test('05 - Interações - Navbar e Menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Captura navbar
    const navbar = page.locator('nav').first();
    if (await navbar.count() > 0) {
      await navbar.screenshot({
        path: path.join(screenshotsDir, '10-navbar.png'),
      });
    }
    
    // Tenta encontrar botão de menu
    const menuButtons = await page.locator('button, [role="button"]').filter({ 
      hasText: /menu|☰|≡|hamburger/i 
    }).all();
    
    if (menuButtons.length > 0) {
      await menuButtons[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '11-menu-aberto.png'),
        fullPage: true,
      });
    }
  });

  test('06 - Interações - Carrinho', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Tenta encontrar botão do carrinho
    const cartButtons = await page.locator('button, [role="button"], a').filter({ 
      hasText: /cart|carinho|bag|sacola|🛒/i 
    }).all();
    
    if (cartButtons.length > 0) {
      await cartButtons[0].click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(screenshotsDir, '12-carrinho-aberto.png'),
        fullPage: true,
      });
    } else {
      await page.screenshot({
        path: path.join(screenshotsDir, '12-carrinho-nao-encontrado.png'),
        fullPage: true,
      });
    }
  });

  test('07 - Interações - Wishlist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Tenta encontrar botão de wishlist
    const wishlistButtons = await page.locator('button, [role="button"], a').filter({ 
      hasText: /wishlist|favorito|heart|❤|♡/i 
    }).all();
    
    if (wishlistButtons.length > 0) {
      await wishlistButtons[0].click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(screenshotsDir, '13-wishlist-aberto.png'),
        fullPage: true,
      });
    }
  });

  test('08 - Interações - Autenticação', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Tenta encontrar botão de login/auth
    const authButtons = await page.locator('button, [role="button"], a').filter({ 
      hasText: /login|entrar|sign|account|conta|user|👤/i 
    }).all();
    
    if (authButtons.length > 0) {
      await authButtons[0].click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(screenshotsDir, '14-auth-aberto.png'),
        fullPage: true,
      });
      
      // Tenta encontrar formulário de login
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      
      if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
        await page.screenshot({
          path: path.join(screenshotsDir, '15-formulario-login.png'),
          fullPage: true,
        });
      }
    }
  });

  test('09 - Navegação - Tentar Acessar Checkout', async ({ page }) => {
    // Tenta acessar diretamente a página de checkout
    await page.goto('/checkout');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '16-checkout.png'),
      fullPage: true,
    });
  });

  test('10 - Navegação - Tentar Acessar About', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '17-about.png'),
      fullPage: true,
    });
  });

  test('11 - Navegação - Tentar Acessar Admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '18-admin.png'),
      fullPage: true,
    });
  });

  test('12 - Elementos Encontrados - Documentação de Estrutura', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Captura informações sobre elementos encontrados
    const elements = {
      links: await page.locator('a').count(),
      buttons: await page.locator('button, [role="button"]').count(),
      images: await page.locator('img').count(),
      inputs: await page.locator('input').count(),
      forms: await page.locator('form').count(),
      navs: await page.locator('nav').count(),
      sections: await page.locator('section').count(),
    };
    
    // Tenta encontrar produtos
    const productLinks = await page.locator('a[href*="/product/"], a[href*="product"]').all();
    const productCards = await page.locator('[class*="product"], [class*="card"], [data-testid*="product"]').all();
    
    // Tenta encontrar categorias
    const categoryLinks = await page.locator('a[href*="/category/"], a[href*="category"]').all();
    
    // Tenta encontrar coleções
    const collectionLinks = await page.locator('a[href*="/collection/"], a[href*="collection"]').all();
    
    console.log('Elementos encontrados:', {
      ...elements,
      produtos: productLinks.length,
      cardsProduto: productCards.length,
      categorias: categoryLinks.length,
      colecoes: collectionLinks.length,
    });
    
    // Screenshot com anotações visuais
    await page.screenshot({
      path: path.join(screenshotsDir, '19-estrutura-completa.png'),
      fullPage: true,
    });
  });

  test('13 - Mobile View - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '20-mobile-homepage.png'),
      fullPage: true,
    });
    
    // Scroll mobile
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '21-mobile-scroll.png'),
      fullPage: true,
    });
  });

  test('14 - Tablet View - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '22-tablet-homepage.png'),
      fullPage: true,
    });
  });

  test('15 - Desktop Large - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '23-desktop-large.png'),
      fullPage: true,
    });
  });

  test('16 - Explorar Todos os Links da Homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Coleta todos os links
    const allLinks = await page.locator('a[href]').all();
    const uniqueUrls = new Set<string>();
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        uniqueUrls.add(href);
      }
    }
    
    console.log('Links únicos encontrados:', Array.from(uniqueUrls));
    
    // Tenta visitar alguns links importantes
    const importantLinks = Array.from(uniqueUrls).filter(url => 
      url.includes('/product/') || 
      url.includes('/collection/') || 
      url.includes('/category/') ||
      url === '/about' ||
      url === '/checkout'
    ).slice(0, 5); // Limita a 5 links para não demorar muito
    
    let screenshotIndex = 24;
    for (const link of importantLinks) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(screenshotsDir, `${screenshotIndex.toString().padStart(2, '0')}-${link.replace(/\//g, '-').replace(/^-/, '') || 'root'}.png`),
          fullPage: true,
        });
        screenshotIndex++;
      } catch (error) {
        console.log(`Erro ao acessar ${link}:`, error);
      }
    }
  });
});

