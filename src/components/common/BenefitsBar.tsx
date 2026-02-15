import React, { useMemo } from 'react';
import type { Banner } from '../../types';
import type { Locale } from '../../i18n';

const DEFAULT_MESSAGE = 'FRETE GRÁTIS  ·  TROCA GRÁTIS EM ATÉ 30 DIAS  ·  PARCELE EM ATÉ 6X SEM JUROS  ·  ';

interface BenefitsBarProps {
  banners?: Banner[];
  locale?: Locale;
}

export function BenefitsBar({ banners, locale = 'pt' }: BenefitsBarProps) {
  const message = useMemo(() => {
    if (!banners || banners.length === 0) return DEFAULT_MESSAGE;

    const now = new Date();
    const topBarBanners = banners
      .filter((b) => {
        if (b.position !== 'top_bar' || !b.is_active) return false;
        if (b.starts_at && new Date(b.starts_at) > now) return false;
        if (b.ends_at && new Date(b.ends_at) < now) return false;
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    if (topBarBanners.length === 0) return DEFAULT_MESSAGE;

    return topBarBanners
      .map((b) => {
        const title = b.title;
        if (!title) return '';
        if (typeof title === 'string') return title;
        return title[locale] || title['pt'] || title['en'] || Object.values(title)[0] || '';
      })
      .filter(Boolean)
      .join('  ·  ') + '  ·  ';
  }, [banners, locale]);

  return (
    <div className="fixed top-0 left-0 w-full h-8 bg-black z-[51] overflow-hidden flex items-center">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="whitespace-nowrap flex items-center"
        style={{ animation: 'marquee 25s linear infinite' }}
      >
        <span className="text-white text-[10px] uppercase tracking-wider font-medium px-4">
          {message}
        </span>
        <span className="text-white text-[10px] uppercase tracking-wider font-medium px-4">
          {message}
        </span>
      </div>
    </div>
  );
}
