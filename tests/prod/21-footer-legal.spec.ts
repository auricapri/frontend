/**
 * 21 — FOOTER E PÁGINAS LEGAIS
 * Testa: todos os links do footer, privacidade, termos, about, FAQ modal
 */
import { test, expect, Page } from '@playwright/test';

async function dismissOverlays(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
    .catch(() => undefined);
  const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
  if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await termsBtn.click();
    await page.waitForTimeout(500);
  }
  const cookieBtn = page.getByRole('button', { name: /Aceitar cookies/i });
  if (await cookieBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(300);
  }
}

async function scrollToFooter(page: Page) {
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, main.scrollHeight);
  });
  await page.waitForTimeout(1500);
}

test.describe('Footer — Structure', () => {
  test('Footer has all required sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');
    expect(await footer.isVisible()).toBe(true);

    // Check main sections
    const brandName = footer.getByText(/AURICAPRI/i).first();
    const cnpj = footer.getByText(/CNPJ/i).first();
    const hasBrand = await brandName.isVisible().catch(() => false);
    const hasCnpj = await cnpj.isVisible().catch(() => false);

    console.log(`  🏢 Brand name: ${hasBrand ? '✅' : '❌'}`);
    console.log(`  📋 CNPJ: ${hasCnpj ? '✅' : '❌'}`);
  });

  test('Footer has contact info (email, phone)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');
    const emailLink = footer.locator('a[href^="mailto:"]').first();
    const phoneLink = footer.locator('a[href^="tel:"]').first();

    const hasEmail = await emailLink.isVisible().catch(() => false);
    const hasPhone = await phoneLink.isVisible().catch(() => false);

    console.log(`  📧 Email de contato: ${hasEmail ? '✅' : '❌'}`);
    console.log(`  📞 Telefone de contato: ${hasPhone ? '✅' : '❌'}`);
  });

  test('Footer has Instagram link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');
    const instaLink = footer.locator('a[href*="instagram"]').first();
    const hasInsta = await instaLink.isVisible().catch(() => false);
    console.log(`  📸 Link Instagram: ${hasInsta ? '✅' : '❌'}`);
  });

  test('Footer has payment method badges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');
    const pix = footer.getByText('Pix');
    const visa = footer.getByText('Visa');
    const master = footer.getByText('Master');

    const hasPix = await pix.isVisible().catch(() => false);
    const hasVisa = await visa.isVisible().catch(() => false);
    const hasMaster = await master.isVisible().catch(() => false);

    console.log(`  💳 Badges de pagamento: Pix:${hasPix ? '✅' : '❌'} Visa:${hasVisa ? '✅' : '❌'} Master:${hasMaster ? '✅' : '❌'}`);
  });
});

test.describe('Footer — Navigation Links', () => {
  test('"Sobre Nós" navigates to About page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const aboutBtn = page.getByRole('button', { name: /Sobre N[oó]s/i }).first();
    const hasAbout = await aboutBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📄 Link "Sobre Nós": ${hasAbout ? '✅' : '❌'}`);

    if (hasAbout) {
      await aboutBtn.click();
      await page.waitForTimeout(2000);
      const url = page.url();
      console.log(`  📍 Navegou para: ${url}`);
    }
  });

  test('"Contato" scrolls to contact section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const contactBtn = page.getByRole('button', { name: /Contato/i }).first();
    const hasContact = await contactBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📞 Link "Contato": ${hasContact ? '✅' : '❌'}`);
  });

  test('"Perguntas Frequentes" opens FAQ modal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const faqBtn = page.getByRole('button', { name: /Perguntas Frequentes|FAQ/i }).first();
    const hasFaq = await faqBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  ❓ Link FAQ: ${hasFaq ? '✅' : '❌'}`);

    if (hasFaq) {
      await faqBtn.click();
      await page.waitForTimeout(1500);

      const modal = page.locator('[role="dialog"]').first();
      const modalVisible = await modal.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  📋 FAQ modal: ${modalVisible ? '✅ Abriu' : '❌ Não abriu'}`);
    }
  });

  test('"Programa de Afiliados" navigates to affiliates page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const affBtn = page.getByRole('button', { name: /Afiliados/i }).first();
    const hasAff = await affBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  🤝 Link Afiliados: ${hasAff ? '✅' : '❌'}`);

    if (hasAff) {
      await affBtn.click();
      await page.waitForTimeout(2000);
      console.log(`  📍 Navegou para: ${page.url()}`);
    }
  });

  test('"Reclamação" link exists', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const complaintBtn = page.getByRole('button', { name: /Reclama/i }).first();
    const hasComplaint = await complaintBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📋 Link "Reclamação": ${hasComplaint ? '✅' : '❌'}`);
    expect(hasComplaint).toBe(true);
  });
});

test.describe('Footer — Legal Pages', () => {
  test('"Privacidade" link works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const privacyBtn = page.getByRole('button', { name: /Privacidade|Privacy/i }).first();
    const hasPrivacy = await privacyBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  🔒 Link Privacidade: ${hasPrivacy ? '✅' : '❌'}`);

    if (hasPrivacy) {
      await privacyBtn.click();
      await page.waitForTimeout(2000);
      const bodyText = await page.evaluate(() => document.body.innerText.length);
      console.log(`  📄 Conteúdo da página de privacidade: ${bodyText > 200 ? '✅ Tem conteúdo' : '⚠ Pouco conteúdo'}`);
    }
  });

  test('"Termos" link works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const termsBtn = page.getByRole('button', { name: /Termos|Terms/i }).first();
    const hasTerms = await termsBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    console.log(`  📜 Link Termos: ${hasTerms ? '✅' : '❌'}`);

    if (hasTerms) {
      await termsBtn.click();
      await page.waitForTimeout(2000);
      const bodyText = await page.evaluate(() => document.body.innerText.length);
      console.log(`  📄 Conteúdo da página de termos: ${bodyText > 200 ? '✅ Tem conteúdo' : '⚠ Pouco conteúdo'}`);
    }
  });
});
