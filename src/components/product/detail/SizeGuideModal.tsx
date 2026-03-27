/// Size Guide Modal
/// Full-screen modal for size guide image with pinch-to-zoom and zoom toggle

import React, { useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../utils/image';

interface SizeGuideModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, imageUrl, onClose }: SizeGuideModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleClose = useCallback(() => {
    setIsZoomed(false);
    onClose();
  }, [onClose]);

  const toggleZoom = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(prev => !prev);
  }, []);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center animate-in fade-in duration-300"
      onClick={handleClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={toggleZoom}
          className="p-2 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
          title={isZoomed ? 'Reduzir' : 'Ampliar'}
        >
          {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </button>
        <button
          onClick={handleClose}
          className="p-2 bg-black/70 text-white rounded-full hover:rotate-90 hover:bg-black transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable container — allows native pinch-to-zoom on mobile */}
      <div
        className="w-full h-full overflow-auto"
        style={{ touchAction: 'pinch-zoom' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={getOptimizedImageUrl(imageUrl, 'xlarge')}
          className={isZoomed
            ? 'block mx-auto min-w-[200%] md:min-w-[150%] cursor-zoom-out'
            : 'block mx-auto w-full max-w-3xl max-h-screen object-contain cursor-zoom-in p-4'
          }
          alt="Guia de Tamanhos"
          loading="lazy"
          decoding="async"
          onClick={toggleZoom}
        />
      </div>
    </div>
  );
}
