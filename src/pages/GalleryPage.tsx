import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ShoppingBag } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { type Product, type CartItem, type ProductVariant } from '../types';
import { type Locale } from '../i18n';
import { createGetLoc } from '../utils/localization';

interface GalleryRow {
  id: string;
  image_url: string;
  title: string | null;
  location_label: string | null;
  sort_order: number;
  product_id: string | null;
  variant_id: string | null;
}

interface GalleryProduct {
  id: string;
  name: Record<string, string>;
  slug: Record<string, string> | string;
}

interface GalleryItem extends GalleryRow {
  variant?: Pick<ProductVariant, 'id' | 'color_name' | 'color_hex' | 'retail_price' | 'stock_quantity' | 'sku'>;
  product?: GalleryProduct;
}

interface GalleryPageProps {
  onNavigate: (view: string, target?: string, product?: Product) => void;
  onAddToCart: (item: CartItem) => void;
  locale: Locale;
}

async function fetchGallery(): Promise<GalleryItem[]> {
  const { data: rawRows, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, title, location_label, sort_order, product_id, variant_id')
    .eq('is_active', true)
    .order('sort_order');

  if (error || !rawRows?.length) return [];

  const rows = rawRows as GalleryRow[];

  const variantIds = rows.map(r => r.variant_id).filter((id): id is string => id !== null);
  const productIds = rows.map(r => r.product_id).filter((id): id is string => id !== null);

  const [{ data: variants }, { data: products }] = await Promise.all([
    supabase
      .from('product_variants')
      .select('id, color_name, color_hex, retail_price, stock_quantity, sku')
      .in('id', [...new Set(variantIds)]),
    supabase
      .from('products')
      .select('id, name, slug')
      .in('id', [...new Set(productIds)]),
  ]);

  type VariantRow = { id: string; color_name: Record<string, string>; color_hex: string; retail_price: number; stock_quantity: number; sku: string };
  type ProductRow = { id: string; name: Record<string, string>; slug: Record<string, string> | string };

  const variantMap = new Map((variants ?? []).map((v: VariantRow) => [v.id, v]));
  const productMap = new Map((products ?? []).map((p: ProductRow) => [p.id, p]));

  return rows.map((r: GalleryRow): GalleryItem => ({
    ...r,
    variant: r.variant_id ? (variantMap.get(r.variant_id) as GalleryItem['variant']) : undefined,
    product: r.product_id ? (productMap.get(r.product_id) as GalleryProduct) : undefined,
  }));
}

export function GalleryPage({ onNavigate, onAddToCart, locale }: GalleryPageProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const getLoc = createGetLoc(locale);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: fetchGallery,
    staleTime: 5 * 60 * 1000,
  });

  const formatPrice = (price: number) =>
    price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddToCart = useCallback((img: GalleryItem) => {
    if (!img.variant || !img.product || img.variant.stock_quantity < 1) return;
    setAddingId(img.id);
    onAddToCart({
      variant_id: img.variant.id,
      product_id: img.product.id,
      name: img.product.name as CartItem['name'],
      image: img.image_url,
      size: 'Tamanho único',
      color_name: img.variant.color_name as CartItem['color_name'],
      color_hex: img.variant.color_hex ?? '',
      price: img.variant.retail_price,
      quantity: 1,
      sku: img.variant.sku,
    });
    setTimeout(() => setAddingId(null), 1200);
  }, [onAddToCart]);

  const handleNavigateToProduct = useCallback((img: GalleryItem) => {
    if (!img.product) return;
    const slug = getLoc(img.product.slug) || img.product.id;
    window.history.pushState({ view: 'product' }, '', `/product/${slug}`);
    onNavigate('product', slug);
  }, [getLoc, onNavigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-40 px-4 md:px-12">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-3 md:mb-4 animate-pulse bg-neutral-100 rounded-2xl aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-36 md:pt-44 pb-8 md:pb-12 px-4 md:px-12 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-400 mb-3">Auricapri</p>
        <h1 className="text-3xl md:text-5xl font-light tracking-[0.15em] uppercase mb-4">Galeria</h1>
        <p className="text-sm text-neutral-500 font-light max-w-md mx-auto leading-relaxed">
          Looks reais, momentos brasileiros. Toque em qualquer peça para comprar.
        </p>
        <div className="mt-6 w-8 h-px bg-neutral-200 mx-auto" />
      </div>

      <div className="px-3 md:px-12 pb-20">
        <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-4">
          {images.map((img) => (
            <GalleryCard
              key={img.id}
              img={img}
              isHovered={hoveredId === img.id}
              isAdding={addingId === img.id}
              getLoc={getLoc}
              formatPrice={formatPrice}
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => setHoveredId(null)}
              onNavigate={() => handleNavigateToProduct(img)}
              onAddToCart={() => handleAddToCart(img)}
            />
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-sm">Em breve — nossa galeria está sendo preparada.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GalleryCardProps {
  img: GalleryItem;
  isHovered: boolean;
  isAdding: boolean;
  getLoc: (obj: unknown) => string;
  formatPrice: (price: number) => string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: () => void;
  onAddToCart: () => void;
}

function GalleryCard({
  img, isHovered, isAdding, getLoc, formatPrice,
  onMouseEnter, onMouseLeave, onNavigate, onAddToCart,
}: GalleryCardProps) {
  const outOfStock = !img.variant || img.variant.stock_quantity < 1;
  const hasProduct = !!img.product;

  return (
    <div
      className="break-inside-avoid mb-2 md:mb-3 group cursor-pointer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image — Pinterest style: natural height, rounded, no dark overlay */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100" onClick={onNavigate}>
        <img
          src={img.image_url}
          alt={img.title ?? 'Galeria Auricapri'}
          loading="lazy"
          className="w-full h-auto object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-[1.03]"
        />

        {/* Location pill — top left */}
        {img.location_label && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <MapPin className="w-2 h-2 text-neutral-400" strokeWidth={2} />
            <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-600">
              {img.location_label}
            </span>
          </div>
        )}

        {/* Add to cart button — top right, appears on hover like Pinterest save button */}
        {hasProduct && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            disabled={outOfStock}
            className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg transition-all duration-200
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
              ${isAdding ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-neutral-800'}
              ${outOfStock ? 'bg-neutral-400 cursor-not-allowed' : ''}
            `}
          >
            <ShoppingBag className="w-3 h-3" strokeWidth={2.5} />
            {isAdding ? 'Adicionado!' : outOfStock ? 'Esgotado' : 'Comprar'}
          </button>
        )}
      </div>

      {/* Info below image — Pinterest puts info below, not overlaid */}
      {(hasProduct || img.title) && (
        <div className="px-1 pt-2 pb-1">
          {img.product && (
            <p
              onClick={onNavigate}
              className="text-[11px] md:text-[12px] font-semibold text-neutral-900 leading-snug truncate hover:underline"
            >
              {getLoc(img.product.name)}
            </p>
          )}
          {!img.product && img.title && (
            <p className="text-[11px] md:text-[12px] font-semibold text-neutral-900 leading-snug truncate">
              {img.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {img.variant?.color_hex && (
              <div
                className="w-2.5 h-2.5 rounded-full border border-neutral-200 flex-shrink-0"
                style={{ backgroundColor: img.variant.color_hex }}
              />
            )}
            {img.variant?.retail_price ? (
              <span className="text-[11px] font-bold text-neutral-700">
                {formatPrice(img.variant.retail_price)}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
