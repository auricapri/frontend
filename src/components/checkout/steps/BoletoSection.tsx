import { useState } from 'react';
import { CheckCircle2, Clock, Copy, ExternalLink, FileText, Loader2, Package } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import type { BoletoData } from '../../../types/payment.types';
import type { Locale } from '../../../i18n';

interface BoletoSectionProps {
  boletoData: BoletoData | null;
  boletoError: string | null;
  boletoLoading: boolean;
  finalTotal: number;
  locale: Locale;
}

export function BoletoSection({ boletoData, boletoError, boletoLoading, finalTotal, locale }: BoletoSectionProps) {
  const [boletoConfirmed, setBoletoConfirmed] = useState(false);
  const boletoReady = !!(boletoData?.barCode);

  return (
    <div className="bg-neutral-900 text-white rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center space-y-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      {boletoConfirmed ? (
        <BoletoConfirmedScreen />
      ) : (
        <Boleto
          boletoData={boletoData}
          boletoError={boletoError}
          boletoLoading={boletoLoading}
          boletoReady={boletoReady}
          finalTotal={finalTotal}
          locale={locale}
          onConfirm={() => setBoletoConfirmed(true)}
        />
      )}
    </div>
  );
}

function BoletoConfirmedScreen() {
  return (
    <>
      <div className="p-6 bg-amber-500 rounded-[2.5rem] shadow-inner">
        <Clock className="w-32 h-32 text-white" />
      </div>

      <div className="space-y-3">
        <h4 className="text-2xl font-black uppercase italic tracking-tighter">Pedido Pendente</h4>
        <p className="text-sm text-white/60 max-w-sm mx-auto leading-relaxed">
          Seu pedido foi registrado e está aguardando a confirmação do pagamento.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 space-y-4 w-full max-w-md">
        <div className="flex items-center gap-4 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl">
          <Package className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div className="text-left">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">Estoque Reservado</span>
            <span className="text-[10px] text-white/60">Seus itens estão reservados até o vencimento do boleto</span>
          </div>
        </div>

        <div className="space-y-3 text-left">
          {[
            { step: '1', text: <>Pagamento identificado em até <strong className="text-white">3 dias úteis</strong></> },
            { step: '2', text: <>Após confirmação, seu pedido será <strong className="text-white">despachado em 24h</strong></> },
            { step: '3', text: <>Você receberá atualizações por <strong className="text-white">e-mail e WhatsApp</strong></> },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3 text-[11px] text-white/60">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-black">{step}</span>
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-white/30 mt-2">
        Acompanhe seu pedido na área "Meus Pedidos"
      </div>
    </>
  );
}

interface BoletoProps {
  boletoData: BoletoData | null;
  boletoError: string | null;
  boletoLoading: boolean;
  boletoReady: boolean;
  finalTotal: number;
  locale: Locale;
  onConfirm: () => void;
}

function Boleto({ boletoData, boletoError, boletoLoading, boletoReady, finalTotal, locale, onConfirm }: BoletoProps) {
  return (
    <>
      <div className="p-6 bg-white rounded-[2.5rem] shadow-inner">
        {boletoLoading ? (
          <div className="w-40 h-40 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-black animate-spin" />
          </div>
        ) : (
          <FileText className="w-40 h-40 text-black" />
        )}
      </div>

      {boletoError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl px-6 py-3">
          <span className="text-red-400 text-sm">{boletoError}</span>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-xl font-black uppercase italic tracking-tighter">
          {boletoData ? 'Boleto Gerado' : 'Boleto Bancário'}
        </h4>
        <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
          {boletoData
            ? `Vencimento: ${boletoData.dueDate.toLocaleDateString('pt-BR')}`
            : 'O boleto será gerado após a confirmação do pedido. Você terá 3 dias úteis para efetuar o pagamento.'}
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 space-y-4 w-full max-w-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-white/60">Valor do boleto</span>
          <span className="text-lg font-black">{formatCurrency(finalTotal, locale)}</span>
        </div>

        {boletoData ? (
          <>
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-white/60 block">Linha Digitável</span>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="font-mono text-xs break-all text-white/80">{boletoData.barCode}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(boletoData.barCode); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
              >
                <Copy className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">Copiar</span>
              </button>
              {boletoData.bankSlipUrl && (
                <a
                  href={boletoData.bankSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Abrir PDF</span>
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-[10px] text-white/40">
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <span>O boleto será enviado por e-mail e ficará disponível na área do pedido</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/40">
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <span>Após o pagamento, a confirmação pode levar até 3 dias úteis</span>
            </div>
          </>
        )}
      </div>

      {boletoReady && (
        <button
          onClick={onConfirm}
          className="w-full max-w-md py-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5" />
          Já Paguei o Boleto
        </button>
      )}
    </>
  );
}
