
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  ShoppingBag,
  Loader2,
  Search,
  AlertCircle,
  QrCode,
  Copy,
  PlusCircle,
  MinusCircle,
  CreditCard as CardIcon,
  X,
  Navigation,
  Check,
  Map as MapIcon,
  Lock
} from 'lucide-react';
import { CartItem, InternalLogisticsInfo, UserProfile, SavedCard } from '../types';
import { Locale } from '../i18n';
import { MAPBOX_TOKEN, getMapboxStyle } from '../utils/mapbox';
import { formatCurrency } from '../utils/currency';

interface CheckoutViewProps {
  items: CartItem[];
  currentUser: UserProfile | null; // Pass user to check for saved data
  onBack: () => void;
  onComplete: (
      address: AddressData, 
      logistics: InternalLogisticsInfo, 
      paymentMethod: 'credit_card' | 'pix', 
      finalAmount: number,
      saveCard: boolean, // Nova flag
      cardToken?: string // Token se usar cartão salvo
  ) => void;
  locale: Locale;
  t: (key: string) => any;
}

export interface AddressData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep?: string;
  numero?: string;
  complemento?: string;
  erro?: boolean;
}

type PaymentMethod = 'credit_card' | 'pix';

const CheckoutView: React.FC<CheckoutViewProps> = ({ items, currentUser, onBack, onComplete, locale, t }) => {
  const [step, setStep] = useState(1);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  
  // Shipping States
  const [shippingDisplay, setShippingDisplay] = useState<{ price: number, days: number } | null>(null);
  const [bestInternalShipping, setBestInternalShipping] = useState<InternalLogisticsInfo | null>(null);
  
  const [mapError, setMapError] = useState(false);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [splitCards, setSplitCards] = useState(false);
  const [card1Amount, setCard1Amount] = useState<number>(0);
  const [pixCopied, setPixCopied] = useState(false);
  
  // Saved Cards Logic
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false); // Flag to save new card

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  const pickerMapRef = useRef<any>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const pickerMarkerRef = useRef<any>(null);

  // Search States for Picker
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Scroll to top when step changes
  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; 

  useEffect(() => {
    if (total > 0) setCard1Amount(total / 2);
  }, [total]);

  // AUTO-FILL DEFAULT ADDRESS
  useEffect(() => {
      if (currentUser?.default_address && !address) {
          const def = currentUser.default_address;
          // Parse line1 into street/num (simple heuristic)
          // Na prática, ideal seria ter campos separados no DB, mas aqui adaptamos
          setAddress({
              logradouro: def.line1, // Simplificação
              bairro: def.line2 || '',
              localidade: def.city,
              uf: def.state,
              cep: def.postal_code
          });
          setCep(def.postal_code);
          calculateLogistics(def.postal_code);
      }
  }, [currentUser]);

  // Função para buscar coordenadas (Geocoding)
  const fetchCoordinates = async (query: string): Promise<[number, number] | null> => {
    try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1`);
        if (!res.ok) throw new Error('Geocoding failed');
        const data = await res.json();
        if (data.features && data.features.length > 0) {
            return data.features[0].center; // [lng, lat]
        }
    } catch (e) {
        console.warn('Could not geocode address:', e);
    }
    return null;
  };

  // Inicializa o Mapa Principal
  useEffect(() => {
    let isMounted = true;
    const initializeMap = async () => {
        if (address && mapContainerRef.current && !mapError) {
            const win = window as any;
            const mapboxgl = win.mapboxgl;
            if (mapboxgl) {
                mapboxgl.accessToken = MAPBOX_TOKEN;
                if (!mapRef.current) {
                    try {
                        mapRef.current = new mapboxgl.Map({
                            container: mapContainerRef.current,
                            style: getMapboxStyle(),
                            center: [-46.6333, -23.5505],
                            zoom: 13,
                            attributionControl: false,
                            trackResize: false 
                        });
                        mapRef.current.on('error', (e: any) => {});
                    } catch (e) {
                        setMapError(true);
                        return;
                    }
                }
                const fullAddress = address.cep === 'Manual' 
                    ? `${address.logradouro}, ${address.localidade} - ${address.uf}`
                    : `${address.logradouro}, ${address.bairro}, ${address.localidade} - ${address.uf}`;
                
                const coords = await fetchCoordinates(fullAddress);
                if (!isMounted) return;
                if (mapRef.current && coords) {
                    try {
                        mapRef.current.resize();
                        mapRef.current.flyTo({ center: coords, zoom: 15, speed: 1.5, essential: true });
                        if (!markerRef.current) {
                            const el = document.createElement('div');
                            el.className = 'custom-marker';
                            el.innerHTML = '<div class="marker-pin"></div><div class="marker-pulse"></div>';
                            markerRef.current = new mapboxgl.Marker(el).setLngLat(coords).addTo(mapRef.current);
                        } else {
                            markerRef.current.setLngLat(coords);
                        }
                    } catch (e) { }
                }
            } else {
                setMapError(true);
            }
        }
    };
    initializeMap();
    return () => {
        isMounted = false;
        if (mapRef.current) {
            try { mapRef.current.remove(); } catch(e) {}
            mapRef.current = null;
            markerRef.current = null;
        }
    };
  }, [address, mapError]);

  // Mapa do Picker (Mesmo código anterior para brevidade...)
  useEffect(() => {
    let picker: any = null;
    if (isMapPickerOpen && pickerContainerRef.current) {
      const win = window as any;
      const mapboxgl = win.mapboxgl;
      if (mapboxgl) {
        mapboxgl.accessToken = MAPBOX_TOKEN;
        try {
          if (pickerMapRef.current) { pickerMapRef.current.remove(); pickerMapRef.current = null; }
          picker = new mapboxgl.Map({
            container: pickerContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-46.6333, -23.5505],
            zoom: 11,
            attributionControl: false,
            trackResize: false
          });
          pickerMapRef.current = picker;
          setTimeout(() => { try { if(pickerMapRef.current) pickerMapRef.current.resize(); } catch(e){} }, 500);
          picker.on('click', async (e: any) => {
             const { lng, lat } = e.lngLat;
             updatePickerMarker([lng, lat]);
             try {
                 const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`);
                 const data = await res.json();
                 if(data.features && data.features.length > 0) parseAndSetAddress(data.features[0]);
             } catch(err) { console.error(err); }
          });
        } catch (err) {}
      }
    }
    return () => {
      if (pickerMapRef.current) {
          try { pickerMapRef.current.remove(); } catch(e){}
          pickerMapRef.current = null;
          pickerMarkerRef.current = null;
      }
    };
  }, [isMapPickerOpen]);

  const updatePickerMarker = (coords: [number, number]) => {
      const win = window as any;
      if (!pickerMapRef.current || !win.mapboxgl) return;
      if (!pickerMarkerRef.current) {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.innerHTML = '<div class="marker-pin"></div><div class="marker-pulse"></div>';
          pickerMarkerRef.current = new win.mapboxgl.Marker(el).setLngLat(coords).addTo(pickerMapRef.current);
      } else {
          pickerMarkerRef.current.setLngLat(coords);
      }
      try { pickerMapRef.current.flyTo({ center: coords, zoom: 15, essential: true }); } catch(e) {}
  };

  const handlePickerSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=5&types=address,place,locality,neighborhood`);
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch (e) { } finally { setIsSearching(false); }
  };

  const parseAndSetAddress = (feature: any) => {
      const context = feature.context || [];
      const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'))?.text || '';
      const city = context.find((c: any) => c.id.startsWith('place'))?.text || feature.place_name?.split(',')[1]?.trim() || '';
      const state = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('BR-', '') || '';
      setManualAddress({ street: feature.text || feature.place_name?.split(',')[0] || '', neighborhood, city, state });
  };

  const handleSelectSearchResult = (result: any) => {
      parseAndSetAddress(result);
      setSearchResults([]);
      setSearchQuery('');
      if (result.center) updatePickerMarker(result.center);
  };

  const confirmManualAddress = () => {
    setAddress({ logradouro: manualAddress.street, bairro: manualAddress.neighborhood, localidade: manualAddress.city, uf: manualAddress.state, cep: 'Manual' });
    setCep('00000-000'); 
    setIsMapPickerOpen(false);
    calculateLogistics('Manual');
  };

  const calculateLogistics = async (destCep: string) => {
    setCalculatingShipping(true);
    setShippingDisplay(null);
    setBestInternalShipping(null);

    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const displayPrice = 45.90 + (Math.random() * 20); 
    const displayDays = 12 + Math.floor(Math.random() * 5);

    setShippingDisplay({
        price: displayPrice,
        days: displayDays
    });

    const carriers = [
        { name: 'Loggi', price: 18.50, days: 3 },
        { name: 'Correios PAC', price: 22.90, days: 6 },
        { name: 'Total Express', price: 16.90, days: 5 },
        { name: 'Jadlog', price: 19.90, days: 4 }
    ];

    const bestOption = carriers.sort((a, b) => a.price - b.price)[0];

    setBestInternalShipping({
        selected_carrier: bestOption.name,
        real_cost: bestOption.price,
        estimated_days: bestOption.days,
        display_price_was: displayPrice,
        display_days_was: displayDays
    });

    setCalculatingShipping(false);
  };

  const handleCepChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setCep(cleaned);
    setCepError(null);
    if (cleaned.length < 8) {
        setAddress(null);
        setShippingDisplay(null);
    }
    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        if (!res.ok) throw new Error('CEP lookup failed');
        const data = await res.json();
        if (data.erro) throw new Error('CEP not found');
        setAddress(data);
        calculateLogistics(cleaned);
      } catch (e) {
        try {
          const resFallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleaned}`);
          if (!resFallback.ok) throw new Error('Fallback failed');
          const dataFallback = await resFallback.json();
          setAddress({ logradouro: dataFallback.address || '', bairro: dataFallback.district || '', localidade: dataFallback.city || '', uf: dataFallback.state || '' });
          calculateLogistics(cleaned);
        } catch (err2) {
          setCepError('Falha ao carregar CEP. Use o buscador de mapa.');
          setAddress(null);
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136auricapri-checkout-mock-pix-key-v19");
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const handleCompleteOrder = () => {
      if(address && bestInternalShipping) {
          const finalAddress = { ...address, numero: num, complemento: complement };
          const finalAmount = paymentMethod === 'pix' ? total * 0.95 : total;
          
          // Pass Saved Card Token if selected
          let tokenToUse;
          if (paymentMethod === 'credit_card' && selectedSavedCardId) {
              const saved = currentUser?.saved_cards?.find(c => c.id === selectedSavedCardId);
              tokenToUse = saved?.gateway_token;
          }

          onComplete(
              finalAddress, 
              bestInternalShipping, 
              paymentMethod, 
              finalAmount, 
              saveCardForFuture, 
              tokenToUse
          );
      }
  };

  const steps = [ { id: 1, title: 'Endereço', icon: MapPin }, { id: 2, title: 'Pagamento', icon: CreditCard }, { id: 3, title: 'Revisão', icon: ShieldCheck } ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col pt-24 pb-20 relative">
      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
          <div>
            <button onClick={onBack} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"><ArrowLeft className="w-4 h-4" /> Voltar à Loja</button>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Finalizar Pedido</h1>
          </div>
          <div className="flex items-center gap-10">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step >= s.id ? 'bg-black text-white border-black' : 'border-neutral-100 text-neutral-300'}`}><s.icon className="w-4 h-4" /></div>
                <span className={`text-[10px] font-black uppercase tracking-widest hidden lg:block ${step >= s.id ? 'text-black' : 'text-neutral-300'}`}>{s.title}</span>
                {idx < steps.length - 1 && <div className="hidden lg:block w-8 h-[1px] bg-neutral-100" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-7 space-y-16">
            {step === 1 && (
              <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-6 mb-10"><div className="p-4 bg-neutral-50 rounded-2xl"><MapPin className="w-6 h-6" /></div><h3 className="text-xl font-black uppercase italic tracking-tighter">Endereço de Entrega</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CEP</label>
                    <div className="relative">
                        <input className={`w-full p-6 bg-neutral-50 border ${cepError ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'} rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-mono text-lg tracking-widest`} placeholder="00000-000" maxLength={8} value={cep} onChange={(e) => handleCepChange(e.target.value)} />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300">{loadingCep ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button type="button" onClick={() => setIsMapPickerOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2"><Navigation className="w-3 h-3" /> Não sei meu CEP</button>
                      {cepError && <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-1"><AlertCircle className="w-3 h-3" />{cepError}</div>}
                    </div>
                  </div>
                  {address && (
                    <div className="md:col-span-2 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl border border-white/10 overflow-hidden relative">
                            <div className="relative z-10 flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-2">Destino Identificado</span>
                                <h4 className="text-xl font-black uppercase italic tracking-tight mb-1">{address.logradouro}</h4>
                                <p className="text-xs text-white/60 font-medium uppercase tracking-widest">{address.bairro} — {address.localidade}, {address.uf}</p>
                            </div>
                            <div ref={mapContainerRef} className="w-full md:w-48 h-48 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden relative shadow-inner">
                                {(mapError || !(window as any).mapboxgl) && <div className="w-full h-full flex items-center justify-center bg-neutral-800"><MapPin className="w-6 h-6 text-white/20" /></div>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número</label><input className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black" placeholder="Ex: 123" value={num} onChange={(e) => setNum(e.target.value)} /></div>
                            <div className="space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Complemento</label><input className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black" placeholder="Ex: Apto 12" value={complement} onChange={(e) => setComplement(e.target.value)} /></div>
                        </div>
                    </div>
                  )}
                  <div className="md:col-span-2 space-y-3"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome do Destinatário</label><input className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:bg-white focus:border-black transition-all font-black uppercase" placeholder="Nome Completo" defaultValue={currentUser?.full_name} /></div>
                </div>
                <button onClick={() => address && setStep(2)} disabled={!address || !num || !bestInternalShipping} className="w-full md:w-auto px-16 py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all disabled:opacity-20 active:scale-95">Confirmar e Pagar <ChevronRight className="w-4 h-4" /></button>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-6 mb-10"><div className="p-4 bg-neutral-50 rounded-2xl"><CreditCard className="w-6 h-6" /></div><h3 className="text-xl font-black uppercase italic tracking-tighter">Método de Pagamento</h3></div>
                
                {/* Method Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button onClick={() => { setPaymentMethod('credit_card'); setSelectedSavedCardId(null); }} className={`p-10 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${paymentMethod === 'credit_card' ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]' : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}><CardIcon className="w-8 h-8" /><div className="text-center"><span className="text-[10px] font-black uppercase tracking-widest block mb-1">Cartão de Crédito</span><span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Até 10x sem juros</span></div></button>
                  <button onClick={() => setPaymentMethod('pix')} className={`p-10 border-2 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${paymentMethod === 'pix' ? 'border-black bg-neutral-50 shadow-xl scale-[1.02]' : 'border-neutral-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}><div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-black text-[10px]">PIX</div><div className="text-center"><span className="text-[10px] font-black uppercase tracking-widest block mb-1">PIX Instantâneo</span><span className="text-[9px] text-green-500 font-black uppercase tracking-widest">5% de desconto</span></div></button>
                </div>

                {paymentMethod === 'credit_card' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* SAVED CARDS LIST */}
                        {currentUser?.saved_cards && currentUser.saved_cards.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Cartões Salvos</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {currentUser.saved_cards.map(card => (
                                        <div 
                                            key={card.id} 
                                            onClick={() => setSelectedSavedCardId(card.id === selectedSavedCardId ? null : card.id)}
                                            className={`p-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${selectedSavedCardId === card.id ? 'border-black bg-neutral-900 text-white' : 'border-neutral-100 bg-white hover:border-neutral-300'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-neutral-500">{card.brand}</div>
                                                <div>
                                                    <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                                                    <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Exp: {card.exp_month}/{card.exp_year}</p>
                                                </div>
                                            </div>
                                            {selectedSavedCardId === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                                        </div>
                                    ))}
                                </div>
                                {selectedSavedCardId && (
                                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-500">
                                        <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* NEW CARD FORM (Only if no saved card selected) */}
                        {!selectedSavedCardId && (
                            <div className="space-y-8 bg-neutral-50/50 p-8 rounded-[2.5rem] border border-neutral-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número do Cartão</label><input className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-mono tracking-widest focus:border-black transition-all" placeholder="0000 0000 0000 0000" /></div>
                                    <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome no Cartão</label><input className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-black uppercase focus:border-black transition-all" placeholder="NOME COMO IMPRESSO" /></div>
                                    <div className="grid grid-cols-2 gap-6 md:col-span-2">
                                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Validade</label><input className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all" placeholder="MM/YY" /></div>
                                        <div className="space-y-2"><label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CVC</label><input className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all" placeholder="123" /></div>
                                    </div>
                                </div>
                                
                                {/* Save Card Checkbox */}
                                {currentUser && (
                                    <div className="flex items-center gap-4 p-4 border border-dashed border-neutral-200 rounded-2xl hover:border-black transition-all cursor-pointer" onClick={() => setSaveCardForFuture(!saveCardForFuture)}>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveCardForFuture ? 'bg-black border-black' : 'border-neutral-300'}`}>
                                            {saveCardForFuture && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest block">Salvar Cartão</span>
                                            <span className="text-[9px] text-neutral-400 block mt-0.5">Armazenamento seguro criptografado para compras futuras.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {paymentMethod === 'pix' && (
                     <div className="bg-neutral-900 text-white rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center space-y-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-6 bg-white rounded-[2.5rem] shadow-inner"><QrCode className="w-40 h-40 text-black" /></div>
                        <div className="space-y-3"><h4 className="text-xl font-black uppercase italic tracking-tighter">Escanear QR Code</h4><p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">Abra o app do seu banco e aponte a câmera. O pagamento é processado instantaneamente.</p></div>
                        <button onClick={handleCopyPix} className="flex items-center gap-4 px-10 py-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group"><Copy className="w-4 h-4 text-white/60 group-hover:text-white" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">{pixCopied ? 'Copiado!' : 'Copiar Chave PIX'}</span></button>
                     </div>
                )}

                <div className="flex gap-4 pt-12"><button onClick={() => setStep(1)} className="px-10 py-6 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all">Voltar</button><button onClick={() => setStep(3)} className="flex-1 py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all active:scale-95">Revisar Pedido <ChevronRight className="w-4 h-4" /></button></div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-12 animate-in fade-in slide-in-from-left duration-700 text-center py-20 bg-neutral-50/50 rounded-[4rem] border border-dashed border-neutral-200">
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center mb-10 shadow-2xl"><ShieldCheck className="w-12 h-12" /></div>
                   <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Finalização Segura</h3>
                   <p className="text-sm text-neutral-400 max-w-md mx-auto mb-12 leading-relaxed">Seu pedido passará por uma análise de segurança automática e será despachado em até 24h úteis.</p>
                   <div className="flex gap-4 w-full max-w-sm px-4"><button onClick={() => setStep(2)} className="flex-1 px-8 py-6 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all">Editar</button><button onClick={handleCompleteOrder} className="flex-[2] py-8 bg-black text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.05] transition-all active:scale-95">CONCLUIR COMPRA</button></div>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-5">
             <div className="bg-neutral-50 rounded-[3rem] p-10 md:p-12 sticky top-32 border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10 border-b border-neutral-100 pb-6"><ShoppingBag className="w-5 h-5 text-neutral-400" /><h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Sua Sacola</h4></div>
                <div className="space-y-8 mb-12 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                   {items.map((item, idx) => (
                     <div key={idx} className="flex gap-6 items-center animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="w-20 h-24 bg-white rounded-2xl overflow-hidden flex-none border border-neutral-100 shadow-sm"><img src={item.image} className="w-full h-full object-cover" /></div>
                        <div className="flex-1"><h5 className="text-[11px] font-black uppercase tracking-tight leading-tight mb-1">{getLoc(item.name)}</h5><p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">{getLoc(item.color_name)} | {item.size}</p><p className="text-[10px] font-black mt-2">Qtd: {item.quantity}</p></div><span className="text-[12px] font-black tracking-tighter">{formatCurrency(item.price * item.quantity, locale)}</span>
                     </div>
                   ))}
                </div>
                <div className="space-y-4 pt-10 border-t border-neutral-200">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400"><span>Subtotal</span><span>{formatCurrency(subtotal, locale)}</span></div>
                   
                   {/* FREIGHT DISPLAY LOGIC */}
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      <span>Frete</span>
                      <div className="flex items-center gap-2">
                        {calculatingShipping ? (
                            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Calc...</span>
                        ) : shippingDisplay ? (
                            <>
                                <span className="line-through text-neutral-300 decoration-red-400 decoration-2">
                                    {formatCurrency(shippingDisplay.price, locale)}
                                </span>
                                <span className="text-green-500 font-black">GRÁTIS</span>
                            </>
                        ) : (
                            <span className="text-neutral-300">Aguardando CEP</span>
                        )}
                      </div>
                   </div>
                   {shippingDisplay && !calculatingShipping && (
                       <div className="text-right text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                           Prazo Estimado: {shippingDisplay.days} dias úteis
                       </div>
                   )}

                   {paymentMethod === 'pix' && (<div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-500"><span>Desconto PIX (5%)</span><span>-{formatCurrency(total * 0.05, locale)}</span></div>)}
                   
                   <div className="flex justify-between items-center pt-8 mt-6 border-t border-neutral-100">
                      <span className="text-xl font-black uppercase italic tracking-tighter">Total</span>
                      <span className="text-4xl font-light tracking-tighter">{formatCurrency(paymentMethod === 'pix' ? total * 0.95 : total, locale)}</span>
                   </div>
                </div>
                <div className="mt-12 p-8 bg-white rounded-3xl border border-neutral-100 flex items-center gap-5 shadow-sm"><ShieldCheck className="w-6 h-6 text-neutral-300" /><span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-loose">Transação protegida por criptografia militar de 256 bits via Auricapri Cloud Protocol.</span></div>
             </div>
          </div>
        </div>
      </div>
      {/* Map Address Picker Modal */}
      {isMapPickerOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[70vh]">
            <div className="w-full md:w-1/2 relative bg-neutral-100 flex items-center justify-center"><div ref={pickerContainerRef} className="w-full h-full" /><div className="absolute top-8 left-8 right-8 z-10"><div className="relative group"><input className="w-full p-6 pr-16 bg-white border-none rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest outline-none placeholder:text-neutral-300" placeholder="Busque sua rua e cidade..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePickerSearch()} /><button onClick={handlePickerSearch} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-xl hover:scale-105 transition-all">{isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</button></div>{searchResults.length > 0 && (<div className="mt-2 bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">{searchResults.map((res, idx) => (<button key={idx} onClick={() => handleSelectSearchResult(res)} className="w-full p-4 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"><p className="text-[10px] font-black uppercase tracking-widest">{res.text}</p><p className="text-[9px] text-neutral-400 truncate">{res.place_name}</p></button>))}</div>)}</div></div>
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between overflow-y-auto no-scrollbar"><div className="space-y-12"><div className="flex justify-between items-center"><div><h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">Localizador</h2><p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Confirme os detalhes do endereço</p></div><button onClick={() => setIsMapPickerOpen(false)} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"><X className="w-5 h-5" /></button></div><div className="space-y-8"><div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Rua / Logradouro</label><input className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-black transition-all" value={manualAddress.street} onChange={e => setManualAddress({...manualAddress, street: e.target.value})} placeholder="NOME DA RUA" /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Bairro</label><input className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none" value={manualAddress.neighborhood} onChange={e => setManualAddress({...manualAddress, neighborhood: e.target.value})} /></div><div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Cidade</label><input className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none" value={manualAddress.city} onChange={e => setManualAddress({...manualAddress, city: e.target.value})} /></div></div></div></div><button onClick={confirmManualAddress} disabled={!manualAddress.street || !manualAddress.city} className="w-full py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 mt-12 hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all"><Check className="w-4 h-4" /> Confirmar Localização</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutView;
