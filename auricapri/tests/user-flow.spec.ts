import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Testes de Fluxo do Usuário - Cadastro e Preenchimento de Endereço
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '../docs/screenshots/user-flow');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Fluxo do Usuário - Cadastro e Endereço', () => {
  test('Simular cadastro completo e preenchimento de endereço', async ({ page }) => {
    test.setTimeout(300000); // 5 minutos
    
    console.log('👤 Iniciando simulação de cadastro...');
    
    // 1. Vai para a homepage
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(screenshotsDir, '01-homepage.png'),
      fullPage: true,
    });
    
    // 2. Abre o drawer de autenticação
    console.log('🔓 Abrindo drawer de autenticação...');
    const authButtons = await page.locator('button, a').filter({ 
      hasText: /login|entrar|sign|account|conta|user|👤/i 
    }).all();
    
    if (authButtons.length > 0) {
      await authButtons[0].click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(screenshotsDir, '02-auth-drawer-aberto.png'),
        fullPage: true,
      });
    } else {
      console.log('⚠️ Botão de autenticação não encontrado');
    }
    
    // 3. Alterna para modo de cadastro
    console.log('📝 Alternando para modo de cadastro...');
    const registerButtons = await page.locator('button, a').filter({ 
      hasText: /cadastr|registr|sign up|create account|criar conta/i 
    }).all();
    
    if (registerButtons.length > 0) {
      await registerButtons[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '03-modo-cadastro.png'),
        fullPage: true,
      });
    } else {
      // Tenta encontrar tab ou switch
      const tabs = await page.locator('[role="tab"], button').filter({ 
        hasText: /cadastr|registr/i 
      }).all();
      if (tabs.length > 0) {
        await tabs[0].click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(screenshotsDir, '03-modo-cadastro.png'),
          fullPage: true,
        });
      }
    }
    
    // 4. Preenche formulário de cadastro
    console.log('✍️ Preenchendo formulário de cadastro...');
    
    // Nome completo
    const nameInput = page.locator('input[type="text"], input[name*="name"], input[placeholder*="nome"], input[placeholder*="name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill('João Silva');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '04-cadastro-nome-preenchido.png'),
        fullPage: true,
      });
    }
    
    // Email
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    if (await emailInput.count() > 0) {
      const testEmail = `teste${Date.now()}@example.com`;
      await emailInput.fill(testEmail);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '05-cadastro-email-preenchido.png'),
        fullPage: true,
      });
    }
    
    // Senha
    const passwordInputs = await page.locator('input[type="password"]').all();
    if (passwordInputs.length > 0) {
      await passwordInputs[0].fill('senha123456');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '06-cadastro-senha-preenchido.png'),
        fullPage: true,
      });
      
      // Se houver confirmação de senha
      if (passwordInputs.length > 1) {
        await passwordInputs[1].fill('senha123456');
        await page.waitForTimeout(500);
      }
    }
    
    // Screenshot do formulário completo preenchido
    await page.screenshot({
      path: path.join(screenshotsDir, '07-formulario-cadastro-completo.png'),
      fullPage: true,
    });
    
    // NOTA: Não vamos realmente submeter o cadastro para não criar dados de teste
    // Mas podemos simular o clique no botão de submit (sem esperar resposta)
    const submitButton = page.locator('button[type="submit"], button').filter({ 
      hasText: /cadastr|registr|sign up|criar conta|enviar|submit/i 
    }).first();
    
    if (await submitButton.count() > 0) {
      console.log('⚠️ Formulário preenchido (não será submetido para evitar dados de teste)');
      // await submitButton.click(); // Comentado para não criar dados reais
    }
    
    // 5. Fecha o drawer e vai para o checkout
    console.log('🛒 Navegando para checkout...');
    const closeButton = page.locator('button, [aria-label*="close"], [aria-label*="fechar"]').first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Vai para checkout
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(screenshotsDir, '08-checkout-inicial.png'),
      fullPage: true,
    });
    
    // 6. Preenche o formulário de endereço
    console.log('📍 Preenchendo formulário de endereço...');
    
    // CEP
    const cepInput = page.locator('input[placeholder*="CEP"], input[placeholder*="cep"], input[name*="cep"]').first();
    if (await cepInput.count() > 0) {
      await cepInput.fill('01310-100');
      await page.waitForTimeout(2000); // Aguarda busca do CEP
      await page.screenshot({
        path: path.join(screenshotsDir, '09-endereco-cep-preenchido.png'),
        fullPage: true,
      });
    }
    
    // Número
    const numInput = page.locator('input[placeholder*="número"], input[placeholder*="numero"], input[name*="num"], input[name*="number"]').first();
    if (await numInput.count() > 0) {
      await numInput.fill('123');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '10-endereco-numero-preenchido.png'),
        fullPage: true,
      });
    }
    
    // Complemento
    const complementInput = page.locator('input[placeholder*="complemento"], input[placeholder*="apto"], input[name*="complement"]').first();
    if (await complementInput.count() > 0) {
      await complementInput.fill('Apto 45');
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '11-endereco-complemento-preenchido.png'),
        fullPage: true,
      });
    }
    
    // Nome do destinatário (se houver campo separado)
    const recipientInput = page.locator('input[placeholder*="destinatário"], input[placeholder*="nome completo"], input[name*="recipient"]').first();
    if (await recipientInput.count() > 0) {
      await recipientInput.fill('João Silva');
      await page.waitForTimeout(500);
    }
    
    // Screenshot do formulário de endereço completo
    await page.screenshot({
      path: path.join(screenshotsDir, '12-endereco-completo.png'),
      fullPage: true,
    });
    
    // Scroll na página de checkout para ver todo o formulário
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '13-checkout-scroll.png'),
      fullPage: true,
    });
    
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(screenshotsDir, '14-checkout-final.png'),
      fullPage: true,
    });
    
    console.log('✅ Simulação de cadastro e endereço concluída!');
    
    // Mantém aberto por 3 segundos
    await page.waitForTimeout(3000);
  });

  test('Simular login e preenchimento de endereço', async ({ page }) => {
    test.setTimeout(300000);
    
    console.log('🔐 Simulando login...');
    
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Abre drawer de autenticação
    const authButtons = await page.locator('button, a').filter({ 
      hasText: /login|entrar|sign|account/i 
    }).all();
    
    if (authButtons.length > 0) {
      await authButtons[0].click();
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(screenshotsDir, '15-login-drawer.png'),
        fullPage: true,
      });
      
      // Preenche email
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill('usuario@example.com');
        await page.waitForTimeout(500);
      }
      
      // Preenche senha
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('senha123456');
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({
        path: path.join(screenshotsDir, '16-login-preenchido.png'),
        fullPage: true,
      });
      
      // NOTA: Não vamos realmente fazer login para não criar sessão
      console.log('⚠️ Formulário de login preenchido (não será submetido)');
    }
    
    // Fecha e vai para checkout
    const closeButton = page.locator('button, [aria-label*="close"]').first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Vai para checkout e preenche endereço
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Preenche CEP
    const cepInput = page.locator('input[placeholder*="CEP"], input[name*="cep"]').first();
    if (await cepInput.count() > 0) {
      await cepInput.fill('04547-130');
      await page.waitForTimeout(2000);
    }
    
    // Preenche número
    const numInput = page.locator('input[placeholder*="número"], input[name*="num"]').first();
    if (await numInput.count() > 0) {
      await numInput.fill('456');
      await page.waitForTimeout(500);
    }
    
    // Preenche complemento
    const complementInput = page.locator('input[placeholder*="complemento"]').first();
    if (await complementInput.count() > 0) {
      await complementInput.fill('Bloco B');
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({
      path: path.join(screenshotsDir, '17-endereco-login.png'),
      fullPage: true,
    });
    
    console.log('✅ Simulação de login e endereço concluída!');
    await page.waitForTimeout(3000);
  });
});

