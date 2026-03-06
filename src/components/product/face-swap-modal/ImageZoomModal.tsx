/**
 * Image Zoom Modal Component
 */
import React from 'react';
import { X } from 'lucide-react';
import type { ImageZoomModalProps } from './types';

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      <img
        src={imageSrc}
        alt="Zoom"
        className="max-w-[95vw] max-h-[95vh] object-contain"
        onClick={(e) => e.stopPropagation()}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};
