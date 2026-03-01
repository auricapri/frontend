/**
 * Feedback Modal Component
 */
import React, { useState } from 'react';
import { X, Star, Loader2, Send } from 'lucide-react';
import { RATING_EMOJIS, type FeedbackModalProps, type RatingValue } from './types';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [rating, setRating] = useState<RatingValue | null>(null);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating) return;
    await onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Sua Opinião
              </h3>
              <p className="text-xs text-neutral-500">Ajude-nos a melhorar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rating Emojis */}
        <div>
          <p className="text-xs font-bold text-neutral-600 mb-3">
            Como foi sua experiência com o Provador Virtual?
          </p>
          <div className="flex justify-between gap-2">
            {RATING_EMOJIS.map((item) => (
              <button
                key={item.value}
                onClick={() => setRating(item.value)}
                onMouseEnter={() => setHoveredRating(item.value)}
                onMouseLeave={() => setHoveredRating(null)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  rating === item.value
                    ? 'bg-neutral-900 scale-105 shadow-lg'
                    : 'bg-neutral-50 hover:bg-neutral-100'
                }`}
              >
                <span
                  className={`text-2xl transition-transform ${
                    rating === item.value || hoveredRating === item.value
                      ? 'scale-125'
                      : ''
                  }`}
                >
                  {item.emoji}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    rating === item.value ? 'text-white' : 'text-neutral-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs font-bold text-neutral-600 block mb-2">
            Conte-nos mais (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que podemos melhorar? O que você gostou?"
            rows={3}
            className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-neutral-400 transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!rating || isSubmitting}
          className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Feedback
            </>
          )}
        </button>

        <p className="text-[10px] text-neutral-400 text-center">
          Seu feedback é anônimo e nos ajuda a melhorar a experiência
        </p>
      </div>
    </div>
  );
};
