/**
 * YouTube Modal Component
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { YouTubeModalProps } from '../types';

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setYoutubeUrl('');
    onClose();
  };

  const handleInsert = () => {
    if (youtubeUrl) {
      onInsert(youtubeUrl);
      setYoutubeUrl('');
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
          <h3 className="text-lg font-bold">Inserir Vídeo YouTube</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Cole o link do vídeo do YouTube (ex: https://www.youtube.com/watch?v=...)
        </p>
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full p-3 border border-neutral-200 rounded-xl mb-4 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
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
            onClick={handleInsert}
            disabled={!youtubeUrl}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Inserir
          </button>
        </div>
      </div>
    </div>
  );
};
