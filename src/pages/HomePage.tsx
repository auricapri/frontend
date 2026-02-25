import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Hero } from '../components/shared';
import ProductGrid from '../components/product/ProductGrid';
import { Footer } from '../components/layout';
import { SEOHead, organizationSchema, websiteSchema, clothingStoreSchema } from '../components/seo';
import { Product, Category, Collection, Banner, Coupon, UserMode } from '../types';
import { Locale } from '../i18n';
import { StoreConfig } from '../types';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  userMode: UserMode;
  wishlistIds: string[];
  onSelectProduct: (product: Product) => void;
  onSelectCollection: (collection: Collection) => void;
  onToggleWishlist: (productId: string) => void;
  onNavigate: (view: string, section?: string) => void;
  onOpenLegal: (view: 'terms' | 'privacy' | null) => void;
  t: (key: string) => any;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  isLoading: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  collections,
  banners,
  coupons,
  userMode,
  wishlistIds,
  onSelectProduct,
  onSelectCollection,
  onToggleWishlist,
  onNavigate,
  onOpenLegal,
  t,
  locale,
  onChangeLocale,
  storeConfig,
  isLoading
}) => {
  return (
    <div className="min-h-full flex flex-col">
      <SEOHead
        title={t('seo.home.title')}
        description={t('seo.home.description')}
        keywords={t('seo.home.keywords')}
        type="website"
        locale={locale}
        schema={[clothingStoreSchema, organizationSchema, websiteSchema]}
      />
      <Hero 
        onNavigate={onNavigate as any} 
        t={t} 
        banners={banners} 
        locale={locale} 
        isLoading={isLoading} 
      />
      <ProductGrid 
        products={products} 
        categories={categories}
        collections={collections}
        coupons={coupons}
        userMode={userMode} 
        onSelectProduct={onSelectProduct}
        onSelectCollection={onSelectCollection}
        wishlistIds={wishlistIds}
        onToggleWishlist={onToggleWishlist}
        t={t}
        locale={locale}
        isLoading={isLoading}
      />
      <Footer
        t={t}
        currentLocale={locale}
        onChangeLocale={onChangeLocale}
        storeConfig={storeConfig}
        onNavigate={onNavigate}
      />
      
      {storeConfig.support_phone && (
        <a
          href={`https://wa.me/${storeConfig.support_phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={locale === 'pt' ? 'Contato via WhatsApp' : 'Contact via WhatsApp'}
          className="fixed bottom-10 right-6 p-5 bg-neutral-900 text-white rounded-full shadow-2xl z-40 border border-white/10 hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-in slide-in-from-bottom-10 duration-700"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
};
