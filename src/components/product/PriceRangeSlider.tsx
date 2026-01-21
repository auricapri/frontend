import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number | null;
  valueMax: number | null;
  onChange: (min: number | null, max: number | null) => void;
  locale: Locale;
}

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  locale
}) => {
  const [localMin, setLocalMin] = useState<number>(valueMin ?? min);
  const [localMax, setLocalMax] = useState<number>(valueMax ?? max);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMin(valueMin ?? min);
    setLocalMax(valueMax ?? max);
  }, [valueMin, valueMax, min, max]);

  const getPercentage = useCallback((value: number) => {
    return ((value - min) / (max - min)) * 100;
  }, [min, max]);

  const getValueFromPercentage = useCallback((percentage: number) => {
    return min + (percentage / 100) * (max - min);
  }, [min, max]);

  const handleMouseDown = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  const handleTouchStart = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  const updateValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = Math.round(getValueFromPercentage(percentage) / 10) * 10;

    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(value, localMax - 10));
      setLocalMin(newMin);
      onChange(newMin === min ? null : newMin, valueMax);
    } else if (isDragging === 'max') {
      const newMax = Math.min(max, Math.max(value, localMin + 10));
      setLocalMax(newMax);
      onChange(valueMin, newMax === max ? null : newMax);
    }
  }, [isDragging, localMin, localMax, min, max, getValueFromPercentage, onChange, valueMin, valueMax]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateValue(e.clientX);
  }, [isDragging, updateValue]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    e.preventDefault();
    updateValue(e.touches[0].clientX);
  }, [isDragging, updateValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const minPercentage = getPercentage(localMin);
  const maxPercentage = getPercentage(localMax);

  return (
    <div className="w-full touch-none select-none">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-400 mb-1">
            {formatCurrency(localMin, locale)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] uppercase tracking-widest font-bold text-neutral-400 mb-1">
            {formatCurrency(localMax, locale)}
          </span>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="relative h-3 bg-neutral-100 rounded-full cursor-pointer touch-none"
        onMouseDown={(e) => {
          if (e.target === sliderRef.current) {
            const rect = sliderRef.current.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            const value = Math.round(getValueFromPercentage(percentage) / 10) * 10;

            const distToMin = Math.abs(value - localMin);
            const distToMax = Math.abs(value - localMax);

            if (distToMin < distToMax) {
              const newMin = Math.max(min, Math.min(value, localMax - 10));
              setLocalMin(newMin);
              onChange(newMin === min ? null : newMin, valueMax);
            } else {
              const newMax = Math.min(max, Math.max(value, localMin + 10));
              setLocalMax(newMax);
              onChange(valueMin, newMax === max ? null : newMax);
            }
          }
        }}
      >
        <div
          className="absolute h-3 bg-neutral-900 rounded-full transition-all top-0"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }}
        />
        
        <button
          type="button"
          className={`absolute w-5 h-5 bg-neutral-900 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all touch-none ${
            isDragging === 'min' ? 'scale-125 z-10' : 'hover:scale-105 active:scale-110'
          }`}
          style={{ left: `${minPercentage}%`, top: '50%' }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown('min');
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTouchStart('min');
          }}
          aria-label="Preço mínimo"
        />

        <button
          type="button"
          className={`absolute w-5 h-5 bg-neutral-900 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all touch-none ${
            isDragging === 'max' ? 'scale-125 z-10' : 'hover:scale-105 active:scale-110'
          }`}
          style={{ left: `${maxPercentage}%`, top: '50%' }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMouseDown('max');
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTouchStart('max');
          }}
          aria-label="Preço máximo"
        />
      </div>
    </div>
  );
};
