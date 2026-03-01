/**
 * Before/After Slider Component
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn } from 'lucide-react';
import type { BeforeAfterSliderProps } from './types';

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  onImageClick,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateSliderPosition = useCallback((clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updateSliderPosition(e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging.current) {
        updateSliderPosition(e.clientY);
      }
    },
    [updateSliderPosition]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    updateSliderPosition(e.touches[0].clientY);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging.current) {
        updateSliderPosition(e.touches[0].clientY);
      }
    },
    [updateSliderPosition]
  );

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-2xl cursor-pointer select-none"
      onClick={onImageClick}
    >
      {/* Before Image (bottom layer) */}
      <img
        src={beforeImage}
        alt="Antes"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* After Image (top layer with clip) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 ${100 - sliderPosition}% 0)` }}
      >
        <img
          src={afterImage}
          alt="Depois"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute left-0 right-0 h-1 bg-white shadow-lg cursor-ns-resize"
        style={{ top: `${sliderPosition}%`, transform: 'translateY(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-neutral-400 rounded-full" />
            <div className="w-4 h-0.5 bg-neutral-400 rounded-full" />
            <div className="w-4 h-0.5 bg-neutral-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
        Depois
      </div>
      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 text-white backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
        Antes
      </div>

      {/* Zoom hint */}
      <div className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full">
        <ZoomIn className="w-4 h-4 text-neutral-600" />
      </div>
    </div>
  );
};
