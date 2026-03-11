import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { DeliveryApi, type DeliveryPickup, type DeliveryReport } from '../../api/delivery.api';

type HistoryItem =
  | { kind: 'pickup'; created_at: string; pickup: DeliveryPickup }
  | { kind: 'report'; created_at: string; report: DeliveryReport };

export function DeliveryHistoryPanel() {
  const api = useMemo(() => new DeliveryApi(), []);

  const { data: items = [], isLoading, error, refetch } = useQuery<HistoryItem[]>({
    queryKey: ['delivery', 'history'],
    queryFn: async () => {
      const [pickups, reports] = await Promise.all([api.getPickups(), api.getReports()]);
      return [
        ...pickups.map((p) => ({ kind: 'pickup' as const, created_at: p.updated_at || p.created_at, pickup: p })),
        ...reports.map((r) => ({ kind: 'report' as const, created_at: r.reported_at || r.created_at, report: r })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    staleTime: 30 * 1000,
  });

  return (
    <div className="bg-paper rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="p-5 border-b border-neutral-100 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Histórico</div>
          <div className="text-sm text-neutral-700 mt-1">Ações recentes (aceites e reportes)</div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-[0.99] transition-all"
          aria-label="Atualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error ? (
        <div className="p-5 text-sm text-red-700">{(error as Error).message || 'Falha ao carregar histórico'}</div>
      ) : null}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-neutral-500">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-neutral-600">Sem ações registradas ainda</div>
      ) : (
        <div className="max-h-[calc(100vh-260px)] overflow-auto">
          {items.map((item) => {
            const ts = new Date(item.created_at).toLocaleString('pt-BR');
            if (item.kind === 'pickup') {
              const statusLabel = item.pickup.status === 'picked_up' ? 'Aceito' : 'Ocorrência';
              const statusTone = item.pickup.status === 'picked_up' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800';
              return (
                <div key={`p-${item.pickup.id}`} className="p-5 border-b border-neutral-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">Item</div>
                      <div className="text-xs text-neutral-600 mt-1">Pedido: {item.pickup.order_id.slice(0, 8)} • {item.pickup.order_item_id}</div>
                      <div className="text-[10px] text-neutral-400 mt-2">{ts}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 ${statusTone}`}>
                      {item.pickup.status === 'picked_up' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {statusLabel}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={`r-${item.report.id}`} className="p-5 border-b border-neutral-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black uppercase tracking-tight">Reporte</div>
                    <div className="text-xs text-neutral-600 mt-1">Pedido: {item.report.order_id.slice(0, 8)} • {item.report.order_item_id}</div>
                    {item.report.description ? (
                      <div className="text-xs text-neutral-600 mt-2 whitespace-pre-line">{item.report.description}</div>
                    ) : null}
                    <div className="text-[10px] text-neutral-400 mt-2">{ts}</div>
                  </div>
                  <div className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1 bg-red-50 text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Problema
                  </div>
                </div>
                {item.report.media_urls?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.report.media_urls.slice(0, 3).map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold uppercase tracking-widest text-blue-700 hover:text-blue-800"
                      >
                        Evidência {idx + 1}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
