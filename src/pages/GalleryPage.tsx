import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Maximize2, ShoppingBag, ExternalLink, MapPin, Instagram, Facebook, Mail } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { type Product, type CartItem, type ProductVariant } from '../types';
import { type Locale } from '../i18n';
import { createGetLoc } from '../utils/localization';
import { formatCurrency } from '../utils/currency';
import { getOptimizedImageUrl } from '../utils/image';

/* ─── Types ─── */

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
  category_id: string | null;
}

interface GalleryItem extends GalleryRow {
  variant?: Pick<ProductVariant, 'id' | 'color_name' | 'color_hex' | 'retail_price' | 'stock_quantity' | 'sku'>;
  product?: GalleryProduct;
  categoryName?: string;
}

interface CategoryOption { id: string; name: string; }

interface GalleryData { items: GalleryItem[]; categories: CategoryOption[]; }

interface GalleryPageProps {
  onNavigate: (view: string, target?: string, product?: Product) => void;
  onAddToCart: (item: CartItem) => void;
  locale: Locale;
}

/* ─── Data fetching ─── */

async function fetchGallery(locale: string): Promise<GalleryData> {
  const { data: rawRows, error } = await supabase
    .from('gallery_images')
    .select('id, image_url, title, location_label, sort_order, product_id, variant_id')
    .eq('is_active', true)
    .order('sort_order');

  if (error || !rawRows?.length) return { items: [], categories: [{ id: 'all', name: 'Todos' }] };

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
      .select('id, name, slug, category_id')
      .in('id', [...new Set(productIds)]),
  ]);

  type VariantRow = { id: string; color_name: Record<string, string>; color_hex: string; retail_price: number; stock_quantity: number; sku: string };
  type ProductRow = { id: string; name: Record<string, string>; slug: Record<string, string> | string; category_id: string | null };

  const variantMap = new Map((variants ?? []).map((v: VariantRow) => [v.id, v]));
  const productMap = new Map((products ?? []).map((p: ProductRow) => [p.id, p]));

  // Fetch categories
  const categoryIds = [...new Set((products ?? []).map((p: ProductRow) => p.category_id).filter(Boolean))] as string[];
  const { data: categoriesRaw } = categoryIds.length
    ? await supabase.from('categories').select('id, name').in('id', categoryIds)
    : { data: [] };

  type CategoryRow = { id: string; name: Record<string, string> | string };
  const categoryMap = new Map((categoriesRaw ?? []).map((c: CategoryRow) => {
    const name = typeof c.name === 'object' ? (c.name[locale] ?? c.name['pt'] ?? Object.values(c.name)[0] ?? '') : c.name;
    return [c.id, name as string];
  }));

  const items: GalleryItem[] = rows.map((r: GalleryRow) => {
    const product = r.product_id ? (productMap.get(r.product_id) as GalleryProduct | undefined) : undefined;
    const categoryName = product?.category_id ? categoryMap.get(product.category_id) : undefined;
    return {
      ...r,
      variant: r.variant_id ? (variantMap.get(r.variant_id) as GalleryItem['variant']) : undefined,
      product,
      categoryName,
    };
  });

  // Build category pills — only categories that have gallery items
  const usedCategoryIds = new Set(items.map(i => i.product?.category_id).filter(Boolean));
  const categories: CategoryOption[] = [
    { id: 'all', name: 'Todos' },
    ...([...usedCategoryIds] as string[])
      .filter(id => categoryMap.has(id))
      .map(id => ({ id, name: categoryMap.get(id)! })),
  ];

  return { items, categories };
}

/* ─── Page component ─── */

export function GalleryPage({ onNavigate, onAddToCart, locale }: GalleryPageProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const getLoc = createGetLoc(locale);

  const { data, isLoading } = useQuery({
    queryKey: ['gallery-images', locale],
    queryFn: () => fetchGallery(locale),
    staleTime: 5 * 60 * 1000,
  });

  const images = data?.items ?? [];
  const categories = data?.categories ?? [{ id: 'all', name: 'Todos' }];

  const filteredItems = useMemo(() => {
    return images.filter(img => {
      const matchesCat = activeCategory === 'all' || img.product?.category_id === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q
        || (img.title?.toLowerCase() ?? '').includes(q)
        || (img.product ? getLoc(img.product.name).toLowerCase() : '').includes(q)
        || (img.location_label?.toLowerCase() ?? '').includes(q);
      return matchesCat && matchesSearch;
    });
  }, [images, activeCategory, searchQuery, getLoc]);

  // Lightbox open/close
  useEffect(() => {
    if (selectedItem) requestAnimationFrame(() => setLightboxVisible(true));
    else setLightboxVisible(false);
  }, [selectedItem]);

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
      <div className="min-h-screen bg-paper pt-4 px-4 md:px-8">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-4 animate-pulse bg-neutral-100 rounded-2xl aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-paper">

      {/* ══ AI Studio Sticky Nav ══ */}
      <nav className="sticky top-0 z-30 bg-paper border-b border-black/8">
        <div className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: logo + links */}
          <div className="flex items-center gap-8">
            <h2 className="font-serif text-3xl tracking-tight font-medium">AURICAPRI</h2>
            <div className="hidden md:flex items-center gap-6 text-sm uppercase tracking-widest font-light">
              <button onClick={() => onNavigate('home', 'collection')} className="hover:opacity-50 transition-opacity">
                Coleções
              </button>
              <span className="font-medium border-b border-black pb-px">Galeria</span>
              <button onClick={() => onNavigate('about')} className="hover:opacity-50 transition-opacity">
                Sobre
              </button>
              <button onClick={() => onNavigate('contact')} className="hover:opacity-50 transition-opacity">
                Contato
              </button>
            </div>
          </div>

          {/* Right: search + Instagram */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar inspiração..."
                className="pl-10 pr-4 py-2 bg-black/5 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black/10 w-48 lg:w-64 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <a
              href="https://www.instagram.com/auricapri.oficial"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ══ Header Hero ══ */}
      <header className="px-6 py-16 md:py-24 text-center max-w-4xl mx-auto">
        <span className="text-xs uppercase tracking-[0.3em] text-black/40 mb-4 block">
          Curadoria de Estilo
        </span>
        <h1 className="font-serif text-5xl md:text-7xl mb-8 leading-tight">
          Nossa Galeria de <em>Inspirações</em>
        </h1>
        <p className="text-black/60 font-light leading-relaxed max-w-2xl mx-auto">
          Explore o universo Auricapri através da nossa curadoria visual.
          Looks reais, momentos brasileiros — toque em qualquer peça para descobrir.
        </p>
      </header>

      {/* ══ Category Filters ══ */}
      <div className="px-6 mb-12 flex flex-wrap justify-center gap-2">
        {categories.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{ transitionDelay: `${idx * 40}ms` }}
            className={`px-6 py-2 rounded-full text-sm tracking-wide transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-black text-white shadow-lg'
                : 'bg-paper border border-black/10 hover:border-black/30'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ══ Gallery ══ */}
      <main className="px-4 md:px-8 pb-24 flex-grow">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
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

        {filteredItems.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-black/40 font-light italic">
              {searchQuery
                ? `Nenhuma peça encontrada para "${searchQuery}".`
                : 'Em breve — nossa galeria está sendo preparada.'}
            </p>
          </div>
        )}
      </main>

      {/* ══ Lightbox ══ */}
      {selectedItem && (
        <GalleryLightbox
          img={selectedItem}
          visible={lightboxVisible}
          isAdding={addingId === selectedItem.id}
          getLoc={getLoc}
          locale={locale}
          onClose={closeLightbox}
          onNavigate={() => { closeLightbox(); setTimeout(() => handleNavigateToProduct(selectedItem), 320); }}
          onAddToCart={() => handleAddToCart(selectedItem)}
        />
      )}
    </div>
  );
}

/* ─── GalleryCard ─── */

interface GalleryCardProps {
  img: GalleryItem;
  index: number;
  getLoc: (obj: unknown) => string;
  locale: Locale;
  onClick: () => void;
}

function GalleryCard({ img, index, getLoc, locale, onClick }: GalleryCardProps) {
  const productName = img.product ? getLoc(img.product.name) : img.title;
  const categoryLabel = img.categoryName ?? img.location_label;

  return (
    <div
      className="relative group cursor-pointer break-inside-avoid"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={onClick}
    >
      <div className="overflow-hidden rounded-2xl bg-black/5">
        <img
          src={getOptimizedImageUrl(img.image_url, 'medium')}
          alt={productName ?? 'Auricapri'}
          loading="lazy"
          className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Hover overlay — exactly AI Studio style */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col justify-end p-6">
        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          {categoryLabel && (
            <span className="text-[10px] uppercase tracking-widest text-white/70 mb-1 block">
              {categoryLabel}
            </span>
          )}
          {productName && (
            <h3 className="text-white font-serif text-xl mb-3">{productName}</h3>
          )}
          <div className="flex items-center justify-between">
            <button className="text-white/80 hover:text-white text-xs flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              Ver detalhes
            </button>
            <div className="w-8 h-8 rounded-full bg-paper/20 backdrop-blur-md flex items-center justify-center text-white">
              <Instagram className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GalleryLightbox ─── */

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
  const categoryLabel = img.categoryName ?? img.location_label;
  const outOfStock = !img.variant || img.variant.stock_quantity < 1;

  const shareUrl = img.product
    ? `https://www.auricapri.com.br/product/${getLoc(img.product.slug) || img.product.id}`
    : 'https://www.auricapri.com.br/galeria';

  return (
    <div className={`fixed inset-0 z-[80] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-paper" onClick={onClose} />

      {/* Scrollable area */}
      <div className="relative h-full overflow-y-auto overscroll-contain">

        {/* Sticky close button */}
        <div className="sticky top-0 z-10 flex justify-end p-4 md:p-8 pointer-events-none">
          <button
            className="pointer-events-auto p-2.5 bg-black/8 hover:bg-black/15 rounded-full transition-colors"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className={`px-4 md:px-12 pb-8 -mt-2 md:-mt-6 transition-transform duration-500 ${visible ? 'translate-y-0' : 'translate-y-6'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 md:gap-12 items-start">

            {/* Image */}
            <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
              <img
                src={getOptimizedImageUrl(img.image_url, 'large')}
                alt={productName ?? 'Auricapri'}
                className="w-full h-auto max-h-[50vh] md:max-h-[75vh] object-cover"
              />
            </div>

            {/* Info */}
            <div
              className="flex flex-col gap-5"
              style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            >
              <div>
                {categoryLabel && (
                  <span className="text-xs uppercase tracking-[0.3em] text-black/40 mb-2 block">
                    {categoryLabel}
                  </span>
                )}
                <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl mb-3 leading-tight">
                  {productName ?? 'Auricapri'}
                </h2>
                {img.variant?.retail_price ? (
                  <div>
                    <p className="text-xl md:text-2xl font-light mb-1">{formatCurrency(img.variant.retail_price, locale)}</p>
                    {img.variant.retail_price >= 10 && (
                      <p className="text-xs text-black/40">
                        ou <span className="font-semibold text-black">6x de {formatCurrency(img.variant.retail_price / 6, locale)}</span> sem juros
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-black/60 font-light leading-relaxed">
                    Uma peça que transcende o tempo, desenhada para mulheres que valorizam a sofisticação.
                  </p>
                )}
              </div>

              {img.variant?.color_name && (
                <div className="flex items-center gap-3">
                  {img.variant.color_hex && (
                    <div className="w-5 h-5 rounded-full border border-black/10 shadow-sm flex-shrink-0" style={{ backgroundColor: img.variant.color_hex }} />
                  )}
                  <span className="text-xs uppercase tracking-widest font-medium text-black/50">
                    {getLoc(img.variant.color_name)}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {img.product && (
                  <button
                    onClick={onNavigate}
                    className="w-full py-4 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors flex items-center justify-center gap-3 text-sm"
                  >
                    Ver na Loja Online
                  </button>
                )}
                {img.product && !outOfStock && (
                  <button
                    onClick={onAddToCart}
                    className={`w-full py-4 border rounded-full font-medium transition-all text-sm flex items-center justify-center gap-3 ${
                      isAdding
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-black/20 hover:bg-black/5'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {isAdding ? 'Adicionado!' : 'Adicionar à Bolsa'}
                  </button>
                )}
                {outOfStock && img.product && (
                  <p className="text-center text-xs uppercase tracking-widest text-black/30 font-bold py-2">
                    Esgotado
                  </p>
                )}
              </div>

              {/* Share */}
              <div className="pt-5 border-t border-black/5 flex items-center gap-6">
                <span className="text-xs uppercase tracking-widest text-black/40">Compartilhar</span>
                <div className="flex gap-4">
                  <a href="https://www.instagram.com/auricapri.oficial" target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href={`mailto:?subject=Olha essa peça da Auricapri&body=${shareUrl}`} className="hover:opacity-50 transition-opacity">
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
