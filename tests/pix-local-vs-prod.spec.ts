import { test, expect } from '@playwright/test';

const LOCAL_URL = 'http://localhost:3000';
const PROD_URL = 'https://www.auricapri.com.br';

// Test credentials
const TEST_EMAIL = 'marcus.lirio@icloud.com';
const TEST_PASSWORD = 'Raposa69*@69';

async function testPixCheckout(page: any, baseUrl: string, envName: string) {
  console.log(`\n========== TESTING ${envName} ==========`);
  console.log(`URL: ${baseUrl}`);

  // Listen to network requests
  const apiRequests: string[] = [];
  page.on('request', (request: any) => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('asaas')) {
      apiRequests.push(`${request.method()} ${url}`);
    }
  });

  page.on('response', async (response: any) => {
    const url = response.url();
    if (url.includes('/api/payments') || url.includes('/api/orders')) {
      const status = response.status();
      console.log(`[${envName}] API Response: ${status} ${url}`);
      if (status >= 400) {
        try {
          const body = await response.text();
          console.log(`[${envName}] Error body: ${body.substring(0, 500)}`);
        } catch (e) {}
      }
    }
  });

  // Console logs
  page.on('console', (msg: any) => {
    if (msg.text().includes('PIX') || msg.text().includes('error') || msg.text().includes('Error')) {
      console.log(`[${envName}] CONSOLE: ${msg.type()} ${msg.text()}`);
    }
  });

  // Step 1: Go to homepage
  console.log(`[${envName}] Step 1: Going to homepage...`);
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Step 2: Login
  console.log(`[${envName}] Step 2: Logging in...`);
  const loginButtons = page.locator('button:has-text("Entrar"), button:has-text("Login"), [data-testid="login-button"]');
  const loginCount = await loginButtons.count();
  console.log(`[${envName}] Login buttons found: ${loginCount}`);

  if (loginCount > 0) {
    for (let i = 0; i < loginCount; i++) {
      const btn = loginButtons.nth(i);
      if (await btn.isVisible()) {
        await btn.click();
        break;
      }
    }
    await page.waitForTimeout(1500);

    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      await page.waitForTimeout(500);

      const submitBtn = page.locator('button[type="submit"]:has-text("Entrar"), button:has-text("Entrar")').first();
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log(`[${envName}] Logged in`);
    }
  }

  // Step 3: Add product to cart
  console.log(`[${envName}] Step 3: Adding product to cart...`);
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1000);

  const productCard = page.locator('[class*="product"], [class*="card"], a[href*="/product"]').first();
  if (await productCard.isVisible()) {
    await productCard.click();
    await page.waitForTimeout(2000);
  }

  // Select size
  const sizeBtn = page.locator('button:has-text("M"), button:has-text("P"), button:has-text("G")').first();
  if (await sizeBtn.isVisible()) {
    await sizeBtn.click();
    await page.waitForTimeout(500);
  }

  // Add to cart
  const addToCartBtn = page.locator('button:has-text("ADICIONAR"), button:has-text("Adicionar")').first();
  if (await addToCartBtn.isVisible()) {
    await addToCartBtn.click();
    await page.waitForTimeout(2000);
  }

  // Step 4: Go to checkout
  console.log(`[${envName}] Step 4: Going to checkout...`);
  await page.goto(`${baseUrl}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: `/tmp/${envName}-01-checkout.png`, fullPage: true });

  // Step 5: Fill address
  console.log(`[${envName}] Step 5: Filling address...`);
  const cepInput = page.locator('input[placeholder*="CEP"], input[name="cep"]').first();
  if (await cepInput.isVisible()) {
    await cepInput.fill('01310100');
    await page.waitForTimeout(1500);
  }

  const numeroInput = page.locator('input[placeholder*="Número"], input[name="numero"]').first();
  if (await numeroInput.isVisible()) {
    await numeroInput.fill('100');
  }

  const cpfInput = page.locator('input[placeholder*="CPF"], input[name="cpf"]').first();
  if (await cpfInput.isVisible()) {
    await cpfInput.fill('12345678909');
  }
  await page.waitForTimeout(1000);

  // Step 6: Click confirm button to go to payment step
  console.log(`[${envName}] Step 6: Going to payment step...`);
  const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("CONFIRMAR")').first();
  if (await confirmBtn.isVisible() && await confirmBtn.isEnabled()) {
    await confirmBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `/tmp/${envName}-02-payment-step.png`, fullPage: true });

  // Step 7: Select PIX
  console.log(`[${envName}] Step 7: Selecting PIX...`);
  const pixOption = page.locator('text=PIX INSTANTÂNEO, button:has-text("PIX"), [class*="pix"]').first();
  await pixOption.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: `/tmp/${envName}-03-pix-selected.png`, fullPage: true });

  // Step 8: Click Review Order
  console.log(`[${envName}] Step 8: Clicking Review Order...`);
  const reviewBtn = page.locator('button:has-text("REVISAR"), button:has-text("Revisar")').first();
  if (await reviewBtn.isVisible()) {
    await reviewBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `/tmp/${envName}-04-review-step.png`, fullPage: true });

  // Step 9: Click CONCLUIR COMPRA
  console.log(`[${envName}] Step 9: Clicking CONCLUIR COMPRA...`);
  const completeBtn = page.locator('button:has-text("CONCLUIR COMPRA"), button:has-text("Concluir")').first();

  if (await completeBtn.isVisible()) {
    console.log(`[${envName}] Complete button found, clicking...`);
    await completeBtn.click();

    // Wait for API calls
    console.log(`[${envName}] Waiting for PIX generation...`);
    await page.waitForTimeout(10000);
  }

  await page.screenshot({ path: `/tmp/${envName}-05-after-complete.png`, fullPage: true });

  // Step 10: Check PIX results
  console.log(`[${envName}] Step 10: Checking PIX results...`);

  // Check for real QR code (base64 image)
  const qrCodeImg = page.locator('img[src*="data:image"], img[src*="base64"]');
  const hasRealQR = await qrCodeImg.count() > 0;

  // Check for placeholder
  const placeholder = page.locator('text=QR CODE SERÁ GERADO');
  const hasPlaceholder = await placeholder.isVisible();

  // Check for copy button
  const copyBtn = page.locator('button:has-text("Copiar"), button:has-text("COPIAR")');
  const hasCopyBtn = await copyBtn.count() > 0 && await copyBtn.first().isVisible();

  // Check for timer
  const timer = page.locator('text=/\\d+:\\d+/');
  const hasTimer = await timer.count() > 0;

  // Check for error messages
  const errorText = await page.locator('text=/erro|error|falha|failed/i').count();

  console.log(`\n[${envName}] ========== RESULTS ==========`);
  console.log(`[${envName}] Real QR Code: ${hasRealQR ? '✅ YES' : '❌ NO'}`);
  console.log(`[${envName}] Placeholder visible: ${hasPlaceholder ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
  console.log(`[${envName}] Copy button: ${hasCopyBtn ? '✅ YES' : '❌ NO'}`);
  console.log(`[${envName}] Timer: ${hasTimer ? '✅ YES' : '❌ NO'}`);
  console.log(`[${envName}] Error messages: ${errorText > 0 ? '❌ YES' : '✅ NO'}`);
  console.log(`[${envName}] API requests made: ${apiRequests.length}`);

  // Log payment-related API requests
  const paymentRequests = apiRequests.filter(r => r.includes('payment') || r.includes('order'));
  console.log(`[${envName}] Payment API requests:`);
  paymentRequests.forEach(r => console.log(`  - ${r}`));

  await page.screenshot({ path: `/tmp/${envName}-06-final.png`, fullPage: true });

  return {
    hasRealQR,
    hasPlaceholder,
    hasCopyBtn,
    hasTimer,
    errorText,
    apiRequests: paymentRequests
  };
}

test('Compare PIX checkout: Local vs Production', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes total

  // Test LOCAL first
  let localResults;
  try {
    localResults = await testPixCheckout(page, LOCAL_URL, 'LOCAL');
  } catch (e) {
    console.log(`[LOCAL] Test failed: ${e}`);
    localResults = { error: String(e) };
  }

  // Clear state
  await page.context().clearCookies();

  // Test PRODUCTION
  let prodResults;
  try {
    prodResults = await testPixCheckout(page, PROD_URL, 'PROD');
  } catch (e) {
    console.log(`[PROD] Test failed: ${e}`);
    prodResults = { error: String(e) };
  }

  // Final comparison
  console.log('\n\n========== COMPARISON ==========');
  console.log('LOCAL:', JSON.stringify(localResults, null, 2));
  console.log('PROD:', JSON.stringify(prodResults, null, 2));
});

test('Quick PROD PIX test', async ({ page }) => {
  test.setTimeout(120000);

  console.log('Testing PRODUCTION only...');

  // Listen to ALL network
  page.on('request', (request: any) => {
    const url = request.url();
    if (url.includes('api')) {
      console.log(`REQUEST: ${request.method()} ${url}`);
    }
  });

  page.on('response', async (response: any) => {
    const url = response.url();
    if (url.includes('api')) {
      console.log(`RESPONSE: ${response.status()} ${url}`);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log(`ERROR BODY: ${body.substring(0, 1000)}`);
        } catch (e) {}
      }
    }
  });

  page.on('console', (msg: any) => {
    const text = msg.text();
    if (text.includes('PIX') || text.includes('error') || text.includes('Error') || text.includes('payment')) {
      console.log(`CONSOLE [${msg.type()}]: ${text}`);
    }
  });

  await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: '/tmp/prod-test-01.png' });

  // Just check what API URL the frontend is using
  const apiUrl = await page.evaluate(() => {
    // @ts-ignore
    return window.__VITE_API_URL__ || 'not found in window';
  });
  console.log(`Frontend API URL from window: ${apiUrl}`);

  // Check localStorage/env
  const envCheck = await page.evaluate(() => {
    return {
      localStorage: Object.keys(localStorage),
      // @ts-ignore
      env: typeof import.meta !== 'undefined' ? 'vite env available' : 'no vite env'
    };
  });
  console.log('Env check:', envCheck);
});
