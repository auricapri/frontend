import React, { useState } from 'react';

// Logo do public folder - Vite serve arquivos do public na raiz
const logoImg = '/logo.png';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message = 'Aguarde...',
  subMessage
}) => {
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop escuro */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Conteúdo do modal */}
      <div className="relative flex flex-col items-center justify-center p-8">
        <style>
          {`
            @keyframes logo-pulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.5;
                transform: scale(0.95);
              }
            }

            @keyframes logo-shimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }

            .loading-logo-pulse {
              animation: logo-pulse 1.5s ease-in-out infinite;
            }

            .loading-shimmer-text {
              background: linear-gradient(
                90deg,
                rgba(255,255,255,0.4) 0%,
                rgba(255,255,255,1) 50%,
                rgba(255,255,255,0.4) 100%
              );
              background-size: 200% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: logo-shimmer 2s linear infinite;
            }
          `}
        </style>

        {/* Logo com pulse - com fallback para texto */}
        <div className="loading-logo-pulse">
          {!imageError ? (
            <img
              src={logoImg}
              alt="Auricapri"
              className="w-24 h-24 object-contain filter brightness-0 invert"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-2xl font-light text-white tracking-[0.3em] uppercase">
              AURICAPRI
            </span>
          )}
        </div>

        {/* Mensagem principal */}
        {message && (
          <p className="mt-6 text-sm text-white/90 font-medium tracking-[0.1em] uppercase loading-shimmer-text">
            {message}
          </p>
        )}

        {/* Sub-mensagem */}
        {subMessage && (
          <p className="mt-2 text-xs text-white/60 font-light tracking-wider">
            {subMessage}
          </p>
        )}

        {/* Indicador de pontos animados */}
        <div className="mt-4 flex gap-1.5">
          <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
