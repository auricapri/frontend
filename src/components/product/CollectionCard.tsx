import React from 'react';
import { Collection } from '../../types';
import { Locale } from '../../i18n';
import { getOptimizedImageUrl } from '../../utils/image';
import { CountdownBadge, useCollectionAvailability } from '../ui/CountdownBadge';

const COMING_SOON_TEXT: Record<Locale, string> = {
  pt: 'Em breve',
  en: 'Coming soon',
  es: 'Próximamente',
  fr: 'Bientôt',
};

export interface CollectionCardProps {
  collection: Collection;
  getLoc: (obj: any) => string;
  onSelect: (collection: Collection) => void;
  locale: Locale;
}

export const CollectionCard: React.FC<CollectionCardProps> = React.memo(({ collection, getLoc, onSelect, locale }) => {
  const { isAvailable, isExpired } = useCollectionAvailability(collection.starts_at, collection.ends_at);
  const [imgError, setImgError] = React.useState(false);

  if (isExpired) return null;

  const hasStartDate = !!collection.starts_at;
  const notStartedYet = hasStartDate && new Date(collection.starts_at!) > new Date();
  const hasCountdown = collection.ends_at || notStartedYet;

  const handleClick = () => {
    if (!isAvailable) return;
    onSelect(collection);
  };

  const hasImage = !!collection.image_url && !imgError;

  return (
    <div
      onClick={handleClick}
      className={`flex-none w-[65vw] md:w-[35vw] snap-center group relative aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-neutral-100 rounded-2xl md:rounded-[2.5rem] shadow-sm transition-all ${
        isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
      }`}
    >
      {hasImage ? (
        <img
          src={getOptimizedImageUrl(collection.image_url, 'large')}
          alt={getLoc(collection.name)}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-all duration-1000 ${isAvailable ? 'group-hover:scale-105 group-active:scale-105' : 'grayscale'}`}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center ${isAvailable ? 'group-hover:from-neutral-300 group-hover:to-neutral-400' : 'grayscale'}`}>
          <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{getLoc(collection.name)}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/20 flex flex-col justify-end p-4 md:p-8 text-white">
        <h3 className="text-lg md:text-2xl font-light tracking-widest uppercase">{getLoc(collection.name)}</h3>
        <div className={`w-0 h-[1px] bg-white transition-all duration-500 mt-2 opacity-50 ${isAvailable ? 'group-hover:w-full group-active:w-full' : ''}`} />
      </div>

      {hasCountdown && isAvailable && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-all duration-500 group-hover:opacity-0 group-hover:backdrop-blur-0 group-active:opacity-0">
          <div className="absolute top-4 md:top-6 left-0 right-0 text-center">
            <h3 className="text-base md:text-2xl font-light tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/90">{getLoc(collection.name)}</h3>
          </div>
          <div className="text-center">
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3 text-orange-400">
              {notStartedYet
                ? (locale === 'pt' ? 'Começa em' : locale === 'es' ? 'Comienza en' : 'Starts in')
                : (locale === 'pt' ? 'Termina em' : locale === 'es' ? 'Termina en' : 'Ends in')
              }
            </div>
            <div className="scale-125 md:scale-[1.75]">
              <CountdownBadge
                endsAt={collection.ends_at}
                startsAt={collection.starts_at}
                variant="badge"
                locale={locale}
              />
            </div>
          </div>
          <div className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center">
            <div className="text-[10px] md:text-[10px] font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/50">
              <span className="md:hidden">{locale === 'pt' ? 'Toque para ver' : locale === 'es' ? 'Toca para ver' : 'Tap to reveal'}</span>
              <span className="hidden md:inline">{locale === 'pt' ? 'Passe o mouse para ver' : locale === 'es' ? 'Pasa el mouse para ver' : 'Hover to reveal'}</span>
            </div>
          </div>
        </div>
      )}

      {!isAvailable && !isExpired && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-sm font-bold uppercase tracking-widest">{COMING_SOON_TEXT[locale]}</span>
        </div>
      )}
    </div>
  );
});
