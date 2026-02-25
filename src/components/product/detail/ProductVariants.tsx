/// Product Variants
/// Color and size selection with size guide and provador buttons

import React from 'react';
import { Ruler, Shirt } from 'lucide-react';
import type { LocalizedText } from '../../../types';

interface ProductVariantsProps {
  getLoc: (obj: any) => string;
  colors: Array<{ hex: string; name: LocalizedText | string; image?: string }>;
  selectedColorHex: string;
  onSelectColor: (hex: string) => void;
  activeColorName?: any;
  sizes: Array<string | undefined>;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  activeSizeGuideImage: string | null;
  onOpenSizeGuide: () => void;
  isSelectedSizeAvailable: boolean;
  showProvador?: boolean;
  onOpenProvador?: () => void;
}

export function ProductVariants({
  getLoc,
  colors,
  selectedColorHex,
  onSelectColor,
  activeColorName,
  sizes,
  selectedSize,
  onSelectSize,
  activeSizeGuideImage,
  onOpenSizeGuide,
  isSelectedSizeAvailable,
  showProvador,
  onOpenProvador,
}: ProductVariantsProps) {
  return (
    <div className="space-y-6 mb-6">
      {colors.length > 0 && (
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-400">
            Paleta — {getLoc(activeColorName)}
          </label>
          <div className="flex overflow-x-auto no-scrollbar gap-3 py-2">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => onSelectColor(c.hex)}
                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 p-1 transition-all duration-500 ${
                  selectedColorHex === c.hex
                    ? 'border-black scale-110 shadow-lg'
                    : 'border-transparent hover:scale-105'
                }`}
              >
                <div
                  className="w-full h-full rounded-full shadow-inner border border-neutral-100"
                  style={
                    c.image
                      ? { backgroundImage: `url(${c.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { backgroundColor: c.hex }
                  }
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-400">
              Medidas
            </label>
            <div className="flex items-center gap-4">
              {showProvador && onOpenProvador && (
                <button
                  onClick={onOpenProvador}
                  className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-neutral-900 border-b border-black pb-0.5 hover:opacity-50 transition-opacity"
                >
                  <Shirt className="w-3 h-3" /> Provador
                </button>
              )}
              {activeSizeGuideImage && (
                <button
                  onClick={onOpenSizeGuide}
                  className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-neutral-900 border-b border-black pb-0.5 hover:opacity-50 transition-opacity"
                >
                  <Ruler className="w-3 h-3" /> Guia de Tamanhos
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const isSelected = selectedSize === s;

              return (
                <button
                  key={s || 'unknown'}
                  onClick={() => onSelectSize(s || '')}
                  className={`min-w-[60px] px-5 py-3 text-[11px] font-black border transition-all duration-500 rounded-xl uppercase tracking-widest ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-xl'
                      : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-black'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {selectedSize && !isSelectedSizeAvailable && (
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-2">
              Tamanho {selectedSize} não disponível para esta cor. Selecione outro tamanho.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
