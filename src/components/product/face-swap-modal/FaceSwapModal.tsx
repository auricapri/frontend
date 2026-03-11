/**
 * FaceSwap Modal - Main Component
 *
 * Virtual try-on feature that allows users to see how products look on them.
 */
import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Camera,
  Upload,
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { faceSwapApi } from '../../../api/face-swap.api';
import { feedbackApi } from '../../../api/feedback.api';
import { createGetLoc } from '../../../utils/localization';
import { getOptimizedImageUrl } from '../../../utils/image';
import { ConsentModal } from './ConsentModal';
import { ImageZoomModal } from './ImageZoomModal';
import { FeedbackModal } from './FeedbackModal';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { readFileAsBase64, validateImageFile } from './file-utils';
import { CONSENT_KEY, type FaceSwapModalProps, type RatingValue } from './types';

export const FaceSwapModal: React.FC<FaceSwapModalProps> = ({
  isOpen,
  onClose,
  variant,
  productName,
  productImage,
  userId,
  locale,
}) => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [pendingInputRef, setPendingInputRef] =
    useState<React.RefObject<HTMLInputElement | null> | null>(null);

  // Feedback states
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getLoc = createGetLoc(locale);

  const queryClient = useQueryClient();

  const { data: hasFeedback = false } = useQuery<boolean>({
    queryKey: ['feedback', 'virtual_try_on', userId],
    queryFn: () => feedbackApi.hasFeedback('virtual_try_on'),
    enabled: isOpen && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const hasConsent = () => localStorage.getItem(CONSENT_KEY) === 'true';

  const handleUploadClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (!hasConsent()) {
      setPendingInputRef(inputRef);
      setShowConsent(true);
    } else {
      inputRef.current?.click();
    }
  };

  const handleConsentAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setShowConsent(false);
    pendingInputRef?.current?.click();
    setPendingInputRef(null);
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
    setPendingInputRef(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setUserImage(base64);
      setResultImage(null);
      setError(null);
    } catch {
      setError('Erro ao processar a imagem');
    }
  };

  const handleProcess = async () => {
    if (!userImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await faceSwapApi.process({
        user_id: userId,
        variant_id: variant.id,
        user_image: userImage,
      });

      if (response.status === 'success' && response.image) {
        setResultImage(response.image);
      } else {
        setError(response.error || 'Erro ao processar face swap');
      }
    } catch {
      setError('Serviço indisponível. Tente novamente mais tarde.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;

    const link = document.createElement('a');

    // Check if resultImage is a URL or base64 data
    if (resultImage.startsWith('http')) {
      // For URLs, fetch the image and convert to blob for download
      try {
        const response = await fetch(resultImage);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      } catch {
        // Fallback: open URL in new tab if fetch fails
        window.open(resultImage, '_blank');
        return;
      }
    } else {
      link.href = `data:image/jpeg;base64,${resultImage}`;
    }

    link.download = `auricapri-look-${Date.now()}.jpg`;
    link.click();
  };

  const handleReset = () => {
    setUserImage(null);
    setResultImage(null);
    setError(null);
  };

  const handleFeedbackSubmit = async (rating: RatingValue, comment: string) => {
    setFeedbackSubmitting(true);
    try {
      const result = await feedbackApi.createFeedback({
        feedback_type: 'virtual_try_on',
        rating,
        comment: comment || undefined,
        metadata: {
          variant_id: variant.id,
          product_name: getLoc(productName),
        },
      });
      if (result.success) {
        queryClient.setQueryData(['feedback', 'virtual_try_on', userId], true);
        setShowFeedback(false);
      }
    } catch {
      // Feedback errors are non-critical — silently ignored
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleClose = () => {
    if (resultImage && !hasFeedback && userId) {
      setShowFeedback(true);
      return;
    }
    handleReset();
    onClose();
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
    handleReset();
    onClose();
  };

  const getZoomImageSrc = () => {
    if (resultImage) {
      // Check if resultImage is already a URL or base64 data
      return resultImage.startsWith('http') ? resultImage : `data:image/jpeg;base64,${resultImage}`;
    }
    return productImage;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[201]">
        <div
          className="bg-paper md:rounded-3xl shadow-2xl overflow-hidden w-full h-[100dvh] md:h-[85vh] md:max-h-[700px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Provador Virtual
                </h2>
                <p className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                  {getLoc(productName)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Area */}
          <div className="flex-1 min-h-0 p-3">
            <div className="relative w-full h-full bg-neutral-100 rounded-2xl overflow-hidden">
              {resultImage ? (
                <BeforeAfterSlider
                  beforeImage={productImage}
                  afterImage={resultImage.startsWith('http') ? resultImage : `data:image/jpeg;base64,${resultImage}`}
                  onImageClick={() => setShowZoom(true)}
                />
              ) : (
                <div
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => setShowZoom(true)}
                >
                  <img
                    src={getOptimizedImageUrl(productImage, 'large')}
                    alt={getLoc(productName)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 right-3 p-2 bg-paper/90 backdrop-blur-sm rounded-full">
                    <ZoomIn className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
              )}

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl">
                  <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                  <p className="text-white text-sm font-bold">Processando...</p>
                  <p className="text-white/70 text-[10px]">~3 segundos</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-3 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl flex-shrink-0">
              <p className="text-red-600 text-[10px] font-medium">{error}</p>
            </div>
          )}

          {/* User Image Preview */}
          {userImage && !resultImage && (
            <div className="mx-3 mb-2 flex items-center gap-3 p-2 bg-neutral-50 rounded-xl flex-shrink-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 flex-shrink-0">
                <img
                  src={`data:image/jpeg;base64,${userImage}`}
                  alt="Sua foto"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold">Sua foto</p>
                <p className="text-[10px] text-neutral-400">
                  Pronta para processar
                </p>
              </div>
              <button
                onClick={handleReset}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 border-t border-neutral-100 space-y-2 flex-shrink-0 bg-paper">
            {/* Upload Buttons */}
            {!resultImage && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUploadClick(cameraInputRef)}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-neutral-300 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-neutral-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    Câmera
                  </span>
                </button>
                <button
                  onClick={() => handleUploadClick(fileInputRef)}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-neutral-300 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    Arquivo
                  </span>
                </button>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Action Buttons */}
            {!resultImage ? (
              <button
                onClick={handleProcess}
                disabled={!userImage || isProcessing}
                className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Experimentar Agora
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReset}
                  className="py-3 border-2 border-neutral-200 text-neutral-700 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:border-neutral-900 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Nova Foto
                </button>
                <button
                  onClick={handleDownload}
                  className="py-3 bg-neutral-900 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Salvar
                </button>
              </div>
            )}

            <p className="text-[10px] text-neutral-400 text-center">
              {resultImage
                ? 'Arraste a linha para comparar antes e depois'
                : 'Processamento por IA • Suas fotos não são armazenadas'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <ConsentModal
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />

      <ImageZoomModal
        isOpen={showZoom}
        imageSrc={getZoomImageSrc()}
        onClose={() => setShowZoom(false)}
      />

      <FeedbackModal
        isOpen={showFeedback}
        onClose={handleCloseFeedback}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={feedbackSubmitting}
      />
    </>
  );
};
