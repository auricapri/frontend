import { test, expect } from '@playwright/test';
import { createConfirmedE2EUser, loginViaAuthDrawer } from './helpers/auth';

test.describe('E2E - Fluxo PIX QR Code', () => {
  test('PIX deve mostrar QR Code antes de mostrar "pedido confirmado"', async ({ page }) => {
    test.setTimeout(180000);

    // Capturar todas as requisições de API relacionadas a pedidos e pagamentos
    const apiCalls: { url: string; method: string; body?: any; response?: any; status?: number }[] = [];

    page.on('request', async (request) => {
      const url = request.url();
      if (url.includes('/orders') || url.includes('/payments') || url.includes('/pix')) {
        apiCalls.push({
          url,
          method: request.method(),
          body: request.postData() ? JSON.parse(request.postData() || '{}') : null,
        });
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/orders') || url.includes('/payments') || url.includes('/pix')) {
        try {
          const body = await response.json().catch(() => null);
          const call = apiCalls.find(c => c.url === url && !c.response);
          if (call) {
            call.response = body;
            call.status = response.status();
          }
        } catch {
          // Ignore parse errors
        }
      }
    });

    // Capturar logs do console
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('[PIX]') || msg.text().includes('pixData') || msg.text().includes('QR')) {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // 1. Abrir home
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 2. Esperar página carregar
    await page.waitForTimeout(5000);

    // 3. Autenticar
    const creds = await createConfirmedE2EUser();
    await loginViaAuthDrawer(page, creds);

    // 4. Clicar no produto "Maxi Conjunto" diretamente pelo heading
    const productHeading = page.getByRole('heading', { name: 'Maxi Conjunto' });
    await expect(productHeading).toBeVisible({ timeout: 30000 });
    await productHeading.click();

    // 5. Esperar página do produto carregar
    await expect(page).toHaveURL(/\/product\//, { timeout: 30000 });

    // 6. Selecionar tamanho (se necessário)
    const sizeButtons = page.locator('button').filter({ hasText: /^(PP|P|M|G|GG|U|UNICO|ÚNICO)$/i });
    if (await sizeButtons.count() > 0) {
      await sizeButtons.first().click();
      await page.waitForTimeout(500);
    }

    // 7. Adicionar à bolsa
    const addButton = page.getByRole('button', { name: /Adicionar|Add to/i }).first();
    await expect(addButton).toBeVisible({ timeout: 30000 });
    await addButton.click();

    // 8. Aguardar drawer do carrinho abrir
    await page.waitForTimeout(1000);

    // 9. Ir para checkout - procurar botão que leva ao checkout
    const checkoutButton = page.getByRole('button', { name: /Finalizar|Checkout|Continuar/i }).first();
    await expect(checkoutButton).toBeVisible({ timeout: 30000 });
    await checkoutButton.click();

    // 10. Esperar página de checkout
    await page.waitForTimeout(3000);

    // 11. Preencher endereço
    // CEP
    const cepInput = page.getByRole('textbox', { name: '00000-000' });
    await expect(cepInput).toBeVisible({ timeout: 30000 });
    await cepInput.fill('01310100');
    await page.waitForTimeout(3000);

    // Número
    const numInput = page.getByRole('textbox', { name: /Ex: 123/i });
    await expect(numInput).toBeVisible({ timeout: 30000 });
    await numInput.fill('123');

    // Telefone
    const phoneInput = page.getByRole('textbox', { name: /99999/i });
    await expect(phoneInput).toBeVisible({ timeout: 30000 });
    await phoneInput.fill('11999999999');

    // CPF
    const cpfInput = page.getByRole('textbox', { name: /000\.000\.000-00/i });
    await expect(cpfInput).toBeVisible({ timeout: 30000 });
    await cpfInput.fill('12345678909');

    // 12. Clicar em "Confirmar e Pagar"
    const confirmButton = page.getByRole('button', { name: /Confirmar e Pagar/i });
    if (await confirmButton.isVisible().catch(() => false)) {
      await expect(confirmButton).toBeEnabled({ timeout: 30000 });
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }

    // 13. Agora estamos no Step 2 (Pagamento) - vamos clicar em PIX
    console.log('=== Aguardando botão PIX ===');
    const pixButton = page.getByRole('button', { name: /PIX/i });
    await expect(pixButton).toBeVisible({ timeout: 30000 });

    // Capturar estado antes do clique
    console.log('=== Clicando em PIX ===');
    await pixButton.click();

    // 14. VERIFICAR O COMPORTAMENTO DO PIX
    // Aguardar um pouco para dar tempo do estado mudar
    await page.waitForTimeout(2000);

    // Verificar se está mostrando loading OU se já tem QR Code
    const loadingText = page.getByText('Gerando QR Code...', { exact: false });
    const qrCodeText = page.getByText('Escaneie o QR Code', { exact: false });
    const errorText = page.locator('.bg-red-500\\/20').filter({ hasText: /erro/i });
    const placeholderText = page.getByText('Clique para gerar o PIX', { exact: false });

    // Capturar estado atual
    const isLoading = await loadingText.isVisible().catch(() => false);
    const hasQrCode = await qrCodeText.isVisible().catch(() => false);
    const hasError = await errorText.count() > 0;
    const hasPlaceholder = await placeholderText.isVisible().catch(() => false);

    console.log(`Estado após clique: loading=${isLoading}, qrCode=${hasQrCode}, error=${hasError}, placeholder=${hasPlaceholder}`);

    // Se está em loading, aguardar até não estar mais (max 60s)
    if (isLoading) {
      console.log('=== Em loading, aguardando conclusão ===');
      await expect(loadingText).not.toBeVisible({ timeout: 60000 });
    }

    // Aguardar mais um pouco para processamento
    await page.waitForTimeout(5000);

    // Capturar estado final
    const finalQrCode = await qrCodeText.isVisible().catch(() => false);
    const finalError = await errorText.count() > 0;
    const finalPlaceholder = await placeholderText.isVisible().catch(() => false);
    const finalLoading = await loadingText.isVisible().catch(() => false);

    console.log(`Estado final: qrCode=${finalQrCode}, error=${finalError}, placeholder=${finalPlaceholder}, loading=${finalLoading}`);

    // Verificar se tem QR Code image (img com base64)
    const qrCodeImage = page.locator('img[alt="QR Code PIX"]');
    const hasQrCodeImage = await qrCodeImage.isVisible().catch(() => false);
    console.log(`QR Code Image visível: ${hasQrCodeImage}`);

    // Verificar se tem código copiável
    const copyButton = page.getByRole('button', { name: /Copiar Código PIX/i });
    const hasCopyButton = await copyButton.isVisible().catch(() => false);
    console.log(`Botão copiar visível: ${hasCopyButton}`);

    // Verificar se mostra "Pedido criado. Aguardando confirmação"
    const orderCreatedText = page.getByText('Pedido criado. Aguardando confirmação', { exact: false });
    const hasOrderCreated = await orderCreatedText.isVisible().catch(() => false);
    console.log(`"Pedido criado" visível: ${hasOrderCreated}`);

    // Log das chamadas de API
    console.log('\n=== Chamadas de API ===');
    apiCalls.forEach((call, i) => {
      console.log(`[${i}] ${call.method} ${call.url}`);
      console.log(`    Status: ${call.status}`);
      if (call.body) {
        console.log(`    Body: ${JSON.stringify(call.body).substring(0, 500)}`);
      }
      if (call.response) {
        console.log(`    Response: ${JSON.stringify(call.response).substring(0, 500)}`);
        if (call.response.qrCodeImage) {
          console.log(`    qrCodeImage: ${call.response.qrCodeImage?.substring(0, 50)}...`);
        }
        if (call.response.qrCodePayload) {
          console.log(`    qrCodePayload: ${call.response.qrCodePayload?.substring(0, 50)}...`);
        }
      }
    });

    // Log dos console.log do frontend
    console.log('\n=== Console Logs do Frontend ===');
    consoleLogs.forEach(log => console.log(log));

    // Screenshot do estado atual
    await page.screenshot({ path: 'test-results/pix-state.png', fullPage: true });

    // ASSERTIONS
    // 1. Se mostra "Pedido criado", DEVE ter QR Code visível também
    if (hasOrderCreated) {
      expect(hasQrCodeImage).toBe(true);
      expect(hasCopyButton).toBe(true);
    }

    // 2. Não deve mostrar placeholder se mostra "Pedido criado"
    if (hasOrderCreated) {
      expect(finalPlaceholder).toBe(false);
    }

    // 3. Se teve erro, deve mostrar mensagem de erro
    if (finalError) {
      const errorMessage = await errorText.first().textContent();
      console.log(`Mensagem de erro: ${errorMessage}`);
    }

    // 4. O teste principal: QR Code deve aparecer antes ou junto com "Pedido criado"
    // Se "Pedido criado" está visível, QR Code também deve estar
    expect(hasOrderCreated && !hasQrCodeImage).toBe(false);
  });
});
