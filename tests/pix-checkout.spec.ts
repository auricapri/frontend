import { test, expect } from '@playwright/test';

test.describe('PIX Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 800 });

    // Capture network errors and API responses
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('[PIX]') || msg.text().includes('Error')) {
        console.log('CONSOLE:', msg.type(), msg.text());
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/orders') || url.includes('/api/payments')) {
        console.log('API Response:', response.status(), url);
        if (response.status() >= 400) {
          response.text().then(text => console.log('API Error Body:', text.substring(0, 500)));
        }
      }
    });

    page.on('requestfailed', request => {
      console.log('Request FAILED:', request.url(), request.failure()?.errorText);
    });
  });

  test('Complete PIX checkout flow with QR code generation', async ({ page }) => {
    // Increase timeout for this long test
    test.setTimeout(180000);

    // 1. Go to homepage and login
    console.log('Step 1: Going to homepage...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open auth drawer - click the visible user icon with aria-label "Login"
    const allLoginButtons = page.locator('button[aria-label="Login"]');
    const loginBtnCount = await allLoginButtons.count();
    console.log('Login buttons found:', loginBtnCount);

    // Find the visible login button
    let authButton = null;
    for (let i = 0; i < loginBtnCount; i++) {
      const btn = allLoginButtons.nth(i);
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        authButton = btn;
        console.log('Found visible login button at index:', i);
        break;
      }
    }

    if (authButton) {
      console.log('Clicking auth button...');
      await authButton.click();

      // Wait for auth drawer to appear
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/00-auth-drawer.png', fullPage: true });
      console.log('Screenshot 00: Auth drawer opened');

      // Fill login form - wait for email input in the auth drawer
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();

      const emailVisible = await emailInput.isVisible().catch(() => false);
      const passVisible = await passwordInput.isVisible().catch(() => false);
      console.log('Email input visible:', emailVisible, 'Password visible:', passVisible);

      if (emailVisible && passVisible) {
        console.log('Filling login form...');
        await emailInput.fill('marcus.lirio1@gmail.com');
        await passwordInput.fill('Raposa69*');

        // Click the submit button inside the form (not Google/Apple login)
        const submitButton = page.locator('form button[type="submit"]').first();
        const submitVisible = await submitButton.isVisible().catch(() => false);
        console.log('Submit button visible:', submitVisible);

        if (submitVisible) {
          await submitButton.click();
          console.log('Clicked login submit button');
          // Wait for login to complete
          await page.waitForTimeout(4000);
        }
      } else {
        console.log('ERROR: Login form not visible!');
      }
    } else {
      console.log('ERROR: No visible login button found!');
    }

    // Screenshot after login
    await page.screenshot({ path: 'test-results/01-after-login.png', fullPage: true });
    console.log('Screenshot 01: After login');

    // 2. Scroll to products section (products are on the home page after Hero)
    console.log('Step 2: Scrolling to products...');
    await page.evaluate(() => {
      window.scrollTo(0, 600);
    });
    await page.waitForTimeout(2000);

    // Wait for products to load
    await page.screenshot({ path: 'test-results/02-products-visible.png', fullPage: true });
    console.log('Screenshot 02: Products section');

    // Click on a product card (div with cursor-pointer that contains product info)
    // Products are rendered as divs with onClick handlers, not anchor links
    const productCard = page.locator('div.cursor-pointer.group').first();
    const productCardCount = await productCard.count();
    console.log('Product cards found:', productCardCount);

    if (productCardCount > 0) {
      console.log('Clicking first product card...');
      await productCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } else {
      console.log('ERROR: No product cards found!');
    }

    await page.screenshot({ path: 'test-results/03-product-detail.png', fullPage: true });
    console.log('Screenshot 03: Product detail page');

    // Select size if needed (click first available size button)
    const sizeButtons = page.locator('button').filter({ hasText: /^(P|M|G|GG|PP|XG|34|35|36|37|38|39|40|41|42|43|44|UNICO|U)$/i });
    const sizeCount = await sizeButtons.count();
    console.log('Size buttons found:', sizeCount);

    if (sizeCount > 0) {
      // Find first enabled size button
      for (let i = 0; i < sizeCount; i++) {
        const btn = sizeButtons.nth(i);
        const isEnabled = await btn.isEnabled();
        const isVisible = await btn.isVisible();
        if (isEnabled && isVisible) {
          const text = await btn.textContent();
          console.log('Clicking size:', text);
          await btn.click();
          await page.waitForTimeout(500);
          break;
        }
      }
    }

    await page.screenshot({ path: 'test-results/04-size-selected.png', fullPage: true });
    console.log('Screenshot 04: Size selected');

    // Add to cart - look for ADICIONAR À BOLSA button
    const addToCartButton = page.locator('button').filter({ hasText: /adicionar|comprar/i }).first();
    const addBtnCount = await addToCartButton.count();
    console.log('Add to cart buttons found:', addBtnCount);

    if (addBtnCount > 0) {
      const isEnabled = await addToCartButton.isEnabled();
      console.log('Add to cart button enabled:', isEnabled);

      if (isEnabled) {
        console.log('Clicking add to cart...');
        await addToCartButton.click();
        await page.waitForTimeout(3000);
      } else {
        console.log('ERROR: Add to cart button is disabled!');
      }
    }

    await page.screenshot({ path: 'test-results/05-product-added.png', fullPage: true });
    console.log('Screenshot 05: After add to cart');

    // 3. Go to checkout
    console.log('Step 3: Going to checkout...');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/06-checkout-initial.png', fullPage: true });
    console.log('Screenshot 06: Checkout initial state');

    // Check cart status
    const cartEmpty = page.locator('text=Nenhum item no carrinho');
    const isCartEmpty = await cartEmpty.isVisible().catch(() => false);
    console.log('Cart is empty:', isCartEmpty);

    if (isCartEmpty) {
      console.log('WARNING: Cart is empty!');
    }

    // 4. Fill address - CEP
    console.log('Step 4: Filling address...');
    const cepInput = page.locator('[data-testid="checkout-cep-input"]').or(
      page.locator('input[placeholder*="00000"]').first()
    );

    if (await cepInput.count() > 0) {
      await cepInput.clear();
      await cepInput.fill('01310100');
      console.log('CEP filled: 01310100');
      await page.waitForTimeout(3000); // Wait for address lookup
    }

    // Fill number
    const numInput = page.getByRole('textbox', { name: 'Ex: 123' });
    if (await numInput.count() > 0) {
      await numInput.fill('100');
      console.log('Number filled: 100');
    }

    // Fill phone if visible
    const phoneInput = page.locator('input[placeholder*="99999"]').first();
    if (await phoneInput.count() > 0 && await phoneInput.isVisible()) {
      await phoneInput.fill('11999999999');
      console.log('Phone filled: 11999999999');
    }

    // Fill CPF if visible
    const cpfInput = page.locator('input[placeholder*="000.000"]').first();
    if (await cpfInput.count() > 0 && await cpfInput.isVisible()) {
      await cpfInput.fill('12345678909');
      console.log('CPF filled: 12345678909');
    }

    await page.screenshot({ path: 'test-results/07-address-filled.png', fullPage: true });
    console.log('Screenshot 07: Address filled');

    // 5. Click "Confirmar e Pagar" button to go to payment step
    console.log('Step 5: Clicking Confirmar e Pagar...');
    const confirmAddressButton = page.locator('button').filter({ hasText: /confirmar.*pagar/i }).first();
    const confirmBtnEnabled = await confirmAddressButton.isEnabled().catch(() => false);
    console.log('Confirm button enabled:', confirmBtnEnabled);

    if (confirmBtnEnabled) {
      await confirmAddressButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('ERROR: Confirmar e Pagar button is disabled!');
      // Take diagnostic screenshot
      await page.screenshot({ path: 'test-results/ERROR-button-disabled.png', fullPage: true });
    }

    await page.screenshot({ path: 'test-results/08-payment-step.png', fullPage: true });
    console.log('Screenshot 08: Payment step');

    // 6. Select PIX payment method
    console.log('Step 6: Selecting PIX...');
    const pixOption = page.locator('[data-testid="payment-pix"]').or(
      page.locator('button').filter({ hasText: /pix/i }).first()
    );

    if (await pixOption.count() > 0) {
      await pixOption.click();
      await page.waitForTimeout(1000);
      console.log('PIX selected');
    }

    await page.screenshot({ path: 'test-results/09-pix-selected.png', fullPage: true });
    console.log('Screenshot 09: PIX selected');

    // 7. Click "Revisar Pedido" to go to review step
    console.log('Step 7: Clicking Revisar Pedido...');
    const reviewButton = page.locator('button').filter({ hasText: /revisar.*pedido/i }).first();
    if (await reviewButton.count() > 0 && await reviewButton.isEnabled()) {
      await reviewButton.click();
      await page.waitForTimeout(2000);
      console.log('Review step opened');
    }

    await page.screenshot({ path: 'test-results/10-review-step.png', fullPage: true });
    console.log('Screenshot 10: Review step');

    // 8. Click "CONCLUIR COMPRA" to generate PIX
    console.log('Step 8: Clicking CONCLUIR COMPRA...');
    const completeOrderButton = page.locator('button').filter({ hasText: /concluir.*compra/i }).first();
    if (await completeOrderButton.count() > 0 && await completeOrderButton.isEnabled()) {
      console.log('Clicking complete order button...');
      await completeOrderButton.click();

      // Wait for processing to start
      await page.waitForTimeout(1000);

      // Check if button shows "PROCESSANDO..."
      const isProcessing = await page.locator('button').filter({ hasText: /processando/i }).isVisible().catch(() => false);
      console.log('Button showing PROCESSANDO:', isProcessing);

      // Wait for PIX generation (this can take several seconds)
      console.log('Waiting for PIX generation...');
      await page.waitForTimeout(10000);

      // Check for error message in red box (ReviewStep error)
      const errorBox = page.locator('.bg-red-50');
      const hasErrorBox = await errorBox.isVisible().catch(() => false);
      if (hasErrorBox) {
        const errorText = await errorBox.textContent();
        console.log('ERROR MESSAGE FOUND:', errorText);
      }

      // Check current step indicator
      const reviewActive = await page.locator('text=REVISÃO').evaluate(el => el.closest('div')?.classList.contains('bg-black')).catch(() => false);
      const paymentActive = await page.locator('text=PAGAMENTO').evaluate(el => el.closest('div')?.classList.contains('bg-black')).catch(() => false);
      console.log('On REVISÃO step:', reviewActive);
      console.log('On PAGAMENTO step:', paymentActive);
    } else {
      console.log('ERROR: Complete order button not found or disabled!');
    }

    await page.screenshot({ path: 'test-results/11-pix-qrcode.png', fullPage: true });
    console.log('Screenshot 11: PIX QR code page');

    // 9. Verify QR Code is visible (not placeholder)
    console.log('Step 9: Verifying QR Code...');
    const qrCodeImage = page.locator('img[alt*="QR Code PIX"]');
    const qrCodePlaceholder = page.locator('svg.lucide-qr-code');

    // Check if the real QR code is shown
    const hasRealQRCode = await qrCodeImage.count() > 0;
    const hasPlaceholder = await qrCodePlaceholder.isVisible().catch(() => false);

    console.log('Real QR Code Image found:', hasRealQRCode);
    console.log('Placeholder still visible:', hasPlaceholder);

    // Get QR code src if available
    if (hasRealQRCode) {
      const src = await qrCodeImage.getAttribute('src');
      console.log('QR Code src starts with:', src?.substring(0, 50));
    }

    // 10. Verify copy button is visible
    const copyButton = page.locator('button').filter({ hasText: /copiar.*pix/i }).first();
    const hasCopyButton = await copyButton.isVisible().catch(() => false);
    console.log('Copy PIX button visible:', hasCopyButton);

    // 11. Verify countdown timer is visible
    const countdown = page.locator('[class*="font-mono"]').filter({ hasText: /\d{2}:\d{2}/ }).first();
    const hasCountdown = await countdown.isVisible().catch(() => false);
    console.log('Countdown timer visible:', hasCountdown);

    if (hasCountdown) {
      const countdownText = await countdown.textContent();
      console.log('Countdown value:', countdownText);
    }

    // Check for errors on page
    const errorTexts = await page.locator('text=/erro|error|falha/i').allTextContents();
    if (errorTexts.length > 0) {
      console.log('Errors found on page:', errorTexts);
    }

    // Final screenshot
    await page.screenshot({ path: 'test-results/12-final-state.png', fullPage: true });
    console.log('Screenshot 12: Final state');

    // Summary
    console.log('\n=== PIX CHECKOUT TEST SUMMARY ===');
    console.log('Real QR Code displayed:', hasRealQRCode);
    console.log('Copy button visible:', hasCopyButton);
    console.log('Countdown timer visible:', hasCountdown);
    console.log('Placeholder showing:', hasPlaceholder);

    if (hasRealQRCode && hasCopyButton) {
      console.log('SUCCESS: PIX checkout flow working correctly!');
    } else {
      console.log('ISSUE: PIX checkout needs fixes');
    }
  });
});
