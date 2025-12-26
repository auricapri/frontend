
import React, { useState } from 'react';
import { ArrowLeft, Download, ShoppingBag, MapPin, Calendar, Clock, DollarSign, Share2, MessageCircle, Check, Loader2 } from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { OrdersApi } from '../../api/orders.api';

interface OrderReceiptProps {
  order: Order;
  onBack: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, onBack, t, locale }) => {
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const ordersApi = new OrdersApi();
  
  const handlePrint = async () => {
    setIsDownloadingPDF(true);
    try {
      await ordersApi.downloadReceiptPDF(order.id);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      alert('Erro ao baixar PDF. Tente novamente.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    const header = `*AURICAPRI - Recibo Digital*\n`;
    const id = `Pedido: #${order.id.slice(0, 8).toUpperCase()}\n`;
    const date = `Data: ${new Date(order.created_at).toLocaleDateString(locale)}\n`;
    const items = order.items.map(i => `- ${i.quantity}x ${getLoc(i.name)}`).join('\n');
    const total = `\n*TOTAL: ${formatCurrency(order.total, locale)}*`;
    const footer = `\n\nObrigado por comprar conosco!`;

    const text = encodeURIComponent(`${header}${id}${date}\nItens:\n${items}\n${total}${footer}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const formattedDate = new Date(order.created_at).toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const formattedTime = new Date(order.created_at).toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-white md:bg-neutral-100 flex flex-col items-center justify-start py-20 md:py-24 relative animate-in fade-in duration-700 overflow-y-auto">
      
      {/* GLOBAL PRINT STYLES - Ensures clean PDF generation */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          html, body, #root { 
            height: auto !important; 
            overflow: visible !important; 
            background-color: white !important; 
          }
          .no-print { display: none !important; }
          /* Force Receipt Container to be fully visible */
          #receipt-container { 
            position: relative !important;
            box-shadow: none !important; 
            margin: 0 !important; 
            width: 100% !important; 
            max-width: 100% !important;
            padding: 40px !important;
            border: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
          }
          /* Ensure text colors are printed */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* DESKTOP ACTIONS (Hidden on Mobile) */}
      <div className="hidden md:block absolute top-12 left-12 z-50 no-print">
         <button onClick={onBack} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('nav.back')}
         </button>
      </div>

      <div className="hidden md:flex absolute top-12 right-12 z-50 no-print gap-4">
         <button onClick={handleWhatsAppShare} className="flex items-center gap-3 bg-green-500 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
            <MessageCircle className="w-4 h-4" /> WhatsApp
         </button>
         <button 
            onClick={handlePrint} 
            disabled={isDownloadingPDF}
            className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50"
         >
            {isDownloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
            {isDownloadingPDF ? 'Gerando...' : 'Salvar PDF'}
         </button>
      </div>

      {/* MOBILE HEADER (Visible only on mobile) */}
      <div className="md:hidden fixed top-0 left-0 w-full flex items-center justify-between p-6 border-b border-neutral-100 no-print bg-white/90 backdrop-blur-md z-40">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest">Comprovante</span>
          <div className="w-5" /> {/* Spacer */}
      </div>

      {/* RECEIPT PAPER */}
      <div id="receipt-container" className="bg-white w-full max-w-md p-8 md:p-14 md:shadow-2xl relative text-neutral-900 font-mono text-xs leading-relaxed mb-32 md:mb-0">
         
         {/* Paper Texture/Gradient for Desktop */}
         <div className="hidden md:block absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-neutral-100 to-white opacity-20"></div>

         <div className="flex flex-col items-center text-center border-b-2 border-black pb-8 mb-8 mt-4 md:mt-0">
            <div className="mb-4">
               <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
               </svg>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-[0.4em] mb-2">AURICAPRI</h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Luxury Global Retail</p>
            {/* Note: In a real app, pass global config to this component to display dynamic CNPJ */}
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">CNPJ: 00.000.000/0001-99</p>
         </div>

         <div className="space-y-3 mb-8 bg-neutral-50 p-6 rounded-xl border border-neutral-100 print:border-black print:bg-white print:border-dashed">
            <div className="flex justify-between">
               <span className="uppercase font-bold text-neutral-400 print:text-black">ID DO PEDIDO</span>
               <span className="font-bold select-all">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
               <span className="uppercase font-bold text-neutral-400 print:text-black">DATA EMISSÃO</span>
               <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
               <span className="uppercase font-bold text-neutral-400 print:text-black">MÉTODO</span>
               <span className="bg-black text-white px-2 py-0.5 text-[9px] uppercase tracking-wider rounded-sm print:border print:border-black print:text-black print:bg-white">
                  {order.payment_method === 'pix' ? 'PIX' : 'CARTÃO CRÉDITO'}
               </span>
            </div>
            <div className="flex justify-between">
               <span className="uppercase font-bold text-neutral-400 print:text-black">STATUS</span>
               <div className="flex items-center gap-1.5 text-green-600 font-bold uppercase print:text-black">
                  <Check className="w-3 h-3" /> Confirmado
               </div>
            </div>
         </div>

         <div className="border-b border-dashed border-neutral-300 mb-8 opacity-50 print:opacity-100 print:border-black"></div>

         <div className="space-y-6 mb-8">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4 print:text-black">Detalhamento</h3>
            {(order.items || []).map((item: OrderItem, idx) => (
               <div key={item.id || item.variant_id || idx} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                     <p className="font-bold uppercase leading-tight text-sm">{getLoc(item.name)}</p>
                     <p className="text-[10px] text-neutral-500 mt-1 print:text-black">{getLoc(item.color_name)} / {item.size} <span className="mx-1">•</span> Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-bold">{formatCurrency(item.price * item.quantity, locale)}</span>
               </div>
            ))}
         </div>

         <div className="border-b border-dashed border-neutral-300 mb-8 opacity-50 print:opacity-100 print:border-black"></div>

         <div className="space-y-3 mb-10">
            <div className="flex justify-between">
               <span className="uppercase font-bold text-neutral-400 print:text-black">SUBTOTAL</span>
               <span>{formatCurrency(order.subtotal || order.total + (order.discount_amount || 0), locale)}</span>
            </div>
            
            {order.discount_amount && order.discount_amount > 0 ? (
                <div className="flex justify-between text-green-600 print:text-black">
                   <span className="uppercase font-bold">DESCONTO APLICADO</span>
                   <span>-{formatCurrency(order.discount_amount, locale)}</span>
                </div>
            ) : null}

            <div className="flex justify-between">
               <span className="uppercase font-bold text-neutral-400 print:text-black">FRETE / ENVIO</span>
               <span>GRÁTIS</span>
            </div>
            <div className="flex justify-between items-end mt-6 pt-6 border-t-2 border-black">
               <span className="font-black uppercase text-xl">TOTAL PAGO</span>
               <span className="text-2xl font-black">{formatCurrency(order.total, locale)}</span>
            </div>
         </div>

         {order.tracking_code && (
             <div className="bg-neutral-900 text-white p-6 rounded-xl text-center mb-8 print:bg-white print:text-black print:border print:border-black">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-white/60 mb-2 print:text-black">Código de Rastreio</span>
                <span className="text-lg font-black font-mono tracking-widest select-all">{order.tracking_code}</span>
             </div>
         )}

         <div className="text-center space-y-6 pt-4">
            <div className="w-full flex justify-center opacity-40 print:opacity-100">
                {/* Barcode Simulation */}
                <div className="h-10 flex gap-1 items-end">
                    {[...Array(35)].map((_, i) => (
                        <div key={i} className="bg-black" style={{ width: Math.random() > 0.5 ? '2px' : '4px', height: Math.random() > 0.3 ? '100%' : '60%' }}></div>
                    ))}
                </div>
            </div>
            <p className="text-[9px] uppercase tracking-widest text-neutral-400 leading-relaxed max-w-xs mx-auto print:text-black">
               Este documento possui valor fiscal para fins de garantia. 
               <br/>Auricapri Global Inc.
            </p>
         </div>

      </div>

      {/* MOBILE FLOATING ACTIONS (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-neutral-100 md:hidden flex gap-3 z-50 no-print pb-8">
          <button 
            onClick={handlePrint}
            disabled={isDownloadingPDF}
            className="flex-1 py-4 border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:bg-neutral-50 disabled:opacity-50"
          >
             {isDownloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
             {isDownloadingPDF ? 'Gerando...' : 'PDF'}
          </button>
          <button 
            onClick={handleWhatsAppShare}
            className="flex-[2] py-4 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
             <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
          </button>
      </div>

    </div>
  );
};

export default OrderReceipt;
