
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Banner } from '../../types';
import { Locale } from '../../i18n';
import { OptimizedImage } from '../ui';

interface HeroProps {
  onNavigate?: (view: 'home' | 'product', target?: string) => void;
  t: (key: string) => string;
  banners?: Banner[];
  locale: Locale;
  isLoading?: boolean;
}

const Hero: React.FC<HeroProps> = ({ onNavigate, t, banners, locale, isLoading }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) onNavigate('home', 'collection');
  };

  const getBannerContent = (banner: Banner) => {
    const getVal = (obj: unknown) => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;
      const val = (obj as Record<string, unknown>)[locale];
      return typeof val === 'string' ? val : '';
    };
    
    return { 
      title: getVal(banner.title), 
      image: getVal(banner.image_url) 
    };
  };

  const validBanners = (banners || []).filter(b => {
    const title = (b.title as Record<string, unknown> | undefined)?.[locale];
    const img = (b.image_url as Record<string, unknown> | undefined)?.[locale];
    return typeof title === 'string' && title.trim() !== '' && typeof img === 'string' && img.trim() !== '';
  });

  const activeBannerRaw = validBanners.length > 0 ? validBanners[0] : null;
  const mainBanner = activeBannerRaw ? getBannerContent(activeBannerRaw) : null;

  if (isLoading || !mainBanner) {
    return (
      <section className="w-full h-[70vh] md:h-dvh snap-start relative bg-neutral-50 animate-shimmer overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-[1px] bg-neutral-200"></div>
        </div>
      </section>
    );
  }

  return (
    <section id="hero" className="w-full h-[70vh] md:h-dvh snap-start relative flex items-center justify-center overflow-hidden bg-neutral-900">
      <div className="absolute inset-0 z-0">
        <OptimizedImage
          src={mainBanner.image}
          alt={mainBanner.title || t('hero.bannerImage')}
          className="w-full h-full opacity-80"
          size="xlarge"
          priority
          objectFit="cover"
          placeholder="blur"
          useSrcSet
          srcSetSizes={['medium', 'large', 'xlarge']}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 text-center text-white px-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 flex flex-col">
        <h1 className="text-5xl md:text-[8rem] lg:text-[10rem] font-light font-serif tracking-tighter mb-20 whitespace-pre-line leading-[0.82] uppercase order-2">
          {mainBanner.title}
        </h1>
        <p className="text-[10px] md:text-[11px] font-black tracking-[0.6em] mb-10 uppercase text-white/80 order-1">
          {t('hero.subtitle')}
        </p>
        <a
          href="#collection"
          onClick={handleClick}
          aria-label={t('hero.cta')}
          className="inline-flex items-center gap-3 text-[10px] tracking-[0.4em] border border-white/20 bg-paper/5 backdrop-blur-md px-8 py-4 hover:bg-paper hover:text-black transition-all duration-700 uppercase font-black rounded-sm order-3 self-center"
        >
          <span>{t('hero.cta')}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-4 text-white/40">
        <div className="w-[1px] h-16 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
};

export default Hero;
