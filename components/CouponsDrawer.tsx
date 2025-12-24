import React, { useState } from 'react';
import { X, Ticket, Copy, Check } from 'lucide-react';

interface Coupon {
  code: string;
  description: string;
  discount: string;
  expires: string;
  color: string;
}

const MOCK_COUPONS: Coupon[] = [
  { 
    code: 'WELCOME10', 
    description: '10% off your first order', 
    discount: '10%',
    expires: 'No expiration',
    color: 'bg-black text-white'
  },
  { 
    code: 'FREESHIP', 
    description: 'Free shipping on orders over $200', 
    discount: 'FREE SHIP',
    expires: 'Valid until Dec 31',
    color: 'bg-neutral-100 text-black border border-neutral-200'
  },
  { 
    code: 'SUMMER20', 
    description: '20% off Summer Collection items', 
    discount: '20%',
    expires: 'Expires in 2 days',
    color: 'bg-neutral-800 text-white'
  }
];

interface CouponsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => any;
}

const CouponsDrawer: React.FC<CouponsDrawerProps> = ({ isOpen, onClose, t }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
           <p className="text-sm text-gray-500 mb-6">Available offers for your next purchase.</p>
           
           <div className="space-y-4">
              {MOCK_COUPONS.map((coupon) => (
                <div key={coupon.code} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase tracking-wider ${coupon.color}`}>
                            {coupon.discount} OFF
                        </span>
                        <h3 className="text-sm font-medium text-gray-900">{coupon.description}</h3>
                        <p className="text-xs text-gray-400 mt-1">{coupon.expires}</p>
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
                                <span className="text-green-500">Copied</span>
                             </>
                         ) : (
                             <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
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
        </div>
      </div>
    </>
  );
};

export default CouponsDrawer;