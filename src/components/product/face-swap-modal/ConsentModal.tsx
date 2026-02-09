/**
 * Consent Modal Component
 */
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ConsentModalProps } from './types';

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onDecline} />
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Aviso Importante
          </h3>
        </div>

        <div className="space-y-3 text-xs text-neutral-600">
          <p className="font-medium">Ao usar o Provador Virtual:</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-neutral-900 font-bold">•</span>
              <span>
                Envie <strong>apenas fotos suas</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-900 font-bold">•</span>
              <span>
                Fotos de terceiros são <strong>proibidas</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-900 font-bold">•</span>
              <span>
                <strong>Não armazenamos</strong> suas fotos
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-900 font-bold">•</span>
              <span>
                Imagens são processadas e{' '}
                <strong>descartadas imediatamente</strong>
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onAccept}
            className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-all"
          >
            Entendi e Concordo
          </button>
          <button
            onClick={onDecline}
            className="w-full py-3 text-neutral-500 text-xs hover:text-neutral-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
