/// Zoom Modal
/// Full-screen image zoom with navigation

import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../utils/image';

interface ZoomImage {
  url: string;
}

interface ZoomModalProps {
  isOpen: boolean;
  images: ZoomImage[];
  displayImages: string[];
  currentIndex: number;
  productName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ZoomModal({
  isOpen,
  images,
  displayImages,
  currentIndex,
  productName,
  onClose,
  onNavigate,
}: ZoomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-paper flex flex-col animate-in fade-in zoom-in-95 duration-700">
      <header className="h-24 px-12 flex justify-between items-center fixed top-0 w-full z-10 bg-paper/90 backdrop-blur-3xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300">Gallery View</span>
          <h4 className="text-[11px] font-black uppercase tracking-[0.4em]">{productName}</h4>
        </div>
        <button
          onClick={onClose}
          className="p-4 bg-black text-white rounded-full hover:rotate-90 transition-all duration-500 shadow-2xl"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-hidden p-8 md:p-24 flex items-center justify-center relative bg-neutral-50/30">
        <button
          disabled={currentIndex === 0}
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-6 md:left-12 p-6 bg-paper/80 backdrop-blur-md rounded-full shadow-2xl disabled:opacity-0 transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={getOptimizedImageUrl(displayImages[currentIndex], 'xlarge')}
            className="max-h-full max-w-full object-contain cursor-crosshair transition-transform duration-700 hover:scale-150"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>

        <button
          disabled={currentIndex === images.length - 1}
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-6 md:right-12 p-6 bg-paper/80 backdrop-blur-md rounded-full shadow-2xl disabled:opacity-0 transition-all"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-paper/50 backdrop-blur-xl rounded-[2rem] border border-white/20">
        {images.map((imgData, i) => (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            aria-label={`Ver imagem ${i + 1} de ${images.length} do produto ${productName}`}
            aria-pressed={currentIndex === i}
            className={`w-12 h-16 rounded-xl overflow-hidden border-2 transition-all ${
              currentIndex === i
                ? 'border-black scale-110 shadow-lg'
                : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            <img
              src={getOptimizedImageUrl(imgData.url, 'thumbnail')}
              className="w-full h-full object-contain"
              alt={`Miniatura ${i + 1}`}
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
