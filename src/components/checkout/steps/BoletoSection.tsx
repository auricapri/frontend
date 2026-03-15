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
    <div className="bg-neutral-900 text-white rounded-2xl p-5 flex flex-col items-center text-center gap-5 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 w-full">
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
      <div className="p-4 bg-amber-500 rounded-2xl shadow-inner">
        <Clock className="w-20 h-20 text-white" />
      </div>

      <div className="space-y-1">
        <h4 className="text-xl font-normal">Pedido Pendente</h4>
        <p className="text-sm text-white/60 leading-relaxed">
          Seu pedido foi registrado e está aguardando a confirmação do pagamento.
        </p>
      </div>

      <div className="bg-paper/10 p-4 rounded-xl border border-white/10 space-y-3 w-full">
        <div className="flex items-center gap-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
          <Package className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <span className="text-xs font-normal text-amber-400 block">Estoque Reservado</span>
            <span className="text-xs text-white/60">Seus itens estão reservados até o vencimento do boleto</span>
          </div>
        </div>

        <div className="space-y-2 text-left">
          {[
            { step: '1', text: <>Pagamento identificado em até <strong className="text-white">3 dias úteis</strong></> },
            { step: '2', text: <>Após confirmação, seu pedido será <strong className="text-white">despachado em 24h</strong></> },
            { step: '3', text: <>Você receberá atualizações por <strong className="text-white">e-mail e WhatsApp</strong></> },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3 text-sm text-white/60">
              <div className="w-5 h-5 rounded-full bg-paper/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-normal">{step}</span>
              </div>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">
        Acompanhe seu pedido na área "Meus Pedidos"
      </p>
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
      <div className="p-4 bg-paper rounded-2xl shadow-inner">
        {boletoLoading ? (
          <div className="w-28 h-28 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-black animate-spin" />
          </div>
        ) : (
          <FileText className="w-28 h-28 text-black" />
        )}
      </div>

      {boletoError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-2 w-full">
          <span className="text-red-400 text-sm">{boletoError}</span>
        </div>
      )}

      <div className="space-y-1">
        <h4 className="text-lg font-normal">
          {boletoData ? 'Boleto Gerado' : 'Boleto Bancário'}
        </h4>
        <p className="text-sm text-white/40 leading-relaxed">
          {boletoData
            ? `Vencimento: ${boletoData.dueDate.toLocaleDateString('pt-BR')}`
            : 'O boleto será gerado após a confirmação do pedido. Você terá 3 dias úteis para efetuar o pagamento.'}
        </p>
      </div>

      <div className="bg-paper/10 border border-white/10 rounded-xl p-4 space-y-3 w-full">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Valor do boleto</span>
          <span className="text-lg font-normal">{formatCurrency(finalTotal, locale)}</span>
        </div>

        {boletoData ? (
          <>
            <div className="space-y-2">
              <span className="text-sm text-white/60 block text-left">Linha Digitável</span>
              <div className="bg-black/30 p-3 rounded-lg">
                <p className="font-mono text-sm break-all text-white/90 leading-relaxed text-left">
                  {boletoData.barCode}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(boletoData.barCode); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-paper/10 hover:bg-paper/20 border border-white/10 rounded-lg transition-all"
              >
                <Copy className="w-4 h-4 shrink-0" />
                <span className="text-sm font-normal">Copiar</span>
              </button>
              {boletoData.bankSlipUrl && (
                <a
                  href={boletoData.bankSlipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-paper/10 hover:bg-paper/20 border border-white/10 rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-normal">Abrir PDF</span>
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 text-sm text-white/40 text-left">
              <div className="w-2 h-2 rounded-full bg-paper/40 mt-1.5 shrink-0" />
              <span>O boleto será enviado por e-mail e ficará disponível na área do pedido</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-white/40 text-left">
              <div className="w-2 h-2 rounded-full bg-paper/40 mt-1.5 shrink-0" />
              <span>Após o pagamento, a confirmação pode levar até 3 dias úteis</span>
            </div>
          </>
        )}
      </div>

      {boletoReady && (
        <button
          onClick={onConfirm}
          className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-normal transition-all shadow-lg flex items-center justify-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Já Paguei o Boleto
        </button>
      )}
    </>
  );
}
