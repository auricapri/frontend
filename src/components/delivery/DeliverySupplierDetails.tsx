import React, { useMemo } from 'react';
import { type DeliverySupplierGroup } from '../../api/delivery.api';
import OptimizedImage from '../ui/OptimizedImage';
import { AlertTriangle, CheckCircle2, MapPin, Navigation, Package, Phone, Mail, Star } from 'lucide-react';
import { type Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';

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
    address.cep ? `CEP ${String(address.cep)}` : null,
  ].filter(Boolean);
  return parts.join(', ');
}

function buildGoogleMapsDirectionsUrl(destinationAddress: string): string {
  const encoded = encodeURIComponent(destinationAddress.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
}

function openGoogleMapsDirections(destinationAddress: string) {
  const url = buildGoogleMapsDirectionsUrl(destinationAddress);
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
  busy?: boolean;
}) {
  const { group, locale, onAcceptAll, onAcceptItem, onReportItem, onRateSupplier, busy } = props;

  const address = useMemo(() => formatAddress(group.supplier?.address), [group.supplier?.address]);
  const remaining = group.total_items - group.picked_up_items;
  const isComplete = remaining <= 0;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[calc(100vh-260px)]">
      <div className="p-6 border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-2xl font-black uppercase tracking-tight truncate">
              {group.supplier?.store_name || 'Fornecedor'}
            </div>

            {address ? (
              <div className="mt-2 flex items-start gap-2 text-sm text-neutral-600">
                <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div className="min-w-0">{address}</div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openGoogleMapsDirections(address)}
                disabled={!address}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Rota no Google Maps
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {group.supplier?.contact_person ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 text-xs text-neutral-700">
                  <span className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Contato</span>
                  {group.supplier.contact_person}
                </div>
              ) : null}
              {group.supplier?.phone ? (
                <a
                  href={`tel:${normalizePhoneToTel(group.supplier.phone)}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 text-xs text-neutral-700 hover:bg-neutral-100 active:scale-[0.99] transition-all"
                >
                  <Phone className="w-4 h-4 text-neutral-400" />
                  {group.supplier.phone}
                </a>
              ) : null}
              {group.supplier?.email ? (
                <a
                  href={`mailto:${group.supplier.email}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 text-xs text-neutral-700 hover:bg-neutral-100 active:scale-[0.99] transition-all"
                >
                  <Mail className="w-4 h-4 text-neutral-400" />
                  {group.supplier.email}
                </a>
              ) : null}
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Total</div>
            <div className="text-2xl font-black mt-1">{formatCurrency(group.total_amount, locale)}</div>
            <div className="mt-2 text-xs text-neutral-500">
              {group.picked_up_items} coletados / {group.total_items} itens
            </div>
            {isComplete ? (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Coleta concluída
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-widest">
                <AlertTriangle className="w-3.5 h-3.5" />
                {remaining} pendentes
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onAcceptAll(group.supplier_id)}
            disabled={busy || isComplete}
            className="px-5 py-3 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aceitar tudo do fornecedor
          </button>
          <button
            type="button"
            onClick={() => onRateSupplier(group.supplier_id)}
            disabled={busy || !isComplete}
            className="px-5 py-3 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-black uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Avaliar fornecedor
          </button>
        </div>
      </div>

      <div className="p-6 min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Produtos a recolher</div>
          <div className="text-xs text-neutral-500">{group.items.length} itens</div>
        </div>

        <div className="mt-4 space-y-3">
          {group.items.map((item) => {
            const name = textFromLocalizedText(item.order_item?.name, locale) || 'Produto';
            const color = textFromLocalizedText(item.order_item?.color_name, locale);
            const size = item.order_item?.size ? String(item.order_item.size) : '';
            const sku = item.order_item?.sku ? String(item.order_item.sku) : '';
            const variantId = item.order_item?.variant_id ? String(item.order_item.variant_id) : '';
            const meta = item.order_item?.variant_meta;
            const composition = textFromLocalizedText(meta?.composition, locale);
            const care = textFromLocalizedText(meta?.care_instructions, locale);
            const attributes = meta?.attributes ? JSON.stringify(meta.attributes) : '';
            const variantDetails = [
              color ? `Cor: ${color}` : null,
              size ? `Tamanho: ${size}` : null,
              sku ? `SKU: ${sku}` : null,
              variantId ? `Variante: ${variantId.slice(0, 8)}` : null,
            ]
              .filter(Boolean)
              .join(' • ');

            return (
              <div key={item.order_item_id} className="rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="p-4 flex gap-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-50 flex-shrink-0">
                    <OptimizedImage src={item.order_item?.image} alt={name} className="w-full h-full" size="thumbnail" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-black uppercase tracking-tight truncate">{name}</div>
                        {variantDetails ? (
                          <div className="text-xs text-neutral-600 mt-1">{variantDetails}</div>
                        ) : null}
                        {composition || care || attributes ? (
                          <div className="text-xs text-neutral-500 mt-2 whitespace-pre-line">
                            {composition ? `Composição: ${composition}` : ''}
                            {composition && (care || attributes) ? '\n' : ''}
                            {care ? `Cuidados: ${care}` : ''}
                            {(composition || care) && attributes ? '\n' : ''}
                            {attributes ? `Atributos: ${attributes}` : ''}
                          </div>
                        ) : null}
                        <div className="text-xs text-neutral-500 mt-1">Qtd: {item.quantity}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.picked_up ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aceito
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-50 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
                            <Package className="w-3.5 h-3.5" />
                            Pendente
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onAcceptItem(item.order_id, item.order_item_id)}
                        disabled={busy || item.picked_up}
                        className="px-3 py-2 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Aceitar item
                      </button>
                      <button
                        type="button"
                        onClick={() => onReportItem({ supplierId: group.supplier_id, orderId: item.order_id, orderItemId: item.order_item_id })}
                        disabled={busy}
                        className="px-3 py-2 rounded-xl bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reportar problema
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
