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
 * Hotspot dot with label that appears on product images
 * Shows product name and inclusion status
 */
export function HotspotDot({ x, y, onClick, isActive = false, productName, label }: HotspotDotProps) {
  // Determine label position based on x coordinate
  const labelOnRight = x < 50;

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
      className={`absolute z-10 group cursor-pointer flex items-center ${
        labelOnRight ? 'flex-row' : 'flex-row-reverse'
      } ${isActive ? 'z-20' : ''}`}
      aria-label={productName ? `Ver ${productName}` : 'Ver produto relacionado'}
    >
      {/* Dot with connector line */}
      <div className="relative flex items-center">
        {/* Connector line */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-px bg-neutral-400 ${
            labelOnRight ? 'left-full' : 'right-full'
          }`}
        />

        {/* Main dot */}
        <div className={`relative w-4 h-4 rounded-full shadow-md transition-all duration-200 ${
          isActive
            ? 'bg-neutral-800 border-2 border-white scale-110'
            : 'bg-white border-2 border-neutral-500 group-hover:border-neutral-800 group-hover:scale-110'
        }`}>
          {/* Inner dot */}
          <div className={`absolute inset-0 m-auto w-1.5 h-1.5 rounded-full transition-colors ${
            isActive ? 'bg-white' : 'bg-neutral-600 group-hover:bg-neutral-800'
          }`} />
        </div>
      </div>

      {/* Label pill */}
      {productName && (
        <div
          className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-lg px-3 py-1.5 ${
            labelOnRight ? 'ml-5' : 'mr-5'
          } ${isActive ? 'ring-2 ring-neutral-800' : ''}`}
        >
          <p className="text-[11px] font-bold text-neutral-900 leading-tight whitespace-nowrap">
            {productName}
          </p>
          {label && (
            <p className="text-[9px] text-neutral-500 leading-tight whitespace-nowrap">
              {label}
            </p>
          )}
        </div>
      )}
    </button>
  );
}
