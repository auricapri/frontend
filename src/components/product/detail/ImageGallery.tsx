import React from 'react';
import { Maximize2, ScanFace } from 'lucide-react';
import { OptimizedImage } from '../../ui';
import { getOptimizedImageUrl } from '../../../utils/image';
import { type Product, type ProductImageHotspot, type CartItem } from '../../../types';
import { ImageHotspots } from '../ImageHotspots';
import { Locale } from '../../../i18n';

export type GalleryImageData = {
  url: string;
  variantId: string;
  variantColor: string;
  variantColorName: any;
  size: string;
  combinationKey: string;
  isBase: boolean;
  variantIds: string[];
};

export function ImageGallery(props: {
  product: Product;
  allImagesWithVariant: GalleryImageData[];
  activeVariantId?: string;
  activeVariantColorName?: any;
  getLoc: (obj: any) => string;
  setZoomImgIndex: (idx: number) => void;
  setIsZoomOpen: (open: boolean) => void;
  mobileGalleryRef: React.RefObject<HTMLDivElement | null>;
  handleMobileScroll: React.UIEventHandler<HTMLDivElement>;
  mobileActiveIdx: number;
  showFaceSwap?: boolean;
  onFaceSwapClick?: () => void;
  // Hotspots props
  hotspots?: ProductImageHotspot[];
  onAddToCart?: (item: CartItem) => void;
  onNavigateToProduct?: (product: Product) => void;
  locale?: Locale;
}) {
  const {
    product,
    allImagesWithVariant,
    activeVariantId,
    activeVariantColorName,
    getLoc,
    setZoomImgIndex,
    setIsZoomOpen,
    mobileGalleryRef,
    handleMobileScroll,
    mobileActiveIdx,
    showFaceSwap,
    onFaceSwapClick,
    hotspots = [],
    onAddToCart,
    onNavigateToProduct,
    locale = 'pt',
  } = props;

  return (
    <div className="w-full md:w-[60%] bg-paper relative">
      <div className="hidden md:flex flex-col space-y-4 p-4 lg:p-12 overflow-y-visible" id="desktop-gallery">
        {allImagesWithVariant.map((imgData, idx) => {
          const isActiveVariantImage = (activeVariantId && imgData.variantIds?.includes(activeVariantId)) || false;
          const isFirstOfCombination = idx === 0 || allImagesWithVariant[idx - 1].combinationKey !== imgData.combinationKey;

          return (
            <div
              key={`img-${imgData.variantId}-${idx}-${imgData.url}`}
              data-variant-id={imgData.variantIds?.join(',') || imgData.variantId}
              data-combination-key={imgData.combinationKey}
              id={isFirstOfCombination ? `anchor-${imgData.combinationKey}` : undefined}
              role="button"
              tabIndex={0}
              aria-label={`Ampliar imagem ${idx + 1} do produto ${getLoc(product.name)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setZoomImgIndex(idx);
                  setIsZoomOpen(true);
                }
              }}
              className="relative bg-paper overflow-hidden cursor-zoom-in group rounded-[1.5rem] lg:rounded-[2.5rem] shadow-sm border border-neutral-100 transition-all focus:outline-2 focus:outline-black focus:outline-offset-2"
              onClick={() => {
                setZoomImgIndex(idx);
                setIsZoomOpen(true);
              }}
            >
              <ImageHotspots
                imageUrl={imgData.url}
                hotspots={hotspots}
                locale={locale}
                onAddToCart={onAddToCart || (() => {})}
                onNavigateToProduct={onNavigateToProduct}
              >
                <img
                  src={getOptimizedImageUrl(imgData.url, idx < 2 ? 'large' : 'medium')}
                  alt={`${getLoc(product.name)} view ${idx + 1}`}
                  className="w-full h-auto transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </ImageHotspots>
              <div className="absolute bottom-10 right-10 p-5 bg-paper/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                <Maximize2 className="w-6 h-6" />
              </div>
              {showFaceSwap && idx === 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onFaceSwapClick?.(); }}
                  className="absolute bottom-10 left-10 flex items-center gap-2 px-4 py-2.5 bg-paper/90 backdrop-blur-md rounded-full opacity-80 hover:opacity-100 transition-all shadow-lg border border-neutral-100 group/faceswap z-10"
                  aria-label="Provador virtual - experimente esta peça"
                >
                  <ScanFace className="w-4 h-4 text-neutral-700 group-hover/faceswap:text-black transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 group-hover/faceswap:text-black">Provador</span>
                </button>
              )}
              {isActiveVariantImage && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {getLoc(activeVariantColorName)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden relative group">
        <div ref={mobileGalleryRef} onScroll={handleMobileScroll} className="aspect-[3/4] overflow-x-auto snap-x snap-mandatory flex no-scrollbar bg-paper">
          {allImagesWithVariant.map((imgData, idx) => {
            const isActiveVariantImage = (activeVariantId && imgData.variantIds?.includes(activeVariantId)) || false;
            const isFirstOfCombination = idx === 0 || allImagesWithVariant[idx - 1].combinationKey !== imgData.combinationKey;

            return (
              <div
                key={`img-mobile-${imgData.variantId}-${idx}-${imgData.url}`}
                data-variant-id={imgData.variantIds?.join(',') || imgData.variantId}
                data-combination-key={imgData.combinationKey}
                id={isFirstOfCombination ? `anchor-mobile-${imgData.combinationKey}` : undefined}
                role="button"
                tabIndex={0}
                aria-label={`Ampliar imagem ${idx + 1} do produto ${getLoc(product.name)}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setZoomImgIndex(idx);
                    setIsZoomOpen(true);
                  }
                }}
                className="flex-none w-full h-full snap-center relative overflow-hidden focus:outline-2 focus:outline-black focus:outline-offset-2"
                onClick={() => {
                  setZoomImgIndex(idx);
                  setIsZoomOpen(true);
                }}
              >
                <ImageHotspots
                  imageUrl={imgData.url}
                  hotspots={hotspots}
                  locale={locale}
                  onAddToCart={onAddToCart || (() => {})}
                  onNavigateToProduct={onNavigateToProduct}
                >
                  <OptimizedImage
                    src={imgData.url}
                    alt={`${getLoc(product.name)} - ${getLoc(activeVariantColorName || {})} - Vista ${idx + 1}`}
                    className="w-full h-full"
                    size="medium"
                    priority={idx === 0}
                    objectFit="contain"
                  />
                </ImageHotspots>
                {isActiveVariantImage && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    {getLoc(activeVariantColorName)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {mobileActiveIdx + 1} <span className="text-white/40">/ {allImagesWithVariant.length}</span>
          </span>
        </div>

        {showFaceSwap && (
          <button
            onClick={(e) => { e.stopPropagation(); onFaceSwapClick?.(); }}
            className="absolute bottom-24 left-4 flex items-center gap-2 px-3 py-2 bg-paper/90 backdrop-blur-md rounded-full shadow-lg border border-neutral-100 z-10"
            aria-label="Provador virtual - experimente esta peça"
          >
            <ScanFace className="w-4 h-4 text-neutral-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Provador</span>
          </button>
        )}
      </div>
    </div>
  );
}
