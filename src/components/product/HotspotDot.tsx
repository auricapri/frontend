import React from 'react';

interface HotspotDotProps {
  x: number;
  y: number;
  onClick: () => void;
  isActive?: boolean;
  productName?: string;
  label?: string;
}

/**
 * Simple hotspot dot that appears on product images
 * Matches flutter_app design - clean circular dot
 */
export function HotspotDot({ x, y, onClick, isActive = false, productName }: HotspotDotProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      className={`absolute z-10 group cursor-pointer ${isActive ? 'z-20' : ''}`}
      aria-label={productName ? `Ver ${productName}` : 'Ver produto relacionado'}
    >
      {/* Simple circular dot */}
      <div className={`relative w-8 h-8 rounded-full shadow-lg transition-all duration-200 ${
        isActive
          ? 'bg-white border-2 border-neutral-800 scale-110'
          : 'bg-white/90 border-2 border-white group-hover:bg-white group-hover:scale-110'
      }`}>
        {/* Inner dot */}
        <div className={`absolute inset-0 m-auto w-2 h-2 rounded-full transition-colors ${
          isActive ? 'bg-neutral-800' : 'bg-neutral-900'
        }`} />
      </div>
    </button>
  );
}
