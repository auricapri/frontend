/**
 * 09 — Visual e Acessibilidade
 */
import { test, expect } from '@playwright/test';

test.describe('Visual — Verificações', () => {
  test('Fontes carregam corretamente (sem FOUT/FOIT prolongado)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    // Verificar se fonts estão loaded
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.ready.then(() => document.fonts.status);
    });
    console.log(`  🔤 Fonts status: ${fontsLoaded}`);
    expect(fontsLoaded).toBe('loaded');
  });

  test('Não tem elementos com overflow visível quebrado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    await page.waitForTimeout(2000);

    // Verificar elementos visíveis que estão fora da viewport
    const overflowIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const elements = document.querySelectorAll('*');

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        ) {
          if (rect.right > viewport.width + 50 && style.overflow !== 'hidden' && style.overflow !== 'auto') {
            const tag = el.tagName.toLowerCase();
            const cls = el.className?.toString().substring(0, 50) || '';
            issues.push(`${tag}.${cls} overflows right by ${Math.round(rect.right - viewport.width)}px`);
          }
        }
      });
      return issues.slice(0, 10);
    });

    if (overflowIssues.length > 0) {
      console.warn('  ⚠ Overflow issues:', overflowIssues);
    } else {
      console.log('  ✅ Sem overflow visível');
    }
  });

  test('Cores e contraste — textos legíveis', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    // Verificar que textos principais não são transparentes/invisíveis
    const textVisibility = await page.evaluate(() => {
      const issues: string[] = [];
      const textElements = document.querySelectorAll('h1, h2, h3, p, span, a, button');

      textElements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 200) {
          if (style.opacity === '0' || style.color === 'transparent' || style.color === 'rgba(0, 0, 0, 0)') {
            issues.push(`"${text.substring(0, 30)}" has invisible text`);
          }
          // Check for very small text
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 10 && style.display !== 'none') {
            issues.push(`"${text.substring(0, 30)}" has very small font (${fontSize}px)`);
          }
        }
      });
      return issues.slice(0, 10);
    });

    if (textVisibility.length > 0) {
      console.warn('  ⚠ Visibility issues:', textVisibility);
    } else {
      console.log('  ✅ Textos visíveis e legíveis');
    }
  });

  test('Imagens tem alt text (acessibilidade)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    const imageStats = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      let total = 0;
      let withAlt = 0;
      let withoutAlt = 0;
      const missingAlt: string[] = [];

      images.forEach((img) => {
        if (img.offsetWidth > 0 && img.offsetHeight > 0) {
          total++;
          if (img.alt && img.alt.trim().length > 0) {
            withAlt++;
          } else {
            withoutAlt++;
            missingAlt.push(img.src.substring(0, 80));
          }
        }
      });

      return { total, withAlt, withoutAlt, missingAlt: missingAlt.slice(0, 5) };
    });

    console.log(`  🖼 Imagens: ${imageStats.total} total, ${imageStats.withAlt} com alt, ${imageStats.withoutAlt} sem alt`);
    if (imageStats.missingAlt.length > 0) {
      console.warn('  ⚠ Imagens sem alt:', imageStats.missingAlt);
    }
  });

  test('Botões e links são clicáveis (não estão cobertos)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    await page.waitForTimeout(2000);

    // Verificar que botões principais não estão cobertos por overlays
    const clickabilityIssues = await page.evaluate(() => {
      const issues: string[] = [];
      const buttons = document.querySelectorAll('button, a[href]');

      buttons.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const topElement = document.elementFromPoint(centerX, centerY);

          if (topElement && !btn.contains(topElement) && topElement !== btn) {
            const btnText = (btn.textContent || '').trim().substring(0, 30);
            const blockingTag = topElement.tagName.toLowerCase();
            if (btnText.length > 0 && blockingTag !== 'svg' && blockingTag !== 'path') {
              issues.push(`"${btnText}" coberto por <${blockingTag}>`);
            }
          }
        }
      });
      return issues.slice(0, 10);
    });

    if (clickabilityIssues.length > 0) {
      console.warn('  ⚠ Botões cobertos:', clickabilityIssues);
    } else {
      console.log('  ✅ Botões acessíveis');
    }
  });

  test('Z-index e overlays — sem camadas inesperadas', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page
      .waitForFunction(() => document.body.classList.contains('loaded'), null, { timeout: 30_000 })
      .catch(() => undefined);

    const termsBtn = page.getByRole('button', { name: 'Aceitar e Continuar' });
    if (await termsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await termsBtn.click();
    }

    await page.waitForTimeout(2000);

    const highZIndex = await page.evaluate(() => {
      const elements: { tag: string; class: string; zIndex: string }[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (zIndex > 50 && style.display !== 'none' && style.visibility !== 'hidden') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            elements.push({
              tag: el.tagName.toLowerCase(),
              class: el.className?.toString().substring(0, 50) || '',
              zIndex: style.zIndex,
            });
          }
        }
      });
      return elements.slice(0, 10);
    });

    console.log('  📐 Elementos com z-index alto (>50):');
    highZIndex.forEach(({ tag, class: cls, zIndex }) => {
      console.log(`    z-${zIndex}: <${tag}> .${cls}`);
    });
  });
});
