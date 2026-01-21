import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL - adjust for production
const BASE_URL = process.env.VITE_FRONTEND_URL || 'https://auricapri.com.br';
const API_URL = process.env.VITE_API_URL || 'https://api.auricapri.com.br/api';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

interface LocalizedText {
  en?: string;
  pt?: string;
  es?: string;
  fr?: string;
}

interface Product {
  id: string;
  slug?: LocalizedText | string | null;
  updated_at?: string;
  name?: LocalizedText | string;
}

interface Collection {
  id: string;
  slug?: LocalizedText | string | null;
  updated_at?: string;
  name?: LocalizedText | string;
}

function getLocalizedValue(value: LocalizedText | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  // Prefer Portuguese, fallback to English, then any available language
  return value.pt || value.en || value.es || value.fr || '';
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
      console.warn('Failed to fetch products from API, using empty array');
      return [];
    }
    const data = await response.json();
    // Handle both direct array and wrapped response
    return Array.isArray(data) ? data : (data.data || data.products || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function fetchCollections(): Promise<Collection[]> {
  try {
    const response = await fetch(`${API_URL}/collections`);
    if (!response.ok) {
      console.warn('Failed to fetch collections from API, using empty array');
      return [];
    }
    const data = await response.json();
    // Handle both direct array and wrapped response
    return Array.isArray(data) ? data : (data.data || data.collections || []);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

function formatDate(date?: string): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || formatDate()}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function generateSitemap() {
  console.log('🔍 Generating sitemap...');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   API URL: ${API_URL}`);

  // Static routes
  const staticUrls: SitemapUrl[] = [
    { loc: `${BASE_URL}/`, priority: 1.0, changefreq: 'daily' },
    { loc: `${BASE_URL}/products`, priority: 0.9, changefreq: 'daily' },
    { loc: `${BASE_URL}/collections`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${BASE_URL}/about`, priority: 0.5, changefreq: 'monthly' },
    { loc: `${BASE_URL}/contact`, priority: 0.5, changefreq: 'monthly' },
    { loc: `${BASE_URL}/privacy`, priority: 0.3, changefreq: 'yearly' },
    { loc: `${BASE_URL}/terms`, priority: 0.3, changefreq: 'yearly' },
  ];

  console.log(`✓ Added ${staticUrls.length} static routes`);

  // Fetch and add product URLs
  const products = await fetchProducts();
  const productUrls: SitemapUrl[] = products
    .filter(p => p && (p.slug || p.id)) // Filter out invalid products
    .map(p => {
      // Get localized slug, fallback to ID
      const slugValue = getLocalizedValue(p.slug);
      const identifier = slugValue || p.id;

      return {
        loc: `${BASE_URL}/product/${identifier}`,
        priority: 0.7,
        changefreq: 'weekly' as const,
        lastmod: formatDate(p.updated_at),
      };
    });

  console.log(`✓ Added ${productUrls.length} product URLs`);

  // Fetch and add collection URLs
  const collections = await fetchCollections();
  const collectionUrls: SitemapUrl[] = collections
    .filter(c => c && (c.slug || c.id)) // Filter out invalid collections
    .map(c => {
      // Get localized slug, fallback to ID
      const slugValue = getLocalizedValue(c.slug);
      const identifier = slugValue || c.id;

      return {
        loc: `${BASE_URL}/collection/${identifier}`,
        priority: 0.8,
        changefreq: 'weekly' as const,
        lastmod: formatDate(c.updated_at),
      };
    });

  console.log(`✓ Added ${collectionUrls.length} collection URLs`);

  // Combine all URLs
  const allUrls = [...staticUrls, ...productUrls, ...collectionUrls];
  console.log(`📊 Total URLs: ${allUrls.length}`);

  // Generate XML
  const xml = generateSitemapXML(allUrls);

  // Write to public directory
  const publicPath = join(__dirname, '../public/sitemap.xml');
  writeFileSync(publicPath, xml, 'utf-8');

  console.log('✅ Sitemap generated successfully!');
  console.log(`   Output: ${publicPath}`);
  console.log(`   Submit to: https://search.google.com/search-console`);
}

// Run the generator
generateSitemap().catch((error) => {
  console.error('❌ Sitemap generation failed:', error);
  process.exit(1);
});
