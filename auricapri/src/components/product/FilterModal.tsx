import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  productCount: number;
  onApply: () => void;
  onClear: () => void;
  title?: string;
  t?: (key: string) => string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  children,
  productCount,
  onApply,
  onClear,
  title = 'Filtros',
  t = (key: string) => key
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const focusTrapRef = useFocusTrap(isOpen);
  
  useEffect(() => {
    if (modalRef.current) {
      focusTrapRef.current = modalRef.current;
    }
  }, [isOpen, focusTrapRef]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] animate-in fade-in duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        >
          <div
          ref={modalRef}
          className="bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
          tabIndex={-1}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
            <h2
              id="filter-modal-title"
              className="text-xl font-black uppercase tracking-tighter"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Fechar filtros"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
            <div className="max-w-2xl mx-auto space-y-8">
              {children}
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-neutral-100 px-6 py-4 bg-neutral-50">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600">
                {t('grid.filtersApplied').replace('{count}', productCount.toString())}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={onClear}
                  className="px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                >
                  {t('grid.clearFilters')}
                </button>
                <button
                  onClick={onApply}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  {t('grid.applyFilters')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
