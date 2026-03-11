/**
 * Image Modal Component
 */
import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import type { ImageModalProps } from '../types';

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  onInsertFromUrl,
  onUpload,
  isUploading,
  uploadError,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setImageUrl('');
    onClose();
  };

  const handleInsertFromUrl = () => {
    if (imageUrl) {
      onInsertFromUrl(imageUrl);
      setImageUrl('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      onClick={handleClose}
    >
      <div
        className="bg-paper rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Inserir Imagem</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'url'
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline-block mr-2" />
            URL
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full p-8 border-2 border-dashed border-neutral-300 rounded-xl hover:border-black hover:bg-neutral-50 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  <span className="text-sm text-neutral-500">Enviando imagem...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-neutral-400" />
                  <span className="text-sm text-neutral-500">
                    Clique para selecionar uma imagem
                  </span>
                  <span className="text-xs text-neutral-400">
                    JPG, PNG, GIF, WebP (max 10MB)
                  </span>
                </>
              )}
            </button>
            {uploadError && (
              <p className="text-red-500 text-sm text-center">{uploadError}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full p-3 border border-neutral-200 rounded-xl focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertFromUrl}
                disabled={!imageUrl}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Inserir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
