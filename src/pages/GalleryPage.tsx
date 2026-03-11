import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Maximize2, ShoppingBag, ExternalLink, MapPin, Instagram } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { type Product, type CartItem, type ProductVariant } from '../types';
import { type Locale } from '../i18n';
import { createGetLoc } from '../utils/localization';
import { formatCurrency } from '../utils/currency';
import { getOptimizedImageUrl } from '../utils/image';

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
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const getLoc = createGetLoc(locale);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: fetchGallery,
    staleTime: 5 * 60 * 1000,
  });

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.toLowerCase();
    return images.filter(img => {
      const title = img.title?.toLowerCase() ?? '';
      const name = img.product ? getLoc(img.product.name).toLowerCase() : '';
      const loc = img.location_label?.toLowerCase() ?? '';
      return title.includes(q) || name.includes(q) || loc.includes(q);
    });
  }, [images, searchQuery, getLoc]);

  // Animação de entrada do lightbox
  useEffect(() => {
    if (selectedItem) {
      requestAnimationFrame(() => setLightboxVisible(true));
    } else {
      setLightboxVisible(false);
    }
  }, [selectedItem]);

  // Bloqueia scroll quando lightbox está aberto
  useEffect(() => {
    document.body.style.overflow = selectedItem ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedItem]);

  const closeLightbox = useCallback(() => {
    setLightboxVisible(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

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
      <div className="min-h-screen bg-white pt-40 px-4 md:px-8">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4 animate-pulse bg-neutral-100 rounded-2xl aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── AI Studio nav-header ── */}
      <div className="pt-32 md:pt-24 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">

          {/* Esquerda: logo + links */}
          <div className="flex items-center gap-8">
            <span className="font-serif text-2xl md:text-3xl tracking-tight font-medium select-none">
              AURICAPRI
            </span>
            <nav className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-widest font-light">
              <button
                onClick={() => onNavigate('collection')}
                className="hover:opacity-50 transition-opacity"
              >
                Coleções
              </button>
              <span className="font-semibold border-b border-black pb-px">Galeria</span>
              <button
                onClick={() => onNavigate('about')}
                className="hover:opacity-50 transition-opacity"
              >
                Sobre
              </button>
            </nav>
          </div>

          {/* Direita: busca + Instagram */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar inspiração..."
                className="pl-10 pr-4 py-2 bg-black/5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black/20 w-44 lg:w-60 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-black/40 hover:text-black" />
                </button>
              )}
            </div>
            <a
              href="https://www.instagram.com/auricapri"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Auricapri"
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <header className="py-16 md:py-24 px-6 text-center max-w-4xl mx-auto w-full">
        <span className="text-[10px] uppercase tracking-[0.4em] text-black/40 mb-4 block">
          Curadoria de Estilo
        </span>
        <h1 className="font-serif text-5xl md:text-7xl mb-8 leading-tight">
          Nossa Galeria de{' '}
          <em>Inspirações</em>
        </h1>
        <p className="text-black/60 font-light leading-relaxed max-w-2xl mx-auto text-sm md:text-base">
          Explore o universo Auricapri através da nossa curadoria visual.
          Looks reais, momentos brasileiros — toque em qualquer peça para descobrir.
        </p>

        {/* Search mobile (visível só no mobile) */}
        <div className="relative max-w-xs mx-auto mt-8 sm:hidden">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar peças..."
            className="w-full pl-11 pr-10 py-2.5 bg-black/5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black/20 transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-black/40 hover:text-black" />
            </button>
          )}
        </div>
      </header>

      {/* ── Gallery ── */}
      <main className="px-4 md:px-8 pb-24 flex-grow">
        {filteredItems.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-neutral-400 font-light italic text-sm">
              {searchQuery
                ? `Nenhuma peça encontrada para "${searchQuery}".`
                : 'Em breve — nossa galeria está sendo preparada.'}
            </p>
          </div>
        )}

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filteredItems.map((img, i) => (
            <GalleryCard
              key={img.id}
              img={img}
              index={i}
              getLoc={getLoc}
              locale={locale}
              onClick={() => setSelectedItem(img)}
            />
          ))}
        </div>
      </main>

      {/* ── Lightbox ── */}
      {selectedItem && (
        <GalleryLightbox
          img={selectedItem}
          visible={lightboxVisible}
          isAdding={addingId === selectedItem.id}
          getLoc={getLoc}
          locale={locale}
          onClose={closeLightbox}
          onNavigate={() => { closeLightbox(); setTimeout(() => handleNavigateToProduct(selectedItem), 300); }}
          onAddToCart={() => handleAddToCart(selectedItem)}
        />
      )}
    </div>
  );
}

/* ─────────── GalleryCard ─────────── */

interface GalleryCardProps {
  img: GalleryItem;
  index: number;
  getLoc: (obj: unknown) => string;
  locale: Locale;
  onClick: () => void;
}

function GalleryCard({ img, index, getLoc, locale, onClick }: GalleryCardProps) {
  const productName = img.product ? getLoc(img.product.name) : img.title;

  return (
    <div
      className="relative group cursor-pointer break-inside-avoid mb-4"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      <div className="overflow-hidden rounded-2xl bg-neutral-100">
        <img
          src={getOptimizedImageUrl(img.image_url, 'medium')}
          alt={productName ?? 'Auricapri'}
          loading="lazy"
          className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
      </div>

      {/* Location pill */}
      {img.location_label && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm pointer-events-none">
          <MapPin className="w-2 h-2 text-neutral-400" strokeWidth={2} />
          <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-600">
            {img.location_label}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-end p-5 pointer-events-none">
        <div className="translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
          {productName && (
            <h3 className="text-white font-light text-base leading-tight mb-1">{productName}</h3>
          )}
          {img.variant?.retail_price && (
            <p className="text-white/80 text-sm font-semibold mb-3">
              {formatCurrency(img.variant.retail_price, locale)}
            </p>
          )}
          <div className="flex items-center gap-2 text-white/70 text-xs">
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-medium">Ver detalhes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── GalleryLightbox ─────────── */

interface GalleryLightboxProps {
  img: GalleryItem;
  visible: boolean;
  isAdding: boolean;
  getLoc: (obj: unknown) => string;
  locale: Locale;
  onClose: () => void;
  onNavigate: () => void;
  onAddToCart: () => void;
}

function GalleryLightbox({ img, visible, isAdding, getLoc, locale, onClose, onNavigate, onAddToCart }: GalleryLightboxProps) {
  const productName = img.product ? getLoc(img.product.name) : img.title;
  const outOfStock = !img.variant || img.variant.stock_quantity < 1;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-12 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl" />

      <button
        className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
        onClick={onClose}
        aria-label="Fechar"
      >
        <X className="w-7 h-7" />
      </button>

      <div
        className={`relative max-w-5xl w-full grid md:grid-cols-2 gap-8 md:gap-16 items-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-neutral-100">
          <img
            src={getOptimizedImageUrl(img.image_url, 'large')}
            alt={productName ?? 'Auricapri'}
            className="w-full h-auto"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {img.location_label && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-neutral-400" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                {img.location_label}
              </span>
            </div>
          )}

          {productName && (
            <h2 className="text-3xl md:text-5xl font-light tracking-tight leading-[0.95] uppercase">
              {productName}
            </h2>
          )}

          {img.variant?.retail_price && (
            <div>
              <p className="text-2xl font-light">{formatCurrency(img.variant.retail_price, locale)}</p>
              {img.variant.retail_price >= 10 && (
                <p className="text-xs text-neutral-400 mt-1">
                  ou{' '}
                  <span className="font-semibold text-black">
                    6x de {formatCurrency(img.variant.retail_price / 6, locale)}
                  </span>{' '}
                  sem juros
                </p>
              )}
            </div>
          )}

          {img.variant?.color_name && (
            <div className="flex items-center gap-3">
              {img.variant.color_hex && (
                <div
                  className="w-5 h-5 rounded-full border border-neutral-200 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: img.variant.color_hex }}
                />
              )}
              <span className="text-xs uppercase tracking-widest font-bold text-neutral-500">
                {getLoc(img.variant.color_name)}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {img.product && (
              <button
                onClick={onNavigate}
                className="w-full py-4 bg-black text-white rounded-full text-xs font-black uppercase tracking-[0.3em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3"
              >
                <ExternalLink className="w-4 h-4" />
                Ver na Loja
              </button>
            )}
            {img.product && !outOfStock && (
              <button
                onClick={onAddToCart}
                className={`w-full py-4 border rounded-full text-xs font-black uppercase tracking-[0.3em] transition-all duration-200 flex items-center justify-center gap-3 ${
                  isAdding
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-black hover:bg-black hover:text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {isAdding ? 'Adicionado!' : 'Adicionar à Bolsa'}
              </button>
            )}
            {outOfStock && img.product && (
              <p className="text-center text-xs uppercase tracking-widest text-neutral-400 font-bold py-2">
                Esgotado
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
