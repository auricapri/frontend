import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.auricapri.com.br';
const TEST_EMAIL = 'marcus.lirio@icloud.com';
const TEST_PASSWORD = 'Raposa69*@69';

test('Debug PIX flow in production', async ({ page }) => {
  test.setTimeout(180000);

  const allLogs: string[] = [];
  const apiCalls: { method: string; url: string; status?: number; body?: string }[] = [];

  // Capture console logs
  page.on('console', (msg) => {
    const text = `CONSOLE [${msg.type()}]: ${msg.text()}`;
    allLogs.push(text);
    console.log(text);
  });

  // Capture network requests/responses
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('api.auricapri') || url.includes('localhost:3002')) {
      const entry = { method: request.method(), url };
      apiCalls.push(entry);
      console.log(`→ REQUEST: ${entry.method} ${entry.url}`);
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api.auricapri') || url.includes('localhost:3002')) {
      const status = response.status();
      console.log(`← RESPONSE: ${status} ${url}`);

      // Log error bodies
      if (status >= 400) {
        try {
          const body = await response.text();
          console.log(`   ERROR BODY: ${body.substring(0, 500)}`);
          const entry = apiCalls.find(e => e.url === url && !e.status);
          if (entry) {
            entry.status = status;
            entry.body = body.substring(0, 500);
          }
        } catch (e) {}
      }
    }
  });

  // Step 1: Go to homepage
  console.log('\n=== STEP 1: Homepage ===');
  await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/prod-pix-01-homepage.png' });

  // Step 2: Login
  console.log('\n=== STEP 2: Login ===');
  const loginBtn = page.locator('button:has-text("Entrar")').first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
    await page.waitForTimeout(1500);

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await page.waitForTimeout(500);

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    console.log('Logged in');
  }
  await page.screenshot({ path: '/tmp/prod-pix-02-loggedin.png' });

  // Step 3: Add product to cart
  console.log('\n=== STEP 3: Add to cart ===');
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1000);

  const productCard = page.locator('a[href*="/product"]').first();
  if (await productCard.isVisible()) {
    await productCard.click();
    await page.waitForTimeout(2000);
  }

  // Select size
  const sizeBtn = page.locator('button:has-text("M"), button:has-text("P")').first();
  if (await sizeBtn.isVisible()) {
    await sizeBtn.click();
    await page.waitForTimeout(500);
  }

  // Add to cart
  const addToCartBtn = page.locator('button:has-text("ADICIONAR")').first();
  if (await addToCartBtn.isVisible()) {
    await addToCartBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/tmp/prod-pix-03-cart.png' });

  // Step 4: Go to checkout
  console.log('\n=== STEP 4: Checkout ===');
  await page.goto(`${PROD_URL}/checkout`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/prod-pix-04-checkout.png' });

  // Step 5: Fill address
  console.log('\n=== STEP 5: Fill address ===');
  const cepInput = page.locator('input[placeholder*="CEP"]').first();
  if (await cepInput.isVisible()) {
    await cepInput.fill('01310100');
    await page.waitForTimeout(2000);
  }

  const numeroInput = page.locator('input[placeholder*="Número"]').first();
  if (await numeroInput.isVisible()) {
    await numeroInput.fill('100');
  }

  const cpfInput = page.locator('input[placeholder*="CPF"]').first();
  if (await cpfInput.isVisible()) {
    await cpfInput.fill('12345678909');
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/prod-pix-05-address.png' });

  // Step 6: Click confirm to go to payment
  console.log('\n=== STEP 6: Go to payment ===');
  const confirmBtn = page.locator('button:has-text("CONFIRMAR")').first();
  if (await confirmBtn.isVisible() && await confirmBtn.isEnabled()) {
    await confirmBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/tmp/prod-pix-06-payment.png' });

  // Step 7: Select PIX
  console.log('\n=== STEP 7: Select PIX ===');
  const pixOption = page.locator('text=PIX INSTANTÂNEO').first();
  if (await pixOption.isVisible()) {
    await pixOption.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: '/tmp/prod-pix-07-pix-selected.png' });

  // Step 8: Click Review
  console.log('\n=== STEP 8: Review ===');
  const reviewBtn = page.locator('button:has-text("REVISAR")').first();
  if (await reviewBtn.isVisible()) {
    await reviewBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: '/tmp/prod-pix-08-review.png' });

  // Step 9: CLICK CONCLUIR COMPRA
  console.log('\n=== STEP 9: CONCLUIR COMPRA ===');
  const completeBtn = page.locator('button:has-text("CONCLUIR COMPRA")').first();

  if (await completeBtn.isVisible()) {
    console.log('Found CONCLUIR COMPRA button, clicking...');

    // Clear any previous API calls
    apiCalls.length = 0;

    await completeBtn.click();

    // Wait for processing
    console.log('Waiting for API calls...');
    await page.waitForTimeout(15000);
  }

  await page.screenshot({ path: '/tmp/prod-pix-09-after-complete.png' });

  // Step 10: Check results
  console.log('\n=== STEP 10: Check Results ===');

  // Check for QR code
  const qrCodeImg = page.locator('img[src*="data:image"]');
  const hasRealQR = await qrCodeImg.count() > 0;
  console.log(`Real QR Code: ${hasRealQR ? 'YES' : 'NO'}`);

  // Check for placeholder
  const placeholder = page.locator('text=QR CODE SERÁ GERADO');
  const hasPlaceholder = await placeholder.isVisible();
  console.log(`Placeholder visible: ${hasPlaceholder ? 'YES (BAD!)' : 'NO (GOOD)'}`);

  // Check for error messages
  const errorElements = page.locator('[class*="error"], [class*="Error"], .text-red, text=/erro|error/i');
  const errorCount = await errorElements.count();
  console.log(`Error elements found: ${errorCount}`);

  // Check current step
  const isOnReviewStep = await page.locator('text=Finalização Segura').isVisible();
  const isOnPaymentStep = await page.locator('text=SELECIONE O MÉTODO').isVisible();
  console.log(`On Review step: ${isOnReviewStep}`);
  console.log(`On Payment step: ${isOnPaymentStep}`);

  // Print all API calls made
  console.log('\n=== API CALLS MADE ===');
  apiCalls.forEach((call, i) => {
    console.log(`${i + 1}. ${call.method} ${call.url}`);
    if (call.status) console.log(`   Status: ${call.status}`);
    if (call.body) console.log(`   Body: ${call.body}`);
  });

  // Check if payments/process was called
  const paymentsCall = apiCalls.find(c => c.url.includes('payments/process'));
  console.log(`\nPayments/process called: ${paymentsCall ? 'YES' : 'NO'}`);
  if (paymentsCall) {
    console.log(`  Method: ${paymentsCall.method}`);
    console.log(`  Status: ${paymentsCall.status || 'pending'}`);
    if (paymentsCall.body) console.log(`  Body: ${paymentsCall.body}`);
  }

  // Check if orders API was called
  const ordersCall = apiCalls.find(c => c.url.includes('/api/orders') && c.method === 'POST');
  console.log(`\nOrders POST called: ${ordersCall ? 'YES' : 'NO'}`);
  if (ordersCall) {
    console.log(`  Status: ${ordersCall.status || 'pending'}`);
    if (ordersCall.body) console.log(`  Body: ${ordersCall.body}`);
  }

  await page.screenshot({ path: '/tmp/prod-pix-10-final.png', fullPage: true });

  // Print summary
  console.log('\n========== SUMMARY ==========');
  console.log(`Real QR Code displayed: ${hasRealQR}`);
  console.log(`Placeholder showing: ${hasPlaceholder}`);
  console.log(`Order created: ${ordersCall ? 'YES' : 'NO'}`);
  console.log(`PIX generated: ${paymentsCall ? 'YES' : 'NO'}`);

  if (hasPlaceholder && !hasRealQR) {
    console.log('\n❌ PIX NOT WORKING: QR code was not generated');
    if (!ordersCall) {
      console.log('   CAUSE: Order was not created');
    } else if (!paymentsCall) {
      console.log('   CAUSE: Payments/process was not called');
    } else if (paymentsCall.status && paymentsCall.status >= 400) {
      console.log(`   CAUSE: Payments/process returned error ${paymentsCall.status}`);
    }
  } else if (hasRealQR) {
    console.log('\n✅ PIX WORKING: QR code was generated');
  }
});
