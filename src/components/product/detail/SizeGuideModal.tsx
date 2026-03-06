/// Size Guide Modal
/// Full-screen modal for size guide image

import React from 'react';
import { X } from 'lucide-react';
import { getOptimizedImageUrl } from '../../../utils/image';

interface SizeGuideModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function SizeGuideModal({ isOpen, imageUrl, onClose }: SizeGuideModalProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] overflow-hidden max-w-3xl w-full max-h-[90vh] relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black text-white rounded-full z-10 hover:rotate-90 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={getOptimizedImageUrl(imageUrl, 'xlarge')}
          className="w-full h-full object-contain max-h-[90vh]"
          alt="Size Guide"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}
