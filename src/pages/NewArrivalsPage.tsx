import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { Collection } from '../types';
import { Locale } from '../i18n';
import { createGetLoc } from '../utils/localization';
import { Footer } from '../components/layout';
import type { StoreConfig } from '../types';

interface NewArrivalsPageProps {
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
  locale: Locale;
  t: (key: string) => any;
  onBack: () => void;
  onChangeLocale: (locale: Locale) => void;
  storeConfig: StoreConfig;
  onOpenLegal: (view: 'terms' | 'privacy' | null) => void;
  onNavigate: (view: string, section?: string) => void;
}

export function NewArrivalsPage({
  collections,
  onSelectCollection,
  locale,
  t,
  onBack,
  onChangeLocale,
  storeConfig,
  onOpenLegal: _onOpenLegal,
  onNavigate
}: NewArrivalsPageProps) {
  const getLoc = createGetLoc(locale);

  // Adaptive grid that fills all space - no item left alone
  const getGridClass = (index: number, total: number) => {

    // For very small collections, use simpler layouts
    if (total === 1) {
      return 'col-span-2 row-span-2 md:col-span-4 md:row-span-2'; // Single item takes full width
    }

    if (total === 2) {
      return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2'; // Two items side by side
    }

    if (total === 3) {
      if (index === 0) return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2'; // Large
      return 'col-span-1 row-span-2 md:col-span-1 md:row-span-2'; // Two tall items
    }

    if (total === 4) {
      return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1'; // 2x2 grid of equal items
    }

    if (total === 5) {
      if (index === 0) return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2'; // Large featured
      if (index < 3) return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1'; // Two small
      return 'col-span-1 row-span-1 md:col-span-2 md:row-span-1'; // Last two wide
    }

    if (total === 6) {
      if (index === 0) return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2'; // Large
      if (index < 3) return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1'; // Two small
      return 'col-span-2 row-span-1 md:col-span-1 md:row-span-1'; // Three bottom - mobile full, desktop third
    }

    if (total === 7) {
      if (index === 0) return 'col-span-2 row-span-2 md:col-span-2 md:row-span-2'; // Large
      if (index < 3) return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1'; // Two small
      if (index === 3) return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1'; // Wide
      if (index < 6) return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1'; // Two small
      return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1'; // Last wide
    }

    // For 8+ items, use repeating pattern but ensure last items fill space
    const posInPattern = index % 8;

    // Check if we need to adjust the last items to fill remaining space
    const remaining = total - index;

    // If this is one of the last few items, adjust to fill the row
    if (remaining === 1) {
      // Last item alone - make it full width
      return 'col-span-2 row-span-1 md:col-span-4 md:row-span-1';
    }

    if (remaining === 2) {
      // Two items left - each takes half on desktop
      return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1';
    }

    if (remaining === 3 && index >= total - 3) {
      // Three items left
      if (index === total - 3) return 'col-span-2 row-span-1 md:col-span-2 md:row-span-1';
      return 'col-span-1 row-span-1 md:col-span-1 md:row-span-1';
    }

    // Standard pattern for 8+ items
    const patterns = [
      'col-span-2 row-span-2 md:col-span-2 md:row-span-2', // 0: Large featured
      'col-span-1 row-span-1 md:col-span-1 md:row-span-1', // 1: Small
      'col-span-1 row-span-1 md:col-span-1 md:row-span-1', // 2: Small
      'col-span-2 row-span-1 md:col-span-2 md:row-span-1', // 3: Wide
      'col-span-1 row-span-1 md:col-span-1 md:row-span-1', // 4: Small
      'col-span-1 row-span-1 md:col-span-1 md:row-span-1', // 5: Small
      'col-span-1 row-span-1 md:col-span-1 md:row-span-1', // 6: Small
      'col-span-1 row-span-1 md:col-span-1 md:row-span-1', // 7: Small
    ];

    return patterns[posInPattern];
  };

  return (
    <div className="min-h-full flex flex-col bg-paper">
      <SEOHead
        title="Novidades | Auricapri"
        description="Descubra as novidades da Auricapri. Novas colecoes, pecas exclusivas e as ultimas tendencias em moda feminina."
        keywords="novidades, colecoes novas, moda feminina, auricapri, lancamentos"
        url="https://www.auricapri.com.br/new-arrivals"
      />
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 pt-24 pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-8 group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">{t('nav.back')}</span>
        </button>

        <div className="space-y-3">
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight">
            {t('nav.newArrivals')}
          </h1>
          <p className="text-neutral-500 text-sm md:text-base max-w-lg">
            {locale === 'pt' ? 'Explore nossas coleções exclusivas e descubra as últimas tendências' :
             locale === 'es' ? 'Explora nuestras colecciones exclusivas y descubre las últimas tendencias' :
             'Explore our exclusive collections and discover the latest trends'}
          </p>
        </div>
      </div>

      {/* Creative Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px] lg:auto-rows-[220px] grid-flow-dense">
          {collections.map((collection, index) => (
            <button
              key={collection.id}
              onClick={() => onSelectCollection(collection)}
              className={`
                ${getGridClass(index, collections.length)}
                relative overflow-hidden rounded-2xl md:rounded-3xl group cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                transition-shadow duration-300
              `}
            >
              {/* Background Image */}
              <img
                src={collection.image_url || '/placeholder-collection.jpg'}
                alt={getLoc(collection.name)}
                loading={index < 4 ? 'eager' : 'lazy'}
                fetchPriority={index < 4 ? 'high' : 'auto'}
                className="absolute inset-0 w-full h-full object-cover
                  transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent
                opacity-70 group-hover:opacity-85 transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end">
                <h3 className="font-serif text-white font-black text-base md:text-lg lg:text-xl uppercase tracking-wide
                  transform transition-all duration-300 ease-out group-hover:translate-y-[-4px]">
                  {getLoc(collection.name)}
                </h3>
                {collection.description && (
                  <p className="text-white/70 text-[10px] md:text-xs mt-1 line-clamp-2
                    opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-12
                    transition-all duration-300 ease-out overflow-hidden">
                    {getLoc(collection.description)}
                  </p>
                )}

                {/* View Collection indicator */}
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold">
                    {locale === 'pt' ? 'Ver coleção' : locale === 'es' ? 'Ver colección' : 'View collection'}
                  </span>
                  <ArrowLeft className="w-3 h-3 text-white/60 rotate-180" strokeWidth={2} />
                </div>
              </div>

              {/* Hover border effect */}
              <div className="absolute inset-0 border-2 md:border-4 border-white/0
                group-hover:border-white/20 rounded-2xl md:rounded-3xl transition-colors duration-300 pointer-events-none" />
            </button>
          ))}
        </div>

        {/* Empty State */}
        {collections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="font-serif text-xl font-black uppercase tracking-tight mb-2">
              {locale === 'pt' ? 'Em breve' : locale === 'es' ? 'Próximamente' : 'Coming Soon'}
            </h3>
            <p className="text-neutral-500 text-sm max-w-sm">
              {locale === 'pt' ? 'Novas coleções estão chegando. Fique atento!' :
               locale === 'es' ? 'Nuevas colecciones están llegando. ¡Mantente atento!' :
               'New collections are coming. Stay tuned!'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer
        t={t}
        currentLocale={locale}
        onChangeLocale={onChangeLocale}
        storeConfig={storeConfig}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default NewArrivalsPage;
