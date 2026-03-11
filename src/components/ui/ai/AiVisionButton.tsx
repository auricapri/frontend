/**
 * AiVisionButton - Generate description from product image using Vision API
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Loader2, X, Check, RefreshCw, Copy } from 'lucide-react';
import { useAiPersonal } from '../../../hooks/useAiPersonal';

export interface AiVisionButtonProps {
  /** Image URL to analyze */
  imageUrl?: string;
  /** Callback when user accepts generated content */
  onAccept: (content: string) => void;
  /** Custom prompt for image analysis */
  prompt?: string;
  /** Button label */
  label?: string;
  /** Button variant */
  variant?: 'default' | 'small' | 'icon';
  /** Disabled state */
  disabled?: boolean;
  /** Class name override */
  className?: string;
}

const statusDisplay: Record<string, string> = {
  thinking: 'Pensando...',
  analyzing_image: 'Analisando imagem...',
  searching: 'Pesquisando...',
};

export const AiVisionButton: React.FC<AiVisionButtonProps> = ({
  imageUrl,
  onAccept,
  prompt,
  label = 'Descrever imagem',
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    text,
    isGenerating,
    currentStatus,
    error,
    generateFromImage,
    abort,
    clear,
  } = useAiPersonal({
    onError: (err) => console.error('Vision API Error:', err),
  });

  const handleGenerate = useCallback(async () => {
    if (!imageUrl) return;
    await generateFromImage(imageUrl, prompt);
  }, [imageUrl, prompt, generateFromImage]);

  const handleAccept = useCallback(() => {
    onAccept(text);
    setIsModalOpen(false);
    clear();
  }, [text, onAccept, clear]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
  }, [text]);

  const handleClose = useCallback(() => {
    if (isGenerating) abort();
    setIsModalOpen(false);
    clear();
  }, [isGenerating, abort, clear]);

  const handleOpen = useCallback(() => {
    if (!imageUrl) {
      alert('Primeiro faça upload de uma imagem');
      return;
    }
    setIsModalOpen(true);
    // Auto-generate when opening
    setTimeout(() => {
      generateFromImage(imageUrl, prompt);
    }, 100);
  }, [imageUrl, prompt, generateFromImage]);

  const baseClasses = {
    default: 'px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200/50 disabled:opacity-50',
    small: 'px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200/50 disabled:opacity-50',
    icon: 'p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200/50 disabled:opacity-50',
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || !imageUrl}
        className={`${baseClasses[variant]} ${className}`}
        title={!imageUrl ? 'Faça upload de uma imagem primeiro' : label}
      >
        <Camera className={variant === 'icon' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {variant !== 'icon' && label}
      </button>

      {/* Modal */}
      {isModalOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
            onClick={handleClose}
          />
          <div className="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-md animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="h-full bg-paper shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-tight">
                    Visão IA
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 bg-white/80 rounded-full hover:bg-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Image Preview */}
                {imageUrl && (
                  <div className="aspect-square bg-neutral-100 rounded-xl overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Status/Loading */}
                {isGenerating && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    <span className="text-sm font-bold text-amber-600">
                      {currentStatus ? statusDisplay[currentStatus] || currentStatus : 'Analisando...'}
                    </span>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                    {error}
                  </div>
                )}

                {/* Generated Content */}
                {text && !isGenerating && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        Descrição Gerada
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCopy}
                          className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all"
                          title="Copiar"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-50"
                          title="Regenerar"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl max-h-[40vh] overflow-y-auto">
                      <div className="prose prose-sm max-w-none text-xs whitespace-pre-wrap">
                        {text}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {text && !isGenerating && (
                <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2 flex-shrink-0">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-white border border-neutral-200 rounded-lg font-bold text-xs hover:bg-neutral-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-4 py-2 bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-neutral-800 transition-all"
                  >
                    <Check className="w-3 h-3" />
                    Usar Descrição
                  </button>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default AiVisionButton;
