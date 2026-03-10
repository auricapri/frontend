import React, { useMemo, useState } from 'react';
import { type DeliverySupplierGroup } from '../../api/delivery.api';
import OptimizedImage from '../ui/OptimizedImage';
import { AlertTriangle, CheckCircle2, MapPin, Navigation, Package, Phone, ChevronLeft, ChevronDown, ChevronUp, Star, MoreVertical } from 'lucide-react';
import { type Locale } from '../../i18n';

function textFromLocalizedText(value: any, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[locale] || value.pt || value.en || '';
  }
  return '';
}

function formatAddress(address: any): string {
  if (!address) return '';
  const parts = [
    address.logradouro,
    address.numero ? String(address.numero) : null,
    address.bairro ? String(address.bairro) : null,
    address.localidade ? String(address.localidade) : null,
    address.uf ? String(address.uf) : null,
  ].filter(Boolean);
  return parts.join(', ');
}

function openGoogleMapsDirections(destinationAddress: string) {
  const encoded = encodeURIComponent(destinationAddress.trim());
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function normalizePhoneToTel(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, '');
  return digits.startsWith('+') ? digits : `+55${digits}`;
}

export function DeliverySupplierDetails(props: {
  group: DeliverySupplierGroup;
  locale: Locale;
  onAcceptAll: (supplierId: string) => void;
  onAcceptItem: (orderId: string, orderItemId: string) => void;
  onReportItem: (params: { supplierId: string; orderId: string; orderItemId: string }) => void;
  onRateSupplier: (supplierId: string) => void;
  onBack?: () => void;
  busy?: boolean;
}) {
  const { group, locale, onAcceptAll, onAcceptItem, onReportItem, onRateSupplier, onBack, busy } = props;
  const [showContact, setShowContact] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const address = useMemo(() => formatAddress(group.supplier?.address), [group.supplier?.address]);
  const remaining = group.total_items - group.picked_up_items;
  const isComplete = remaining <= 0;

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Supplier header — compact */}
      <div className="bg-white border-b border-neutral-100 px-3 py-2.5 md:px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button — mobile only */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1.5 hover:bg-neutral-100 rounded-lg transition-all"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-tight truncate">
                {group.supplier?.store_name || 'Fornecedor'}
              </span>
              {isComplete ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  OK
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold flex-shrink-0">
                  {remaining} pendentes
                </span>
              )}
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">
              {group.picked_up_items}/{group.total_items} coletados
            </div>
          </div>

          {/* Action buttons — compact */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Route button */}
            {address && (
              <button
                type="button"
                onClick={() => openGoogleMapsDirections(address)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-[0.97] transition-all"
                aria-label="Rota"
                title="Rota no Google Maps"
              >
                <Navigation className="w-4 h-4" />
              </button>
            )}

            {/* Phone button */}
            {group.supplier?.phones?.[0] && (
              <a
                href={`tel:${normalizePhoneToTel(group.supplier.phones?.[0] ?? '')}`}
                className="p-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 active:scale-[0.97] transition-all"
                aria-label="Ligar"
                title={group.supplier.phones?.[0] ?? ''}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            {/* More menu — rate supplier */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                aria-label="Mais opções"
              >
                <MoreVertical className="w-4 h-4 text-neutral-400" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onRateSupplier(group.supplier_id);
                      }}
                      disabled={!isComplete}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Avaliar fornecedor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowContact(!showContact);
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-50"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Ver detalhes do fornecedor
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expandable contact info */}
        {showContact && (
          <div className="mt-2 pt-2 border-t border-neutral-100 space-y-1.5">
            {address && (
              <div className="flex items-start gap-1.5 text-[11px] text-neutral-500">
                <MapPin className="w-3.5 h-3.5 text-neutral-300 mt-0.5 flex-shrink-0" />
                {address}
              </div>
            )}
            {group.supplier?.contact_person && (
              <div className="text-[11px] text-neutral-500">
                Contato: {group.supplier.contact_person}
              </div>
            )}
            {group.supplier?.email && (
              <div className="text-[11px] text-neutral-500">
                {group.supplier.email}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items list — scrollable, takes all remaining space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-2 py-2 md:px-4 md:py-3 space-y-2">
          {group.items.map((item) => {
            const name = textFromLocalizedText(item.order_item?.name, locale) || 'Produto';
            const color = textFromLocalizedText(item.order_item?.color_name, locale);
            const size = item.order_item?.size ? String(item.order_item.size) : '';
            const details = [
              color ? color : null,
              size ? `Tam. ${size}` : null,
            ].filter(Boolean).join(' · ');

            return (
              <div key={item.order_item_id} className="bg-white rounded-xl border border-neutral-100 p-2.5 md:p-3">
                <div className="flex gap-2.5">
                  {/* Image — small */}
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-neutral-50 flex-shrink-0">
                    <OptimizedImage src={item.order_item?.image} alt={name} className="w-full h-full" size="thumbnail" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-tight truncate">{name}</div>
                        {details && (
                          <div className="text-[10px] text-neutral-500 mt-0.5">{details}</div>
                        )}
                        <div className="text-[10px] text-neutral-400 mt-0.5">Qtd: {item.quantity}</div>
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        {item.picked_up ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-bold">
                            <Package className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item actions */}
                    {!item.picked_up && (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAcceptItem(item.order_id, item.order_item_id)}
                          disabled={busy}
                          className="px-2.5 py-1.5 rounded-lg bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                          Aceitar
                        </button>
                        <button
                          type="button"
                          onClick={() => onReportItem({ supplierId: group.supplier_id, orderId: item.order_id, orderItemId: item.order_item_id })}
                          disabled={busy}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                          Problema
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky bottom — Accept all button */}
      {!isComplete && (
        <div className="flex-shrink-0 bg-white border-t border-neutral-100 px-3 py-2 md:px-4 md:py-3">
          <button
            type="button"
            onClick={() => onAcceptAll(group.supplier_id)}
            disabled={busy || isComplete}
            className="w-full py-3 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aceitar tudo ({remaining} itens)
          </button>
        </div>
      )}
    </div>
  );
}
