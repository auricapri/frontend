import React, { useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: (key: string) => string;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  t,
}) => {
  const handlePrev = useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1));
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center space-x-8 mt-20">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="p-3 border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white hover:border-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-900 disabled:hover:border-neutral-200 transition-all"
        aria-label="Página anterior"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">
          {t('grid.page')}
        </span>
        <span className="text-lg font-light tabular-nums">
          {currentPage} <span className="text-neutral-300 text-sm">/ {totalPages}</span>
        </span>
      </div>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="p-3 border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white hover:border-neutral-900 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-neutral-900 disabled:hover:border-neutral-200 transition-all"
        aria-label="Próxima página"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
