import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function readBackendEnv() {
  const envPath = path.resolve(process.cwd(), '..', 'backend', '.env');
  const raw = await fs.readFile(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const kv: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    kv[k] = v;
  }

  return {
    supabaseUrl: kv.SUPABASE_URL,
    serviceRoleKey: kv.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export async function ensureAtLeastOneProductWithStock(opts: { minStock?: number } = {}) {
  const minStock = opts.minStock ?? 10;
  const { supabaseUrl, serviceRoleKey } = await readBackendEnv();

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existingVariant, error: existingVariantError } = await admin
    .from('product_variants')
    .select('id, product_id, stock_quantity')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .limit(1)
    .maybeSingle();

  if (existingVariantError) throw existingVariantError;
  if (existingVariant) return existingVariant;

  const { data: existingCategory, error: categoryError } = await admin
    .from('categories')
    .select('id')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (categoryError) throw categoryError;

  let categoryId = existingCategory?.id as string | undefined;
  if (!categoryId) {
    const { data: createdCategory, error: createCategoryError } = await admin
      .from('categories')
      .insert({
        name: { pt: 'E2E' },
        slug: `e2e-${Date.now()}`,
        is_active: true,
      })
      .select('id')
      .single();

    if (createCategoryError) throw createCategoryError;
    categoryId = createdCategory.id;
  }

  const stamp = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const slug = `e2e-${stamp}`;
  const image = 'https://images.unsplash.com/photo-1520975869018-bb914bf57972?auto=format&fit=crop&w=1200&q=80';

  const { data: createdProduct, error: createProductError } = await admin
    .from('products')
    .insert({
      category_id: categoryId,
      name: { pt: `Produto E2E ${stamp}` },
      description: { pt: 'Produto criado automaticamente para testes E2E.' },
      slug: { pt: slug },
      is_active: true,
      is_highlight: false,
      base_images: [image],
      default_image_url: image,
    })
    .select('id')
    .single();

  if (createProductError) throw createProductError;

  const { data: createdVariant, error: createVariantError } = await admin
    .from('product_variants')
    .insert({
      product_id: createdProduct.id,
      sku: `E2E-${stamp}`,
      size: 'U',
      color_name: { pt: 'Preto' },
      color_hex: '#000000',
      retail_price: 199.9,
      wholesale_price: 149.9,
      stock_quantity: minStock,
      variant_images: [image],
      is_active: true,
    })
    .select('id, product_id, stock_quantity')
    .single();

  if (createVariantError) throw createVariantError;
  return createdVariant;
}

