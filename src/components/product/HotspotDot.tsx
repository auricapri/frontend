import React from 'react';

interface HotspotDotProps {
  x: number;
  y: number;
  onClick: () => void;
  isActive?: boolean;
}

/**
 * Pulsing hotspot dot that appears on product images
 */
export function HotspotDot({ x, y, onClick, isActive = false }: HotspotDotProps) {
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
      className={`absolute z-10 group cursor-pointer ${isActive ? 'scale-125' : ''}`}
      aria-label="Ver produto relacionado"
    >
      {/* Outer pulse ring */}
      <div className="absolute inset-0 w-6 h-6 -m-1.5 bg-white/30 rounded-full animate-ping" />

      {/* Main dot */}
      <div className={`relative w-5 h-5 rounded-full shadow-lg transition-all duration-300 ${
        isActive
          ? 'bg-black'
          : 'bg-white border-2 border-black group-hover:bg-black group-hover:scale-110'
      }`}>
        {/* Inner dot */}
        <div className={`absolute inset-0 m-auto w-2 h-2 rounded-full transition-colors ${
          isActive ? 'bg-white' : 'bg-black group-hover:bg-white'
        }`} />
      </div>

      {/* Plus icon on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-[10px] font-bold">+</span>
      </div>
    </button>
  );
}
