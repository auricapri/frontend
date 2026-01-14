import React, { useEffect } from 'react';
import { X, ChevronUp } from 'lucide-react';
import { useBottomSheetGesture } from '../../hooks/useBottomSheetGesture';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  hasActiveFilters: boolean;
  productCount?: number;
  onClear?: () => void;
  t?: (key: string) => string;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  hasActiveFilters,
  productCount,
  onClear,
  t = (key: string) => key
}) => {
  const {
    state,
    translateY,
    isDragging,
    handleRef,
    contentRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setState
  } = useBottomSheetGesture({
    initialState: isOpen ? 'open' : 'closed',
    onStateChange: (newState) => {
      if (newState === 'closed') {
        onClose();
      }
    },
    peekHeight: 80,
    openHeight: 88,
  });

  useEffect(() => {
    if (isOpen && state === 'closed') {
      setState('open');
    } else if (!isOpen && state !== 'closed') {
      setState('closed');
    }
  }, [isOpen, state, setState]);

  useEffect(() => {
    if (state !== 'closed') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [state]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setState('closed');
    }
  };

  if (!isOpen && state === 'closed') return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          state === 'closed' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-2xl z-[101] flex flex-col max-h-[85vh]"
        style={{
          transform: `translateY(${translateY}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de produtos"
      >
        <div
          ref={handleRef}
          className="flex-shrink-0 px-6 pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[120px] h-1.5 bg-neutral-300 rounded-full" />
            </div>
            <button
              onClick={() => setState('closed')}
              className="p-2 -mr-2 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Fechar filtros"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
          {state === 'peek' && (
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 mb-2">
              <ChevronUp className="w-4 h-4" />
              <span>{t('grid.swipeToExpand')}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 touch-pan-y">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </div>

        {state === 'open' && (
          <div className="flex-shrink-0 border-t border-neutral-100 px-6 py-4 bg-neutral-50">
            <div className="flex items-center justify-between gap-4">
              {productCount !== undefined && (
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600">
                  {t('grid.filtersApplied').replace('{count}', productCount.toString())}
                </span>
              )}
              <div className="flex gap-3">
                {onClear && (
                  <button
                    onClick={onClear}
                    className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600 hover:text-neutral-900 bg-white rounded-lg shadow-sm transition-colors"
                    aria-label={t('grid.clearFilters')}
                  >
                    {t('grid.clearFilters')}
                  </button>
                )}
                <button
                  onClick={() => setState('closed')}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
                  aria-label={t('grid.applyFilters')}
                >
                  {t('grid.applyFilters')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
