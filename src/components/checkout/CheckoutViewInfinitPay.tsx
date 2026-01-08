import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  Loader2,
  Search,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { CartItem, InternalLogisticsInfo, UserProfile, StoreConfig, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { LogisticsService, ShippingOption } from '../../services/logistics.service';
import { AddressData } from './CheckoutView';
import { PaymentFormInfinitPay } from './PaymentFormInfinitPay';
import { OrderSummary } from './OrderSummary';
import { InfinitPayApi } from '../../api/infinitpay.api';

interface CheckoutViewInfinitPayProps {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserMode;
  onBack: () => void;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string
  ) => void;
  locale: Locale;
  t: (key: string) => any;
}

const CheckoutViewInfinitPay: React.FC<CheckoutViewInfinitPayProps> = ({
  items,
  currentUser,
  storeConfig,
  userMode,
  onBack,
  onComplete,
  locale,
  t
}) => {
  const logisticsService = new LogisticsService();
  const [step, setStep] = useState(1);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  
  const [shippingDisplay, setShippingDisplay] = useState<{ price: number, days: number } | null>(null);
  const [bestInternalShipping, setBestInternalShipping] = useState<InternalLogisticsInfo | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  
  const [mapError, setMapError] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentReturnData, setPaymentReturnData] = useState<{
    receipt_url?: string;
    order_nsu?: string;
    slug?: string;
    capture_method?: string;
    transaction_nsu?: string;
    paid?: boolean;
  } | null>(null);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = userMode === UserMode.ATACADO && selectedShippingOption 
    ? selectedShippingOption.display_price_was 
    : 0;
  const total = subtotal + shippingCost;

  const handleCepChange = useCallback(async (newCep: string) => {
    const cleanCep = newCep.replace(/\D/g, '');
    setCep(cleanCep);
    setCepError(null);

    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          setCepError('CEP não encontrado');
          setAddress(null);
        } else {
          setAddress({
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            localidade: data.localidade || '',
            uf: data.uf || '',
            cep: cleanCep,
          });
          setCepError(null);
        }
      } catch (error) {
        setCepError('Erro ao buscar CEP');
        setAddress(null);
      } finally {
        setLoadingCep(false);
      }
    } else if (cleanCep.length > 0) {
      setCepError('CEP deve ter 8 dígitos');
      setAddress(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.default_address && !address) {
      const def = currentUser.default_address;
      
      let logradouro = '';
      let bairro = '';
      
      if ((def as any).street_address) {
        const streetAddr = (def as any).street_address;
        const parts = streetAddr.split(' - ');
        
        if (parts.length > 0) {
          logradouro = parts[0];
        }
        
        if (parts.length > 1) {
          bairro = parts[1];
        }
      } else if (def.line1) {
        logradouro = def.line1;
        bairro = def.line2 || '';
      }
      
      const newAddress: AddressData = {
        logradouro: logradouro,
        bairro: bairro,
        localidade: (def as any).city || def.city || '',
        uf: (def as any).state_province || def.state || '',
        cep: (def as any).postal_code || def.postal_code || ''
      };
      
      setAddress(newAddress);
      
      const cepValue = (def as any).postal_code || def.postal_code || '';
      if (cepValue) {
        setCep(cepValue);
      }
    }
  }, [currentUser, address]);

  useEffect(() => {
    if (address && num && !calculatingShipping && address.cep) {
      setCalculatingShipping(true);
      
      if (userMode === UserMode.ATACADO) {
        logisticsService.calculateShippingOptions(address.cep, address).then((options) => {
          if (Array.isArray(options) && options.length > 0) {
            setShippingOptions(options);
            const cheapest = options.reduce((prev, curr) => 
              (curr?.real_cost || Infinity) < (prev?.real_cost || Infinity) ? curr : prev
            );
            setSelectedShippingOption(cheapest);
            setShippingDisplay({
              price: cheapest.display_price_was,
              days: cheapest.display_days_was
            });
            setBestInternalShipping({
              weight: items.reduce((sum, item) => sum + (item.quantity * 0.5), 0),
              dimensions: '30x20x15',
              estimatedDays: cheapest.display_days_was,
            });
          }
          setCalculatingShipping(false);
        }).catch((error) => {
          console.error('Error calculating shipping:', error);
          setCalculatingShipping(false);
        });
      } else {
        logisticsService.calculateShipping(address.cep, address).then((logisticsInfo) => {
          setShippingDisplay({
            price: logisticsInfo.display_price_was,
            days: logisticsInfo.display_days_was
          });
          setBestInternalShipping(logisticsInfo);
          setCalculatingShipping(false);
        }).catch((error) => {
          console.error('Error calculating shipping:', error);
          setCalculatingShipping(false);
        });
      }
    }
  }, [address, num, items, userMode]);

  useEffect(() => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  }, [checkoutUrl]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment_status');
    const orderId = urlParams.get('order_id');
    const receiptUrl = urlParams.get('receipt_url');
    const orderNsu = urlParams.get('order_nsu');
    const slug = urlParams.get('slug');
    const captureMethod = urlParams.get('capture_method');
    const transactionNsu = urlParams.get('transaction_nsu');
    const paid = urlParams.get('paid') === 'true';

    if (paymentStatus === 'return' && orderId) {
      setPendingOrderId(orderId);
      
      const returnData: any = {};
      if (receiptUrl) returnData.receipt_url = receiptUrl;
      if (orderNsu) returnData.order_nsu = orderNsu;
      if (slug) returnData.slug = slug;
      if (captureMethod) returnData.capture_method = captureMethod;
      if (transactionNsu) returnData.transaction_nsu = transactionNsu;
      if (paid) returnData.paid = paid;
      
      setPaymentReturnData(returnData);

      if (orderNsu && slug && transactionNsu && !paid) {
        setCheckingPaymentStatus(true);
        const infinitPayApi = new InfinitPayApi();
        
        infinitPayApi.checkPaymentStatus({
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
          slug: slug,
        }).then((status) => {
          setPaymentReturnData(prev => ({
            ...prev,
            paid: status.paid,
          }));
          setCheckingPaymentStatus(false);
        }).catch((error) => {
          console.error('Error checking payment status:', error);
          setCheckingPaymentStatus(false);
        });
      }
      
      setStep(3);
    }
  }, []);

  const handlePaymentLinkCreated = (orderId: string, url: string) => {
    setPendingOrderId(orderId);
    setCheckoutUrl(url);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  const description = `Pedido ${items.length} ${items.length === 1 ? 'item' : 'itens'}`;

  const getLoc = (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const steps = [
    { id: 1, title: 'Endereço', icon: MapPin },
    { id: 2, title: 'Pagamento', icon: CreditCard },
    { id: 3, title: 'Revisão', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col pt-24 pb-20 relative">
      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
          <div>
            <button 
              onClick={onBack} 
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar à Loja
            </button>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Finalizar Pedido</h1>
          </div>
          <div className="flex items-center gap-10">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step >= s.id ? 'bg-black text-white border-black' : 'border-neutral-100 text-neutral-300'
                }`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest hidden lg:block ${
                  step >= s.id ? 'text-black' : 'text-neutral-300'
                }`}>
                  {s.title}
                </span>
                {idx < steps.length - 1 && <div className="hidden lg:block w-8 h-[1px] bg-neutral-100" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-7 space-y-16">
            {step === 1 && (
              <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-6 mb-10">
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Endereço de Entrega</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CEP</label>
                    <div className="relative">
                      <input
                        className={`w-full p-6 bg-neutral-50 border ${cepError ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'} rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-mono text-lg tracking-widest`}
                        placeholder="00000-000"
                        maxLength={8}
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300">
                        {loadingCep ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      </div>
                    </div>
                    {cepError && (
                      <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" />
                        {cepError}
                      </div>
                    )}
                  </div>
                  {address && (
                    <div className="md:col-span-2 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">
                          Destino Identificado
                        </span>
                        <h4 className="text-xl font-black uppercase italic tracking-tight mb-1">
                          {address.logradouro}
                        </h4>
                        <p className="text-xs text-white/60 font-medium uppercase tracking-widest">
                          {address.bairro} — {address.localidade}, {address.uf}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                            Número
                          </label>
                          <input
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black"
                            placeholder="Ex: 123"
                            value={num}
                            onChange={(e) => setNum(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                            Complemento
                          </label>
                          <input
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black"
                            placeholder="Ex: Apto 12"
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                          />
                        </div>
                      </div>
                      {calculatingShipping && (
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculando frete...
                        </div>
                      )}
                      {shippingDisplay && (
                        <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">
                            Frete Estimado
                          </p>
                          <p className="text-lg font-black">
                            {formatCurrency(shippingDisplay.price, locale)} • {shippingDisplay.days} dias
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                      Nome do Destinatário
                    </label>
                    <input
                      className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black uppercase"
                      placeholder="Nome Completo"
                      defaultValue={currentUser?.full_name}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (address && num && (bestInternalShipping || selectedShippingOption)) {
                      setStep(2);
                    }
                  }}
                  disabled={!address || !num || (!bestInternalShipping && !selectedShippingOption)}
                  className="w-full md:w-auto px-16 py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-20 active:scale-95"
                >
                  Confirmar e Pagar <ChevronRight className="w-4 h-4" />
                </button>
              </section>
            )}

            {step === 2 && address && num && (bestInternalShipping || selectedShippingOption) && items && items.length > 0 && (
              <PaymentFormInfinitPay
                currentUser={currentUser}
                amount={total}
                description={description}
                items={items}
                addressData={{
                  ...address,
                  numero: num,
                  complemento: complement,
                }}
                logisticsInfo={bestInternalShipping || {
                  weight: items.reduce((sum, item) => sum + (item.quantity * 0.5), 0),
                  dimensions: '30x20x15',
                  estimatedDays: selectedShippingOption?.estimated_days || 5,
                }}
                subtotal={subtotal}
                locale={locale}
                onBack={() => setStep(1)}
                onError={handlePaymentError}
                onPaymentLinkCreated={handlePaymentLinkCreated}
              />
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-6 mb-10">
                  <div className="p-4 bg-neutral-50 rounded-2xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">
                    {paymentReturnData?.paid ? 'Pagamento Confirmado' : 'Aguardando Confirmação'}
                  </h3>
                </div>
                
                {checkingPaymentStatus ? (
                  <div className="bg-neutral-50 rounded-[2.5rem] p-10 space-y-6 text-center">
                    <Loader2 className="w-16 h-16 text-black mx-auto animate-spin" />
                    <div className="space-y-2">
                      <p className="text-sm font-black uppercase tracking-widest">
                        Verificando Pagamento
                      </p>
                      <p className="text-xs text-neutral-400">
                        Aguarde enquanto verificamos o status do seu pagamento...
                      </p>
                    </div>
                  </div>
                ) : paymentReturnData?.paid ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-[2.5rem] p-10 space-y-6 text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-sm font-black uppercase tracking-widest text-green-900">
                        Pagamento Confirmado!
                      </p>
                      <p className="text-xs text-green-700">
                        Seu pedido foi processado com sucesso.
                      </p>
                      {paymentReturnData.receipt_url && (
                        <a
                          href={paymentReturnData.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 px-8 py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                        >
                          Ver Comprovante
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 rounded-[2.5rem] p-10 space-y-6 text-center">
                    <CheckCircle2 className="w-16 h-16 text-yellow-500 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-sm font-black uppercase tracking-widest">
                        Pagamento Processado
                      </p>
                      <p className="text-xs text-neutral-400">
                        Aguardando confirmação do pagamento. Você receberá uma notificação em breve.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              total={total}
              paymentMethod="credit_card"
              calculatingShipping={calculatingShipping}
              shippingDisplay={shippingDisplay}
              locale={locale}
              getLoc={getLoc}
              userMode={userMode}
              shippingOptions={shippingOptions}
              selectedShippingOption={selectedShippingOption}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutViewInfinitPay;

