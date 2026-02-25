import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Navegação Completa - Visita TODAS as telas e só termina quando concluir tudo
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '../docs/screenshots/complete');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Rotas conhecidas da aplicação
const knownRoutes = [
  '/',
  '/about',
  '/admin',
  '/checkout',
  '/reset-password',
];

// Estado global para rastrear o que foi visitado
const visitedUrls = new Set<string>();
const screenshotsTaken = new Map<string, number>();

test.describe('Navegação Completa - Todas as Telas', () => {
  test('Navegar por TODAS as telas disponíveis', async ({ page }) => {
    test.setTimeout(600000); // 10 minutos de timeout
    
    console.log('🚀 Iniciando navegação completa no Chrome...');
    
    // 1. Começa na homepage com scroll completo
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    visitedUrls.add('/');
    
    // Screenshot inicial
    await takeScreenshot(page, '00-homepage-topo', screenshotsDir);
    
    // Scroll progressivo na homepage
    await scrollPageProgressively(page, '00-homepage', screenshotsDir);
    
    // Final da homepage
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '00-homepage-final', screenshotsDir);
    
    // Volta ao topo
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    // 2. Coleta TODOS os links da página
    const allLinks = await collectAllLinks(page);
    console.log(`📋 Encontrados ${allLinks.length} links na homepage`);
    
    // 3. Visita cada rota conhecida
    for (const route of knownRoutes) {
      if (!visitedUrls.has(route)) {
        await visitRoute(page, route, screenshotsDir);
      }
    }
    
    // 4. Visita links encontrados na homepage
    for (const link of allLinks) {
      if (!visitedUrls.has(link)) {
        await visitRoute(page, link, screenshotsDir);
      }
    }
    
    // 5. Navegação profunda - tenta encontrar mais links em cada página visitada
    let newLinksFound = true;
    let iterations = 0;
    const maxIterations = 10; // Evita loop infinito
    
    while (newLinksFound && iterations < maxIterations) {
      iterations++;
      newLinksFound = false;
      const currentUrls = Array.from(visitedUrls);
      
      for (const url of currentUrls) {
        try {
          await page.goto(`http://localhost:3000${url}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(2000);
          
          const pageLinks = await collectAllLinks(page);
          
          for (const link of pageLinks) {
            if (!visitedUrls.has(link) && isValidRoute(link)) {
              visitedUrls.add(link);
              newLinksFound = true;
              await visitRoute(page, link, screenshotsDir);
            }
          }
        } catch (error) {
          console.log(`⚠️ Erro ao visitar ${url}:`, error);
        }
      }
    }
    
    // 6. Interações com componentes
    await interactWithComponents(page, screenshotsDir);
    
    // 7. Testa diferentes viewports
    await testViewports(page, screenshotsDir);
    
    console.log(`✅ Navegação completa finalizada!`);
    console.log(`📊 Total de URLs visitadas: ${visitedUrls.size}`);
    console.log(`📸 Total de screenshots: ${screenshotsTaken.size}`);
    
    // Gera relatório final
    await generateReport(visitedUrls, screenshotsTaken, screenshotsDir);
    
    // Mantém o navegador aberto por 5 segundos no final para visualização
    await page.waitForTimeout(5000);
  });
});

/**
 * Coleta todos os links da página atual
 */
async function collectAllLinks(page: any): Promise<string[]> {
  const links = await page.locator('a[href]').all();
  const uniqueLinks = new Set<string>();
  
  for (const link of links) {
    try {
      const href = await link.getAttribute('href');
      if (href) {
        // Normaliza o link
        let normalized = href;
        
        // Remove protocolo e domínio se presente
        if (normalized.startsWith('http://localhost:3000')) {
          normalized = normalized.replace('http://localhost:3000', '');
        }
        
        // Remove fragmentos e query strings para rotas
        if (normalized.includes('#')) {
          normalized = normalized.split('#')[0];
        }
        
        // Ignora links externos, mailto, tel, etc
        if (normalized && 
            !normalized.startsWith('http') && 
            !normalized.startsWith('mailto:') && 
            !normalized.startsWith('tel:') &&
            !normalized.startsWith('javascript:') &&
            normalized !== '/') {
          uniqueLinks.add(normalized);
        }
      }
    } catch (error) {
      // Ignora erros ao coletar links
    }
  }
  
  return Array.from(uniqueLinks);
}

/**
 * Verifica se uma rota é válida para visitar
 */
function isValidRoute(route: string): boolean {
  // Ignora rotas que não são páginas da aplicação
  if (route.startsWith('http')) return false;
  if (route.startsWith('mailto:')) return false;
  if (route.startsWith('tel:')) return false;
  if (route.startsWith('javascript:')) return false;
  if (route.includes('#')) return false;
  if (route.length > 200) return false; // Muito longo, provavelmente não é uma rota
  
  return true;
}

/**
 * Visita uma rota específica com scroll completo
 */
async function visitRoute(page: any, route: string, screenshotsDir: string) {
  try {
    console.log(`🔍 Visitando: ${route}`);
    
    const fullUrl = route.startsWith('http') ? route : `http://localhost:3000${route}`;
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Verifica se a página carregou (não é 404)
    const title = await page.title();
    const url = page.url();
    
    const routeName = route.replace(/\//g, '-').replace(/^-/, '') || 'root';
    
    // Screenshot inicial (topo da página)
    await takeScreenshot(page, `${routeName}-topo`, screenshotsDir);
    
    // Scroll progressivo - rola a página em etapas
    await scrollPageProgressively(page, routeName, screenshotsDir);
    
    // Scroll até o final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await takeScreenshot(page, `${routeName}-final`, screenshotsDir);
    
    // Volta ao topo
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    visitedUrls.add(route);
    console.log(`✅ Visitado: ${route}`);
    
  } catch (error: any) {
    console.log(`❌ Erro ao visitar ${route}:`, error.message);
    // Continua mesmo com erro
  }
}

/**
 * Rola a página progressivamente capturando screenshots
 */
async function scrollPageProgressively(page: any, routeName: string, screenshotsDir: string) {
  try {
    // Obtém a altura total da página
    const totalHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });
    
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const scrollStep = viewportHeight * 0.8; // Rola 80% da altura da viewport
    let currentScroll = 0;
    let screenshotIndex = 1;
    
    // Rola progressivamente
    while (currentScroll < totalHeight) {
      currentScroll += scrollStep;
      
      // Garante que não ultrapasse o final
      if (currentScroll > totalHeight) {
        currentScroll = totalHeight;
      }
      
      await page.evaluate((scroll: number) => {
        window.scrollTo({
          top: scroll,
          behavior: 'smooth'
        });
      }, currentScroll);
      
      // Aguarda o scroll completar
      await page.waitForTimeout(1500);
      
      // Screenshot em cada etapa
      await takeScreenshot(page, `${routeName}-scroll-${screenshotIndex}`, screenshotsDir);
      screenshotIndex++;
      
      // Se chegou ao final, para
      if (currentScroll >= totalHeight) {
        break;
      }
    }
    
    console.log(`📜 Scroll completo: ${screenshotIndex - 1} etapas capturadas`);
  } catch (error) {
    console.log(`⚠️ Erro no scroll progressivo:`, error);
  }
}

/**
 * Tira screenshot com nome único
 */
async function takeScreenshot(page: any, name: string, dir: string) {
  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(dir, filename);
  
  try {
    await page.screenshot({
      path: filepath,
      fullPage: true,
    });
    
    screenshotsTaken.set(name, (screenshotsTaken.get(name) || 0) + 1);
  } catch (error) {
    console.log(`⚠️ Erro ao tirar screenshot ${name}:`, error);
  }
}

/**
 * Interage com componentes da página
 */
async function interactWithComponents(page: any, screenshotsDir: string) {
  console.log('🎯 Interagindo com componentes...');
  
  // Volta para a homepage para interações
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  // Tenta abrir drawers/modais
  const drawerTriggers = [
    { selector: 'button', text: /cart|carinho|bag/i, name: 'carrinho' },
    { selector: 'button', text: /wishlist|favorito|heart/i, name: 'wishlist' },
    { selector: 'button', text: /login|entrar|sign|account/i, name: 'auth' },
    { selector: 'button', text: /menu|☰|≡/i, name: 'menu' },
  ];
  
  for (const trigger of drawerTriggers) {
    try {
      const buttons = await page.locator(trigger.selector).filter({ hasText: trigger.text }).all();
      if (buttons.length > 0) {
        await buttons[0].click();
        await page.waitForTimeout(1500);
        await takeScreenshot(page, `interaction-${trigger.name}`, screenshotsDir);
        
        // Se o drawer abriu, faz scroll dentro dele se possível
        const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="modal"]').first();
        if (await drawer.count() > 0) {
          // Tenta fazer scroll dentro do drawer
          await drawer.evaluate((el: any) => {
            if (el.scrollHeight > el.clientHeight) {
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
            }
          });
          await page.waitForTimeout(1000);
          await takeScreenshot(page, `interaction-${trigger.name}-scroll`, screenshotsDir);
        }
        
        // Tenta fechar
        const closeButtons = await page.locator('button, [aria-label*="close"], [aria-label*="fechar"]').all();
        if (closeButtons.length > 0) {
          await closeButtons[0].click();
          await page.waitForTimeout(500);
        }
      }
    } catch (error) {
      // Continua mesmo com erro
    }
  }
  
  // Tenta clicar em produtos se encontrar
  try {
    const productLinks = await page.locator('a[href*="/product/"]').all();
    if (productLinks.length > 0) {
      await productLinks[0].click();
      await page.waitForTimeout(2000);
      
      // Faz scroll completo na página do produto
      await scrollPageProgressively(page, 'interaction-produto', screenshotsDir);
    }
  } catch (error) {
    // Continua
  }
}

/**
 * Testa diferentes viewports com scroll completo
 */
async function testViewports(page: any, screenshotsDir: string) {
  console.log('📱 Testando diferentes viewports com scroll...');
  
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Screenshot inicial
    await takeScreenshot(page, `viewport-${viewport.name}-topo`, screenshotsDir);
    
    // Scroll progressivo
    await scrollPageProgressively(page, `viewport-${viewport.name}`, screenshotsDir);
    
    // Screenshot final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await takeScreenshot(page, `viewport-${viewport.name}-final`, screenshotsDir);
  }
}

/**
 * Gera relatório final
 */
async function generateReport(visitedUrls: Set<string>, screenshotsTaken: Map<string, number>, screenshotsDir: string) {
  const report = {
    timestamp: new Date().toISOString(),
    totalUrlsVisited: visitedUrls.size,
    urls: Array.from(visitedUrls).sort(),
    totalScreenshots: screenshotsTaken.size,
    screenshotsByType: Object.fromEntries(screenshotsTaken),
  };
  
  const reportPath = path.join(screenshotsDir, 'navigation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📄 Relatório gerado em:', reportPath);
}

