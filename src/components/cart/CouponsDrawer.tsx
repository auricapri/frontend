import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Ticket, Copy, Check } from 'lucide-react';
import { Coupon } from '../../types';
import { couponsApi } from '../../api/instances';

interface CouponsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => any;
}

const CouponsDrawer: React.FC<CouponsDrawerProps> = ({ isOpen, onClose, t }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ['coupons', 'public'],
    queryFn: () => couponsApi.getAll(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  const formatDiscount = (coupon: Coupon): string => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const formatExpires = (coupon: Coupon): string => {
    if (!coupon.expires_at) return 'Sem expiração';
    const expires = new Date(coupon.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Expirado';
    if (daysLeft === 0) return 'Expira hoje';
    if (daysLeft === 1) return 'Expira amanhã';
    return `Expira em ${daysLeft} dias`;
  };

  const getCouponColor = (coupon: Coupon): string => {
    if (coupon.discount_type === 'percentage' && coupon.discount_value >= 20) {
      return 'bg-neutral-800 text-white';
    }
    if (coupon.discount_type === 'fixed' && coupon.discount_value >= 100) {
      return 'bg-black text-white';
    }
    return 'bg-neutral-100 text-black border border-neutral-200';
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100">
          <div className="flex items-center space-x-3">
             <Ticket className="w-5 h-5" />
             <h2 className="text-xl font-light tracking-widest uppercase">{t('nav.coupons')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50 no-scrollbar">
           <p className="text-sm text-gray-500 mb-6">Ofertas disponíveis para sua próxima compra.</p>
           
           {isLoading ? (
             <div className="flex items-center justify-center py-12">
               <p className="text-sm text-gray-400">Carregando ofertas...</p>
             </div>
           ) : coupons.length === 0 ? (
             <div className="flex items-center justify-center py-12">
               <p className="text-sm text-gray-400">Nenhuma oferta disponível no momento.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {coupons.map((coupon) => (
                  <div key={coupon.code} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden group">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-wider ${getCouponColor(coupon)}`}>
                              {formatDiscount(coupon)} OFF
                          </span>
                          <h3 className="text-sm font-medium text-gray-900">Código: {coupon.code}</h3>
                          {coupon.min_purchase_amount && (
                            <p className="text-xs text-gray-500 mt-1">Compra mínima: R$ {coupon.min_purchase_amount.toFixed(2)}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{formatExpires(coupon)}</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200 border-dashed">
                        <code className="text-sm font-mono font-bold tracking-wider text-gray-700">{coupon.code}</code>
                        <button 
                          onClick={() => handleCopy(coupon.code)}
                          className="flex items-center space-x-1 text-xs font-medium uppercase tracking-wider hover:text-black transition-colors"
                        >
                           {copiedCode === coupon.code ? (
                               <>
                                  <Check className="w-3 h-3 text-green-500" />
                                  <span className="text-green-500">Copiado</span>
                               </>
                           ) : (
                               <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar</span>
                               </>
                           )}
                        </button>
                     </div>
                     
                     {/* Decorative Circles */}
                     <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full" />
                     <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full" />
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default CouponsDrawer;