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
    <div className="bg-neutral-900 text-white rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center space-y-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-6 bg-paper rounded-[2.5rem] shadow-inner">
        {isGenerating ? (
          <div className="w-40 h-40 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-black animate-spin" />
          </div>
        ) : pixReady ? (
          <img
            src={`data:image/png;base64,${pixData?.qrCodeImage}`}
            alt="QR Code PIX"
            className="w-40 h-40"
          />
        ) : (
          <div className="w-40 h-40 flex items-center justify-center">
            <QrCode className="w-24 h-24 text-neutral-300" />
          </div>
        )}
      </div>

      {pixReady && pixData?.expiresAt && (
        <PixCountdown expiresAt={pixData.expiresAt} />
      )}

      {pixError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl px-6 py-3">
          <span className="text-red-400 text-sm">{pixError}</span>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xl font-black uppercase italic tracking-tighter">
          {isGenerating ? 'Gerando QR Code...' : pixReady ? 'Escaneie o QR Code' : 'Clique para gerar o PIX'}
        </h4>
        <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
          {isGenerating
            ? 'Aguarde enquanto geramos seu QR Code PIX com validade de 10 minutos.'
            : pixReady
              ? 'Abra o app do seu banco e aponte a câmera. O pagamento é processado instantaneamente.'
              : 'O QR Code PIX será gerado automaticamente.'}
        </p>
      </div>

      {pixReady && (
        <>
          <div className="w-full max-w-md bg-paper/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Código PIX (Copia e Cola)</span>
            <div className="bg-black/30 p-3 rounded-xl">
              <p className="font-mono text-[10px] break-all text-white/70 leading-relaxed">
                {pixData?.qrCodePayload?.substring(0, 80)}...
              </p>
            </div>
          </div>

          <button
            onClick={onCopyPix}
            className="flex items-center gap-4 px-10 py-5 bg-paper text-black hover:bg-paper/90 rounded-2xl transition-all group shadow-xl"
          >
            {pixCopied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">
              {pixCopied ? 'Código Copiado!' : 'Copiar Código PIX'}
            </span>
          </button>

          <div className="text-[10px] text-white/30 mt-4">
            Pedido criado. Aguardando confirmação do pagamento.
          </div>
        </>
      )}
    </div>
  );
}
