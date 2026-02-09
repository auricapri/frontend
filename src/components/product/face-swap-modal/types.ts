/**
 * FaceSwap Modal Types
 */
import { ProductVariant, LocalizedText } from '../../../types';
import { Locale } from '../../../i18n';

export interface FaceSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: ProductVariant;
  productName: LocalizedText;
  productImage: string;
  userId: string;
  locale: Locale;
}

export interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export interface ImageZoomModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
}

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, comment: string) => Promise<void>;
  isSubmitting: boolean;
}

export interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  onImageClick: () => void;
}

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface RatingEmoji {
  value: RatingValue;
  emoji: string;
  label: string;
}

export const RATING_EMOJIS: readonly RatingEmoji[] = [
  { value: 1, emoji: '😞', label: 'Péssimo' },
  { value: 2, emoji: '😕', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Regular' },
  { value: 4, emoji: '😊', label: 'Bom' },
  { value: 5, emoji: '😍', label: 'Excelente' },
] as const;

export const CONSENT_KEY = 'faceswap_consent_accepted';
