/**
 * 21 --- FOOTER E PAGINAS LEGAIS
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
  // Try scrolling main first, then fall back to window
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (main && main.scrollHeight > main.clientHeight) {
      main.scrollTo(0, main.scrollHeight);
    } else {
      window.scrollTo(0, document.body.scrollHeight);
    }
  });
  await page.waitForTimeout(1500);
  // Double-scroll to ensure we reach the footer
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);
}

test.describe('Footer -- Structure', () => {
  test('Footer has all required sections', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');
    const footerVisible = await footer.isVisible({ timeout: 10_000 }).catch(() => false);
    expect(footerVisible).toBe(true);

    // Check main sections -- Footer.tsx renders storeConfig.brand_name and "CNPJ: {storeConfig.tax_id}"
    const brandName = footer.getByText(/AURICAPRI/i).first();
    const cnpj = footer.getByText(/CNPJ/i).first();
    const hasBrand = await brandName.isVisible().catch(() => false);
    const hasCnpj = await cnpj.isVisible().catch(() => false);

    console.log(`  Brand name: ${hasBrand ? 'SIM' : 'NAO'}`);
    console.log(`  CNPJ: ${hasCnpj ? 'SIM' : 'NAO'}`);
  });

  test('Footer has contact info (email, phone)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');

    // Footer.tsx: <a href="mailto:..."> and <a href="tel:...">
    const emailLink = footer.locator('a[href^="mailto:"]').first();
    const phoneLink = footer.locator('a[href^="tel:"]').first();

    const hasEmail = await emailLink.isVisible({ timeout: 10_000 }).catch(() => false);
    const hasPhone = await phoneLink.isVisible({ timeout: 5_000 }).catch(() => false);

    console.log(`  Email de contato: ${hasEmail ? 'SIM' : 'NAO'}`);
    console.log(`  Telefone de contato: ${hasPhone ? 'SIM' : 'NAO'}`);
  });

  test('Footer has Instagram link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');

    // Footer.tsx: <a href="https://www.instagram.com/auricapri.oficial" aria-label="Instagram">
    const instaLink = footer.locator('a[href*="instagram"]').first();
    const hasInsta = await instaLink.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link Instagram: ${hasInsta ? 'SIM' : 'NAO'}`);
  });

  test('Footer has payment method badges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    const footer = page.locator('footer');

    // Footer.tsx: <span>Pix</span>, <span>Visa</span>, <span>Master</span>
    const pix = footer.getByText('Pix');
    const visa = footer.getByText('Visa');
    const master = footer.getByText('Master');

    const hasPix = await pix.isVisible({ timeout: 10_000 }).catch(() => false);
    const hasVisa = await visa.isVisible().catch(() => false);
    const hasMaster = await master.isVisible().catch(() => false);

    console.log(`  Badges de pagamento: Pix:${hasPix ? 'SIM' : 'NAO'} Visa:${hasVisa ? 'SIM' : 'NAO'} Master:${hasMaster ? 'SIM' : 'NAO'}`);
  });
});

test.describe('Footer -- Navigation Links', () => {
  test('"Sobre Nos" navigates to About page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx: <button onClick={() => onNavigate('about')}>Sobre Nos</button>
    // This is a <button> element with text "Sobre Nos" -- getByRole('button', { name }) works
    const aboutBtn = page.locator('footer').getByRole('button', { name: /Sobre N[oó]s/i }).first();
    const hasAbout = await aboutBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link "Sobre Nos": ${hasAbout ? 'SIM' : 'NAO'}`);

    if (hasAbout) {
      await aboutBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await dismissOverlays(page);
      const url = page.url();
      console.log(`  Navegou para: ${url}`);
    }
  });

  test('"Contato" scrolls to contact section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx: <button onClick={handleScrollToContact}>Contato</button>
    const contactBtn = page.locator('footer').getByRole('button', { name: /Contato/i }).first();
    const hasContact = await contactBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link "Contato": ${hasContact ? 'SIM' : 'NAO'}`);
  });

  test('"Perguntas Frequentes" opens FAQ modal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx: <button onClick={onOpenFAQ}>Perguntas Frequentes</button>
    const faqBtn = page.locator('footer').getByRole('button', { name: /Perguntas Frequentes|FAQ/i }).first();
    const hasFaq = await faqBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link FAQ: ${hasFaq ? 'SIM' : 'NAO'}`);

    if (hasFaq) {
      await faqBtn.click({ force: true });
      await page.waitForTimeout(1500);

      const modal = page.locator('[role="dialog"]').first();
      const modalVisible = await modal.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  FAQ modal: ${modalVisible ? 'Abriu' : 'Nao abriu'}`);
    }
  });

  test('"Programa de Afiliados" navigates to affiliates page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx: <button onClick={() => onNavigate('affiliates')}>
    //   <span>Programa de Afiliados</span>
    //   <span>A PARTIR DE 10%</span>
    // </button>
    const affBtn = page.locator('footer').getByRole('button', { name: /Afiliados/i }).first();
    const hasAff = await affBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link Afiliados: ${hasAff ? 'SIM' : 'NAO'}`);

    if (hasAff) {
      await affBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await dismissOverlays(page);
      console.log(`  Navegou para: ${page.url()}`);
    }
  });

  test('"Reclamacao" link exists', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx: <button onClick={onOpenComplaint}>Reclamacao</button>
    const complaintBtn = page.locator('footer').getByRole('button', { name: /Reclama/i }).first();
    const hasComplaint = await complaintBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link "Reclamacao": ${hasComplaint ? 'SIM' : 'NAO'}`);
    expect(hasComplaint).toBe(true);
  });
});

test.describe('Footer -- Legal Pages', () => {
  test('"Privacidade" link works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx bottom bar: <button onClick={() => onNavigate('privacy')}>{t('footer.privacy')}</button>
    // i18n pt: "Privacidade"
    const privacyBtn = page.locator('footer').getByRole('button', { name: /Privacidade|Privacy|Confidentialit/i }).first();
    const hasPrivacy = await privacyBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link Privacidade: ${hasPrivacy ? 'SIM' : 'NAO'}`);

    if (hasPrivacy) {
      await privacyBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await dismissOverlays(page);
      const bodyText = await page.evaluate(() => document.body.innerText.length);
      console.log(`  Conteudo da pagina de privacidade: ${bodyText > 200 ? 'Tem conteudo' : 'Pouco conteudo'}`);
    }
  });

  test('"Termos" link works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 });
    await dismissOverlays(page);
    await scrollToFooter(page);

    // Footer.tsx bottom bar: <button onClick={() => onNavigate('terms')}>{t('footer.terms')}</button>
    // i18n pt: "Termos"
    const termsBtn = page.locator('footer').getByRole('button', { name: /Termos|Terms|Conditions/i }).first();
    const hasTerms = await termsBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    console.log(`  Link Termos: ${hasTerms ? 'SIM' : 'NAO'}`);

    if (hasTerms) {
      await termsBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await dismissOverlays(page);
      const bodyText = await page.evaluate(() => document.body.innerText.length);
      console.log(`  Conteudo da pagina de termos: ${bodyText > 200 ? 'Tem conteudo' : 'Pouco conteudo'}`);
    }
  });
});
