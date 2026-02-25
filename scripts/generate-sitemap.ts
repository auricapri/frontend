import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL - adjust for production
const BASE_URL = process.env.VITE_FRONTEND_URL || 'https://www.auricapri.com.br';
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
  is_active?: boolean;
}

interface Collection {
  id: string;
  slug?: LocalizedText | string | null;
  updated_at?: string;
  name?: LocalizedText | string;
  deleted_at?: string | null;
}

function getLocalizedValue(value: LocalizedText | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  // Prefer Portuguese, fallback to English, then any available language
  return value.pt || value.en || value.es || value.fr || '';
}

async function fetchAllPaginated<T>(endpoint: string, pageSize = 100): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const url = `${API_URL}${endpoint}?limit=${pageSize}&offset=${offset}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (error) {
      if (offset === 0) {
        console.warn(`Failed to fetch ${endpoint} (page 0), returning empty array:`, error);
        return [];
      }
      console.warn(`Fetch error at ${url}, stopping pagination:`, error);
      break;
    }
    if (!res.ok) {
      if (offset === 0) {
        console.warn(`API returned ${res.status} for ${endpoint} (page 0), returning empty array`);
        return [];
      }
      console.warn(`API returned ${res.status} at ${url}, stopping pagination`);
      break;
    }
    let data: unknown;
    try {
      data = await res.json();
    } catch (error) {
      console.warn(`Failed to parse JSON from ${url}:`, error);
      break;
    }
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) break;
    all.push(...(items as T[]));
    if (items.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

async function fetchProducts(): Promise<Product[]> {
  const products = await fetchAllPaginated<Product>('/products');
  return products.filter(p => p && p.is_active === true);
}

async function fetchCollections(): Promise<Collection[]> {
  const collections = await fetchAllPaginated<Collection>('/collections');
  return collections.filter(c => c && c.deleted_at == null);
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
  console.log('Generating sitemap...');
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

  console.log(`Added ${staticUrls.length} static routes`);

  // Fetch and add product URLs (paginated, active only)
  const products = await fetchProducts();
  const productUrls: SitemapUrl[] = products
    .filter(p => p && (p.slug || p.id))
    .map(p => {
      const slugValue = getLocalizedValue(p.slug);
      const identifier = slugValue || p.id;

      return {
        loc: `${BASE_URL}/product/${identifier}`,
        priority: 0.7,
        changefreq: 'weekly' as const,
        lastmod: formatDate(p.updated_at),
      };
    });

  console.log(`Added ${productUrls.length} product URLs`);

  // Fetch and add collection URLs (paginated, not deleted)
  const collections = await fetchCollections();
  const collectionUrls: SitemapUrl[] = collections
    .filter(c => c && (c.slug || c.id))
    .map(c => {
      const slugValue = getLocalizedValue(c.slug);
      const identifier = slugValue || c.id;

      return {
        loc: `${BASE_URL}/collection/${identifier}`,
        priority: 0.8,
        changefreq: 'weekly' as const,
        lastmod: formatDate(c.updated_at),
      };
    });

  console.log(`Added ${collectionUrls.length} collection URLs`);

  // Combine all URLs
  const allUrls = [...staticUrls, ...productUrls, ...collectionUrls];
  console.log(`Total URLs: ${allUrls.length}`);

  // Generate XML
  const xml = generateSitemapXML(allUrls);

  // Write to public directory
  const publicPath = join(__dirname, '../public/sitemap.xml');
  writeFileSync(publicPath, xml, 'utf-8');

  console.log('Sitemap generated successfully!');
  console.log(`   Output: ${publicPath}`);
  console.log(`   Submit to: https://search.google.com/search-console`);
}

// Run the generator
// NOTE: Exits gracefully (code 0) on failure so it doesn't block the build.
// The existing static sitemap.xml in /public serves as fallback.
generateSitemap().catch((error) => {
  console.error('Sitemap generation failed (non-blocking):', error);
  console.log('The existing sitemap.xml (if any) will be used as fallback.');
  process.exit(0);
});
