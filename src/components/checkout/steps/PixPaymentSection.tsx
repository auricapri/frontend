import { Check, Copy, Loader2, QrCode } from 'lucide-react';
import { PixCountdown } from '../PixCountdown';
import type { PixData } from '../../../types/payment.types';

interface PixPaymentSectionProps {
  pixData: PixData | null;
  pixError: string | null;
  isGenerating: boolean;
  pixCopied: boolean;
  onCopyPix: () => void;
}

export function PixPaymentSection({ pixData, pixError, isGenerating, pixCopied, onCopyPix }: PixPaymentSectionProps) {
  const pixReady = !!(pixData?.qrCodeImage && pixData?.qrCodePayload);

  return (
    <div className="bg-neutral-900 text-white rounded-2xl p-5 flex flex-col items-center text-center gap-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 w-full">
      <div className="p-4 bg-paper rounded-2xl shadow-inner">
        {isGenerating ? (
          <div className="w-52 h-52 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-black animate-spin" />
          </div>
        ) : pixReady ? (
          <img
            src={`data:image/png;base64,${pixData?.qrCodeImage}`}
            alt="QR Code PIX"
            className="w-52 h-52"
          />
        ) : (
          <div className="w-52 h-52 flex items-center justify-center">
            <QrCode className="w-28 h-28 text-neutral-300" />
          </div>
        )}
      </div>

      {pixReady && pixData?.expiresAt && (
        <PixCountdown expiresAt={pixData.expiresAt} />
      )}

      {pixError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-2 w-full">
          <span className="text-red-400 text-sm">{pixError}</span>
        </div>
      )}

      <div className="space-y-1">
        <h4 className="text-lg font-normal">
          {isGenerating ? 'Gerando QR Code...' : pixReady ? 'Escaneie o QR Code' : 'Clique para gerar o PIX'}
        </h4>
        <p className="text-sm text-white/50 leading-relaxed">
          {isGenerating
            ? 'Aguarde enquanto geramos seu QR Code PIX com validade de 10 minutos.'
            : pixReady
              ? 'Abra o app do seu banco e aponte a câmera. O pagamento é processado instantaneamente.'
              : 'O QR Code PIX será gerado automaticamente.'}
        </p>
      </div>

      {pixReady && (
        <>
          <div className="w-full bg-paper/10 border border-white/10 rounded-xl p-3">
            <span className="text-xs text-white/40 block mb-2">Código PIX (Copia e Cola)</span>
            <div className="bg-black/30 p-3 rounded-lg">
              <p className="font-mono text-xs break-all text-white/80 leading-relaxed text-left">
                {pixData?.qrCodePayload?.substring(0, 80)}...
              </p>
            </div>
          </div>

          <button
            onClick={onCopyPix}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-paper text-black hover:bg-paper/90 rounded-xl transition-all shadow-lg"
          >
            {pixCopied ? (
              <Check className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <Copy className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm font-normal">
              {pixCopied ? 'Código Copiado!' : 'Copiar Código PIX'}
            </span>
          </button>

          <p className="text-xs text-white/30">
            Pedido criado. Aguardando confirmação do pagamento.
          </p>
        </>
      )}
    </div>
  );
}
