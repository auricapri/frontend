import React, { useState, useRef } from 'react';
import { Star, X, Upload, Loader2 } from 'lucide-react';
import { ProductReview, ProductReviewMedia, OrderItemForReview } from '../../types';
import { ProductReviewsApi } from '../../api/product-reviews.api';
import { supabase } from '../../utils/supabase';
import { getOptimizedImageUrl } from '../../utils/image';

interface ProductReviewFormProps {
  orderId: string;
  orderItem: OrderItemForReview;
  existingReview?: ProductReview | null;
  onSuccess: (review: ProductReview) => void;
  onCancel: () => void;
}

export const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
  orderId,
  orderItem,
  existingReview,
  onSuccess,
  onCancel
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<ProductReviewMedia[]>(existingReview?.media || []);
  const [mediaToRemove, setMediaToRemove] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

  const getLoc = (obj: unknown): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      const rec = obj as Record<string, unknown>;
      const candidate = rec.pt ?? rec.en ?? Object.values(rec).find((v) => typeof v === 'string');
      return typeof candidate === 'string' ? candidate : "";
    }
    return "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const validFiles: File[] = [];

    let totalSize = mediaFiles.reduce((acc, f) => acc + f.size, 0);

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`Arquivo ${file.name} excede o tamanho máximo de 10MB`);
        continue;
      }

      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        alert(`Tamanho total excede o máximo de 50MB`);
        break;
      }

      validFiles.push(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          setMediaPreviews(prev => [...prev, preview]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const preview = URL.createObjectURL(file);
        setMediaPreviews(prev => [...prev, preview]);
      }
    }

    setMediaFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviews];
    const removedPreview = newPreviews[index];
    if (removedPreview && removedPreview.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview);
    }
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const removeExistingMedia = (mediaId: string) => {
    setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
    setMediaToRemove(prev => [...prev, mediaId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    setIsSubmitting(true);
    const api = new ProductReviewsApi();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let review: ProductReview;

      if (existingReview) {
        review = await api.update(existingReview.id, {
          rating,
          comment: comment || undefined,
          media: mediaFiles.length > 0 ? mediaFiles : undefined,
          remove_media_ids: mediaToRemove.length > 0 ? mediaToRemove : undefined
        });
      } else {
        const createData: Parameters<typeof api.create>[0] = {
          order_id: orderId,
          order_item_id: orderItem.order_item_id,
          product_id: orderItem.product_id,
          variant_id: orderItem.variant_id,
          rating,
          comment: comment || undefined,
          variant_size: orderItem.variant_size,
          variant_color: getLoc(orderItem.variant_color),
          media: mediaFiles.length > 0 ? mediaFiles : undefined
        };

        if (!userId) {
          const { OrdersApi } = await import('../../api/orders.api');
          const ordersApi = new OrdersApi();
          const order = await ordersApi.getByIdForReview(orderId);
          if (order?.user_id) {
            createData.user_id = order.user_id;
          }
        }

        review = await api.create(createData);
      }

      mediaPreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });

      onSuccess(review);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar avaliação';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <img
          src={getOptimizedImageUrl(orderItem.image, 'thumbnail')}
          alt={getLoc(orderItem.product_name)}
          className="w-16 h-16 object-cover rounded-lg"
          loading="lazy"
        />
        <div className="flex-1">
          <h4 className="font-serif font-medium text-sm">{getLoc(orderItem.product_name)}</h4>
          <p className="text-xs text-neutral-500">
            {getLoc(orderItem.variant_color)} | {orderItem.variant_size}
          </p>
          <p className="text-xs text-neutral-400">Qtd: {orderItem.quantity}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Avaliação</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'fill-blue-500 text-blue-500'
                    : 'text-neutral-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Comentário</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Compartilhe sua experiência..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Fotos e Vídeos</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {existingMedia.map((media) => (
              <div key={media.id} className="relative">
                {media.media_type === 'image' ? (
                  <img
                    src={media.media_url}
                    alt="Review media"
                    className="w-24 h-24 object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <video
                    src={media.media_url}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeExistingMedia(media.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {mediaPreviews.map((preview, index) => (
              <div key={index} className="relative">
                {mediaFiles[index]?.type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <video
                    src={preview}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-lg hover:border-black transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">Adicionar fotos/vídeos</span>
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar avaliação'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
