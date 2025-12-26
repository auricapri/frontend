
import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare, Loader2, User } from 'lucide-react';
import { Review, UserProfile } from '../../types';
import { Locale } from '../../i18n';

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  user: UserProfile | null;
  t: (key: string) => any;
  onAddReview: (review: Partial<Review>) => Promise<void>;
  isLoading?: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, reviews, user, t, onAddReview, isLoading }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await onAddReview({
        product_id: productId,
        user_id: user.id,
        user_name: user.full_name,
        rating,
        comment,
        is_verified_purchase: true, // In this flow, we assume verification
      });
      setIsWriting(false);
      setComment('');
      setRating(5);
    } catch (err) {
      alert('Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-neutral-100 pb-12">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-300">{t('product.reviews')}</h3>
          <div className="flex items-center gap-6">
            <span className="text-6xl font-light tracking-tighter">{averageRating.toFixed(1)}</span>
            <div className="space-y-1">
              <div className="flex text-black">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-current' : 'text-neutral-100'}`} />
                ))}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{reviews.length} total evaluations</p>
            </div>
          </div>
        </div>

        {user && !isWriting && (
          <button 
            onClick={() => setIsWriting(true)}
            className="px-10 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl active:scale-95"
          >
            {t('product.writeReview')}
          </button>
        )}
      </div>

      {isWriting && (
        <div className="bg-neutral-50 p-10 rounded-[3rem] border border-neutral-100 animate-in fade-in slide-in-from-top-4 duration-500">
           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                 <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4">{t('product.rating')}</label>
                 <div className="flex gap-4 px-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        type="button" 
                        onClick={() => setRating(star)}
                        className={`transition-transform hover:scale-125 active:scale-90 ${rating >= star ? 'text-black' : 'text-neutral-200'}`}
                      >
                         <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4">{t('product.comment')}</label>
                 <textarea 
                   className="w-full p-8 bg-white border border-neutral-100 rounded-[2.5rem] text-sm font-medium min-h-[150px] outline-none focus:border-black transition-all"
                   placeholder="Share your experience with this piece..."
                   value={comment}
                   onChange={e => setComment(e.target.value)}
                   required
                 />
              </div>

              <div className="flex gap-4">
                 <button 
                   type="button" 
                   onClick={() => setIsWriting(false)}
                   className="px-10 py-6 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                 >
                    Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="flex-1 py-6 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                 >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{t('product.submitReview')}</span>}
                 </button>
              </div>
           </form>
        </div>
      )}

      <div className="space-y-12">
        {reviews.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-200 space-y-6">
             <MessageSquare className="w-12 h-12 stroke-1" />
             <p className="text-xs font-black uppercase tracking-[0.3em]">{t('product.noReviews')}</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <div key={review.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
               <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                  <div className="w-full md:w-64 flex-none space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100">
                           <User className="w-5 h-5 text-neutral-300" />
                        </div>
                        <div>
                           <h4 className="text-[11px] font-black uppercase tracking-tight italic">{review.user_name}</h4>
                           <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                     {review.is_verified_purchase && (
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">{t('product.verified')}</span>
                       </div>
                     )}
                  </div>
                  <div className="flex-1 space-y-6">
                     <div className="flex text-black">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-neutral-100'}`} />
                        ))}
                     </div>
                     <p className="text-sm font-medium text-neutral-600 leading-relaxed max-w-2xl">
                        {review.comment}
                     </p>
                  </div>
               </div>
               {idx < reviews.length - 1 && <div className="h-[1px] w-full bg-neutral-50 mt-12" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
