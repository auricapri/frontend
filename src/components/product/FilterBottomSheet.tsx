import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 bottom-0 z-[101] transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de produtos"
        style={{
          maxHeight: 'calc(90vh - env(safe-area-inset-top, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="bg-white rounded-t-3xl shadow-2xl flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="flex-shrink-0 px-5 pt-4 pb-4 border-b border-neutral-100">
            {/* Drag Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
            </div>

            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-[16px] font-bold uppercase tracking-[0.08em] text-neutral-900">
                  {t('grid.filter')}
                </h3>
                {hasActiveFilters && onClear && (
                  <button
                    onClick={onClear}
                    className="text-[12px] font-semibold text-red-500 active:text-red-600 underline underline-offset-2"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-neutral-100 active:bg-neutral-200 rounded-full transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-5 py-5"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y pinch-zoom'
            }}
          >
            {children}
          </div>

          {/* Footer - Fixed at bottom with safe area */}
          <div
            className="flex-shrink-0 border-t border-neutral-200 px-5 pt-4 bg-white"
            style={{
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 16px))'
            }}
          >
            <button
              onClick={onClose}
              className="w-full py-4 bg-neutral-900 text-white text-[13px] font-bold uppercase tracking-[0.12em] rounded-xl active:bg-neutral-700 transition-colors"
            >
              {t('grid.applyFilters')} {productCount !== undefined && `(${productCount})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
