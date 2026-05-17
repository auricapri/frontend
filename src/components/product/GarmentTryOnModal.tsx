/**
 * GarmentTryOnModal - Customer Virtual Try-On
 *
 * Allows customers to see how garments from the approved gallery look on them.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Camera,
  Upload,
  Loader2,
  Download,
  RefreshCw,
  Sparkles,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  GarmentTransferApi,
  GalleryItem,
} from '../../api/garment-transfer.api';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';

const api = new GarmentTransferApi();
const CONSENT_KEY = 'garment_tryon_consent';

// ============================================================================
// Types
// ============================================================================

export interface GarmentTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGarmentId?: string;
  locale: Locale;
}

// ============================================================================
// Sub-components
// ============================================================================

const ConsentModal: React.FC<{
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ isOpen, onAccept, onDecline }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[300]" onClick={onDecline} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-paper rounded-2xl p-6 w-[90%] max-w-sm z-[301]">
        <h3 className="text-lg font-bold mb-3">Consentimento de Uso</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Para usar o provador virtual, precisamos processar sua foto.
          Sua imagem é usada apenas para gerar o resultado e
          <strong> não é armazenada</strong> em nossos servidores.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-2 border border-neutral-200 rounded-xl text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2 bg-black text-white rounded-xl text-sm font-medium"
          >
            Aceitar
          </button>
        </div>
      </div>
    </>
  );
};

const ImageZoomModal: React.FC<{
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
}> = ({ isOpen, imageSrc, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 z-[300]" onClick={onClose} />
      <div className="fixed inset-4 flex items-center justify-center z-[301]">
        <img
          src={imageSrc}
          alt="Zoom"
          className="max-w-full max-h-full object-contain rounded-xl"
          onClick={onClose}
          loading="lazy"
          decoding="async"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-paper/10 hover:bg-paper/20 rounded-full"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const GarmentTryOnModal: React.FC<GarmentTryOnModalProps> = ({
  isOpen,
  onClose,
  initialGarmentId,
  locale,
}) => {
  // Try-on state
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showConsent, setShowConsent] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [pendingInputRef, setPendingInputRef] =
    useState<React.RefObject<HTMLInputElement | null> | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const _getLoc = createGetLoc(locale);

  const { data: galleryItems = [], isLoading: isLoadingGallery } = useQuery<GalleryItem[]>({
    queryKey: ['garment-gallery'],
    queryFn: async () => {
      const data = await api.listGallery(1, 50);
      return data.items;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Set default selected item when gallery loads
  useEffect(() => {
    if (!isOpen || galleryItems.length === 0 || selectedItem) return;
    if (initialGarmentId) {
      const match = galleryItems.find((i) => i.garment.id === initialGarmentId);
      setSelectedItem(match ?? galleryItems[0] ?? null);
    } else {
      setSelectedItem(galleryItems[0] ?? null);
    }
  }, [isOpen, galleryItems, initialGarmentId, selectedItem]);


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

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 10MB');
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
    if (!userImage || !selectedItem) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Use the garment transfer try-on endpoint
      const response = await fetch('/api/garment-transfer/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garment_id: selectedItem.garment.id,
          user_image: userImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar');
      }

      const data = await response.json();

      if (data.status === 'completed' && data.result_url) {
        setResultImage(data.result_url);
      } else if (data.job_id) {
        // Poll for completion
        const checkStatus = async (jobId: string, attempts = 0): Promise<void> => {
          if (attempts > 60) {
            throw new Error('Tempo limite excedido');
          }

          const statusRes = await fetch(`/api/garment-transfer/try-on/status?job_id=${jobId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'completed') {
            setResultImage(statusData.result_url);
            return;
          }

          if (statusData.status === 'failed') {
            throw new Error(statusData.error || 'Falha no processamento');
          }

          await new Promise(r => setTimeout(r, 2000));
          return checkStatus(jobId, attempts + 1);
        };

        await checkStatus(data.job_id);
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;

    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auricapri-tryon-${Date.now()}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(resultImage, '_blank');
    }
  };

  const handleReset = () => {
    setUserImage(null);
    setResultImage(null);
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (!selectedItem || galleryItems.length <= 1) return;

    const currentIndex = galleryItems.findIndex(i => i.id === selectedItem.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex <= 0 ? galleryItems.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= galleryItems.length - 1 ? 0 : currentIndex + 1;
    }

    setSelectedItem(galleryItems[newIndex]);
    setResultImage(null);
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
      <div className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-[201]">
        <div
          className="bg-paper md:rounded-3xl shadow-2xl overflow-hidden w-full h-[100dvh] md:h-[90vh] md:max-h-[750px] flex flex-col"
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
                <p className="text-[10px] text-neutral-400">
                  Experimente as roupas em você
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

          {isLoadingGallery ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : galleryItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-neutral-500">
                  Nenhuma peça disponível no momento.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Image Area */}
              <div className="flex-1 min-h-0 p-3 relative">
                <div className="relative w-full h-full bg-neutral-100 rounded-2xl overflow-hidden">
                  {resultImage ? (
                    <div
                      className="relative w-full h-full cursor-pointer"
                      onClick={() => setShowZoom(true)}
                    >
                      <img
                        src={resultImage}
                        alt="Resultado"
                        className="w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-3 right-3 p-2 bg-paper/90 backdrop-blur-sm rounded-full">
                        <ZoomIn className="w-4 h-4 text-neutral-600" />
                      </div>
                    </div>
                  ) : selectedItem ? (
                    <div
                      className="relative w-full h-full cursor-pointer"
                      onClick={() => setShowZoom(true)}
                    >
                      <img
                        src={selectedItem.result_url}
                        alt={selectedItem.garment.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-3 right-3 p-2 bg-paper/90 backdrop-blur-sm rounded-full">
                        <ZoomIn className="w-4 h-4 text-neutral-600" />
                      </div>
                      {/* Garment name overlay */}
                      <div className="absolute bottom-3 left-3 right-3 bg-paper/90 backdrop-blur-sm rounded-xl px-3 py-2">
                        <p className="text-xs font-bold truncate">
                          {selectedItem.garment.name}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Gallery Navigation */}
                  {galleryItems.length > 1 && !resultImage && (
                    <>
                      <button
                        onClick={() => navigateGallery('prev')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-paper/90 hover:bg-paper rounded-full shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigateGallery('next')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-paper/90 hover:bg-paper rounded-full shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Processing Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-2xl">
                      <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                      <p className="text-white text-sm font-bold">Processando...</p>
                      <p className="text-white/70 text-[10px]">Pode levar até 30 segundos</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {!resultImage && galleryItems.length > 1 && (
                <div className="px-3 pb-2 flex-shrink-0">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {galleryItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedItem?.id === item.id
                            ? 'border-black'
                            : 'border-transparent hover:border-neutral-300'
                        }`}
                      >
                        <img
                          src={item.result_url}
                          alt={item.garment.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    onClick={() => setUserImage(null)}
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
                    disabled={!userImage || !selectedItem || isProcessing}
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
                        Experimentar
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
                  Processamento por IA - Suas fotos nao sao armazenadas
                </p>
              </div>
            </>
          )}
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
        imageSrc={resultImage || selectedItem?.result_url || ''}
        onClose={() => setShowZoom(false)}
      />
    </>
  );
};

export default GarmentTryOnModal;
