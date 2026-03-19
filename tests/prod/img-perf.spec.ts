/**
 * Análise de performance de imagens em produção
 * Mede tamanhos reais, formatos e identifica imagens pesadas
 */
import { test } from '@playwright/test';

test.setTimeout(120_000);

test('analisar performance de imagens — homepage + produto', async ({ page }) => {
  const imgStats: Array<{ url: string; sizeKB: number; ct: string; width?: string }> = [];

  page.on('response', async (response) => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    const isImg = ct.includes('image') || url.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i);
    if (!isImg || url.startsWith('data:') || url.includes('.svg')) return;

    try {
      const body = await response.body().catch(() => null);
      if (!body) return;
      const sizeKB = Math.round(body.length / 1024);
      const short = url
        .replace(/https:\/\/zbrunudbdyuebtpxfnkd\.supabase\.co\/storage\/v1\/object\/public/, '[storage]')
        .replace('https://www.auricapri.com.br', '');

      // Extract width param from URL if present
      const widthMatch = url.match(/[?&]width=(\d+)/);
      const width = widthMatch ? widthMatch[1] + 'px' : '';

      imgStats.push({ url: short, sizeKB, ct: ct.split(';')[0], width });
    } catch {}
  });

  // === HOMEPAGE ===
  console.log('\n📄 Carregando homepage...');
  await page.goto('https://www.auricapri.com.br', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Scroll to trigger lazy images
  for (let y = 800; y <= 6000; y += 800) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(2000);

  const homepageCount = imgStats.length;
  const homepageKB = imgStats.reduce((s, i) => s + i.sizeKB, 0);
  console.log(`Homepage: ${homepageCount} imgs, ${Math.round(homepageKB)}KB total`);

  // === PRODUCT PAGE ===
  console.log('\n📄 Carregando página de produto...');
  const productLink = page.locator('a[href*="/product/"]').first();
  const productHref = await productLink.getAttribute('href').catch(() => null);

  if (productHref) {
    const beforeProduct = imgStats.length;
    await page.goto(`https://www.auricapri.com.br${productHref}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const productImgs = imgStats.slice(beforeProduct);
    const productKB = productImgs.reduce((s, i) => s + i.sizeKB, 0);
    console.log(`Produto (${productHref}): ${productImgs.length} imgs, ${Math.round(productKB)}KB total`);
  }

  // === REPORT ===
  const sorted = [...imgStats].sort((a, b) => b.sizeKB - a.sizeKB);
  const totalKB = sorted.reduce((s, i) => s + i.sizeKB, 0);
  const over300 = sorted.filter(i => i.sizeKB > 300);
  const over150 = sorted.filter(i => i.sizeKB > 150);
  const over100 = sorted.filter(i => i.sizeKB > 100);

  console.log('\n═══════════════════════════════════════════════');
  console.log('         RELATÓRIO DE PERFORMANCE DE IMAGENS    ');
  console.log('═══════════════════════════════════════════════');
  console.log(`Total: ${sorted.length} imgs | ${Math.round(totalKB)}KB (${(totalKB/1024).toFixed(1)}MB)`);
  console.log(`🔴🔴 >300KB: ${over300.length}`);
  console.log(`🔴  >150KB: ${over150.length}`);
  console.log(`🟡  >100KB: ${over100.length}`);
  console.log(`✅  ≤100KB: ${sorted.filter(i=>i.sizeKB<=100).length}`);

  console.log('\n--- TOP 30 IMAGENS ---');
  sorted.slice(0, 30).forEach(img => {
    const flag = img.sizeKB > 300 ? '🔴🔴' : img.sizeKB > 150 ? '🔴' : img.sizeKB > 100 ? '🟡' : '✅';
    const wStr = img.width ? ` [w=${img.width}]` : '';
    console.log(`${flag} ${String(img.sizeKB).padStart(4)}KB${wStr} ${img.ct.padEnd(10)} ${img.url.substring(0, 100)}`);
  });

  const byFormat: Record<string, { count: number; totalKB: number; avgKB: number }> = {};
  sorted.forEach(i => {
    const fmt = i.ct.includes('webp') ? 'webp' : i.ct.includes('jpeg') ? 'jpeg/jpg' : i.ct.includes('png') ? 'png' : i.ct.includes('gif') ? 'gif' : 'other';
    if (!byFormat[fmt]) byFormat[fmt] = { count: 0, totalKB: 0, avgKB: 0 };
    byFormat[fmt].count++;
    byFormat[fmt].totalKB += i.sizeKB;
  });
  Object.values(byFormat).forEach(d => { d.avgKB = Math.round(d.totalKB / d.count); });

  console.log('\n--- POR FORMATO ---');
  Object.entries(byFormat).sort((a,b) => b[1].totalKB - a[1].totalKB).forEach(([fmt, d]) => {
    console.log(`  ${fmt.padEnd(8)}: ${d.count} imgs | total ${Math.round(d.totalKB)}KB | avg ${d.avgKB}KB`);
  });

  // Identify problematic patterns
  const notWebp = sorted.filter(i => !i.ct.includes('webp') && i.sizeKB > 20);
  if (notWebp.length > 0) {
    console.log(`\n⚠️  ${notWebp.length} imagens NÃO são WebP (potencial melhoria):`);
    notWebp.slice(0, 10).forEach(i => console.log(`     ${i.sizeKB}KB [${i.ct}] ${i.url.substring(0, 80)}`));
  }

  // Imagens sem transform (não passam pelo Supabase image transform)
  const noTransform = sorted.filter(i => i.url.includes('[storage]') && !i.url.includes('width=') && i.sizeKB > 50);
  if (noTransform.length > 0) {
    console.log(`\n⚠️  ${noTransform.length} imagens do storage SEM resize/transform:`);
    noTransform.slice(0, 10).forEach(i => console.log(`     ${i.sizeKB}KB ${i.url.substring(0, 100)}`));
  }

  console.log('═══════════════════════════════════════════════\n');
});
