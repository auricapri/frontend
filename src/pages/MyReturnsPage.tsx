/// MyReturnsPage
/// Lists user's return requests with status, RMA code, and date

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Package, RotateCcw } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { ReturnsApi, Return } from '../api/returns.api';
import { formatCurrency } from '../utils/currency';
import type { Locale } from '../i18n';

interface MyReturnsPageProps {
  locale: Locale;
  onBack: () => void;
  onRequestReturn: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-400' },
  approved: { label: 'Aprovada', color: 'bg-green-500' },
  rejected: { label: 'Rejeitada', color: 'bg-red-500' },
  processing: { label: 'Em Processamento', color: 'bg-blue-500' },
  completed: { label: 'Concluida', color: 'bg-green-600' },
  refunded: { label: 'Reembolsada', color: 'bg-green-600' },
};

export function MyReturnsPage({ locale, onBack, onRequestReturn }: MyReturnsPageProps) {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      try {
        const returnsApi = new ReturnsApi();
        const data = await returnsApi.getAll();
        // Sort by most recent first
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReturns(data);
      } catch (err) {
        console.error('Error fetching returns:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, []);

  const getStatusInfo = (status: string) => {
    const normalized = status?.toLowerCase();
    return STATUS_LABELS[normalized] || { label: status, color: 'bg-neutral-400' };
  };

  const getReasonLabel = (reason: string | null) => {
    if (!reason) return '-';
    const labels: Record<string, string> = {
      wrong_size: 'Tamanho errado',
      not_liked: 'Nao gostei',
      defect: 'Defeito',
      changed_mind: 'Mudei de ideia',
      other: 'Outro',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-paper">
      <SEOHead
        title="Minhas Devolucoes | Auricapri"
        description="Acompanhe suas solicitacoes de devolucao na Auricapri."
        keywords="devolucoes, trocas, rma, auricapri"
        url="https://www.auricapri.com.br/my-returns"
      />

      <header className="sticky top-0 z-10 bg-white border-b border-neutral-100">
        <div className="w-full px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xs font-bold uppercase tracking-[0.15em]">
              Minhas Devolucoes
            </h1>
          </div>
          <button
            onClick={onRequestReturn}
            className="px-5 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            Nova Solicitacao
          </button>
        </div>
      </header>

      <main className="w-full px-4 py-8 max-w-3xl mx-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-300 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Carregando...
            </span>
          </div>
        ) : returns.length === 0 ? (
          <div className="py-20 text-center space-y-6">
            <Package className="w-12 h-12 text-neutral-200 mx-auto" />
            <div className="space-y-2">
              <p className="text-sm text-neutral-400 font-medium">
                Voce ainda nao tem solicitacoes de devolucao.
              </p>
              <p className="text-xs text-neutral-300">
                Caso precise devolver algum produto, clique no botao acima.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => {
              const statusInfo = getStatusInfo(ret.status);
              return (
                <div
                  key={ret.id}
                  className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                          Pedido #{ret.order_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      {ret.rma_code && (
                        <p className="text-sm font-black tracking-tight">
                          RMA: {ret.rma_code}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {new Date(ret.created_at).toLocaleDateString(locale, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {ret.refund_amount > 0 && (
                      <span className="font-bold text-neutral-700">
                        Reembolso: {formatCurrency(ret.refund_amount, locale)}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-neutral-400">
                    <span className="font-bold uppercase tracking-widest">Motivo:</span>{' '}
                    {getReasonLabel(ret.reason)}
                  </div>

                  {/* Show returned items if available in metadata */}
                  {ret.metadata?.items && Array.isArray(ret.metadata.items) && (
                    <div className="pt-3 border-t border-neutral-200 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">
                        Itens
                      </span>
                      {ret.metadata.items.map((item: any, idx: number) => (
                        <div key={idx} className="text-[11px] text-neutral-600">
                          {item.name} — {item.size} (Qtd: {item.quantity})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyReturnsPage;
