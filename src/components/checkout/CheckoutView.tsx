
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Lock,
  Tag,
  Ticket,
  Info
} from 'lucide-react';
import { CartItem, InternalLogisticsInfo, UserProfile, SavedCard, StoreConfig, UserMode, Coupon } from '../../types';
import { Locale } from '../../i18n';
import { MAPBOX_TOKEN, getMapboxStyle } from '../../utils/mapbox';
import { formatCurrency } from '../../utils/currency';
import { LogisticsService, ShippingOption } from '../../services/logistics.service';
import { CouponsRepository } from '../../api/repositories/coupons.repository';

interface CheckoutViewProps {
  items: CartItem[];
  currentUser: UserProfile | null; // Pass user to check for saved data
  storeConfig?: StoreConfig; // Store config for PIX key
  userMode: UserMode; // User mode for validation
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

const CheckoutView: React.FC<CheckoutViewProps> = ({ items, currentUser, storeConfig, userMode, onBack, onComplete, locale, t }) => {
  const logisticsService = new LogisticsService();
  const [step, setStep] = useState(1);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  
  // Shipping States
  const [shippingDisplay, setShippingDisplay] = useState<{ price: number, days: number } | null>(null);
  const [bestInternalShipping, setBestInternalShipping] = useState<InternalLogisticsInfo | null>(null);
  // Multiple shipping options for atacado mode
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  
  const [mapError, setMapError] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [splitCards, setSplitCards] = useState(false);
  const [card1Amount, setCard1Amount] = useState<number>(0);
  const [pixCopied, setPixCopied] = useState(false);
  const [useCashback, setUseCashback] = useState(false);
  
  // Saved Cards Logic
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [selectedSavedCardId2, setSelectedSavedCardId2] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false); // Flag to save new card
  
  // Card Form Data
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const [cardNumber2, setCardNumber2] = useState('');
  const [cardName2, setCardName2] = useState('');
  const [cardExpiry2, setCardExpiry2] = useState('');
  const [cardCvc2, setCardCvc2] = useState('');
  
  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };
  
  // Format expiry date MM/YY
  const formatExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  };
  
  // Format CVC (only numbers, max 4)
  const formatCvc = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 4);
  };

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(items);

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
    state: '',
    cep: ''
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

  // Update checkoutItems when items change
  useEffect(() => {
    setCheckoutItems(items);
  }, [items]);

  // Items that already have a coupon applied (from product page)
  const itemsWithCoupon = useMemo(() => 
    checkoutItems.filter(item => item.applied_coupon_code), 
    [checkoutItems]
  );
  
  // Items eligible for manual coupon (no coupon applied yet)
  const itemsWithoutCoupon = useMemo(() => 
    checkoutItems.filter(item => !item.applied_coupon_code), 
    [checkoutItems]
  );

  // Calculate subtotal from checkoutItems (with applied discounts)
  const safeItems = Array.isArray(checkoutItems) ? checkoutItems : [];
  const subtotal = safeItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  
  // Calculate original subtotal (before any discounts) for display
  const originalSubtotal = safeItems.reduce((sum, item) => {
    const originalPrice = item?.original_price || item?.price || 0;
    return sum + (originalPrice * (item?.quantity || 0));
  }, 0);
  
  // Total discount from pre-applied coupons
  const preAppliedDiscount = originalSubtotal - subtotal;
  
  // Manual coupon discount (only applies to items without coupon)
  const manualCouponDiscount = useMemo(() => {
    if (!appliedCoupon || itemsWithoutCoupon.length === 0) return 0;
    
    const eligibleSubtotal = itemsWithoutCoupon.reduce(
      (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 
      0
    );
    
    if (appliedCoupon.discount_type === 'percentage') {
      return eligibleSubtotal * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, eligibleSubtotal);
  }, [appliedCoupon, itemsWithoutCoupon]);
  
  // In atacado mode, add shipping cost to total
  const shippingCost = userMode === UserMode.ATACADO && selectedShippingOption 
    ? selectedShippingOption.display_price_was 
    : 0;
  
  // Calculate cashback available
  const availableCashback = currentUser?.loyalty?.cashback_balance || 0;
  
  // Calculate total before cashback and PIX discount
  const totalBeforeDiscounts = subtotal - manualCouponDiscount + shippingCost;
  
  // Apply PIX discount first (if applicable)
  const pixDiscount = paymentMethod === 'pix' ? totalBeforeDiscounts * 0.05 : 0;
  const totalAfterPix = totalBeforeDiscounts - pixDiscount;
  
  // Apply cashback discount (limited to total after PIX, never negative)
  const cashbackUsed = useCashback ? Math.min(availableCashback, Math.max(0, totalAfterPix)) : 0;
  const finalTotal = Math.max(0, totalAfterPix - cashbackUsed);

  useEffect(() => {
    if (splitCards && finalTotal > 0) {
      setCard1Amount(finalTotal / 2);
    } else {
      setCard1Amount(finalTotal);
    }
  }, [splitCards, finalTotal]);

  // Apply coupon handler
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    setCouponError(null);
    
    try {
      const couponsRepo = new CouponsRepository();
      const coupon = await couponsRepo.getByCode(couponCode.trim().toUpperCase());
      
      if (!coupon) {
        setCouponError('Cupom inválido ou expirado');
        setCouponLoading(false);
        return;
      }
      
      // Check if coupon is expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('Este cupom expirou');
        setCouponLoading(false);
        return;
      }
      
      // Check minimum purchase (only for eligible items)
      const eligibleSubtotal = itemsWithoutCoupon.reduce(
        (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 
        0
      );
      
      if (coupon.min_purchase_amount && eligibleSubtotal < coupon.min_purchase_amount) {
        setCouponError(`Compra mínima de ${formatCurrency(coupon.min_purchase_amount, locale)} para itens elegíveis`);
        setCouponLoading(false);
        return;
      }
      
      // Check if coupon is product-specific and applies to any eligible item
      if (coupon.product_ids && coupon.product_ids.length > 0) {
        const hasEligibleProduct = itemsWithoutCoupon.some(
          item => coupon.product_ids?.includes(item.product_id)
        );
        if (!hasEligibleProduct) {
          setCouponError('Este cupom não é válido para os produtos elegíveis');
          setCouponLoading(false);
          return;
        }
      }
      
      if (itemsWithoutCoupon.length === 0) {
        setCouponError('Todos os itens já possuem cupom aplicado');
        setCouponLoading(false);
        return;
      }
      
      setAppliedCoupon(coupon);
      setCouponCode('');
    } catch {
      setCouponError('Erro ao validar cupom');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // AUTO-FILL DEFAULT ADDRESS
  useEffect(() => {
      if (currentUser?.default_address && !address) {
          const def = currentUser.default_address;
          
          // Parse street_address format: "logradouro, numero - bairro - complemento"
          // or it might be in line1/line2 format from SavedAddress type
          let logradouro = '';
          let bairro = '';
          
          if ((def as any).street_address) {
            // Backend format: "logradouro, numero - bairro - complemento"
            const streetAddr = (def as any).street_address;
            const parts = streetAddr.split(' - ');
            
            if (parts.length > 0) {
              // First part contains logradouro and possibly numero
              const firstPart = parts[0];
              logradouro = firstPart; // Keep full first part as logradouro
            }
            
            if (parts.length > 1) {
              // Second part is usually bairro
              bairro = parts[1];
            }
          } else if (def.line1) {
            // Frontend SavedAddress format
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
            // Calculate logistics after address is set
            setTimeout(() => {
              // Use logisticsService directly to avoid dependency issues
              if (userMode === UserMode.ATACADO) {
                logisticsService.calculateShippingOptions(cepValue, newAddress).then(options => {
                  if (!Array.isArray(options) || options.length === 0) {
                    console.error('No shipping options returned');
                    return;
                  }
                  setShippingOptions(options);
                  const cheapest = options.reduce((prev, curr) => 
                    (curr?.real_cost || 0) < (prev?.real_cost || 0) ? curr : prev
                  );
                  setSelectedShippingOption(cheapest);
                  setShippingDisplay({
                    price: cheapest.display_price_was,
                    days: cheapest.display_days_was
                  });
                  setBestInternalShipping({
                    provider: cheapest.provider,
                    method: cheapest.method,
                    real_cost: cheapest.real_cost,
                    estimated_days: cheapest.estimated_days,
                    display_price_was: cheapest.display_price_was,
                    display_days_was: cheapest.display_days_was
                  });
                }).catch(err => console.error('Error calculating shipping:', err));
              } else {
                logisticsService.calculateShipping(cepValue, newAddress).then(logisticsInfo => {
                  setShippingDisplay({
                    price: logisticsInfo.display_price_was,
                    days: logisticsInfo.display_days_was
                  });
                  setBestInternalShipping(logisticsInfo);
                }).catch(err => console.error('Error calculating shipping:', err));
              }
            }, 100);
          }
      }
  }, [currentUser, address, userMode]);

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

  // Check if Mapbox is loaded
  useEffect(() => {
    const checkMapbox = () => {
      const win = window as any;
      if (win.mapboxgl) {
        setMapboxLoaded(true);
        win.mapboxgl.accessToken = MAPBOX_TOKEN;
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkMapbox()) {
      return;
    }

    // If not loaded, wait for script to load
    const interval = setInterval(() => {
      if (checkMapbox()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkMapbox()) {
        console.error('Mapbox GL JS failed to load');
        setMapError(true);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Inicializa o Mapa Principal
  useEffect(() => {
    if (!mapboxLoaded || !address || !mapContainerRef.current || mapError) {
      return;
    }

    let isMounted = true;
    const initializeMap = async () => {
        const win = window as any;
        const mapboxgl = win.mapboxgl;
        if (!mapboxgl) {
          setMapError(true);
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;
        
        if (!mapRef.current) {
            try {
                mapRef.current = new mapboxgl.Map({
                    container: mapContainerRef.current!,
                    style: getMapboxStyle(),
                    center: [-46.6333, -23.5505],
                    zoom: 13,
                    attributionControl: false,
                    trackResize: false 
                });
                
                mapRef.current.on('load', () => {
                  console.log('Mapbox map loaded successfully');
                });
                
                mapRef.current.on('error', (e: any) => {
                  console.error('Mapbox error:', e);
                  setMapError(true);
                });
            } catch (e) {
                console.error('Failed to initialize map:', e);
                setMapError(true);
                return;
            }
        }
        
        const fullAddress = (!address.cep || address.cep === 'Manual') 
            ? `${address.logradouro}, ${address.localidade} - ${address.uf}`
            : `${address.logradouro}, ${address.bairro || ''}, ${address.localidade} - ${address.uf}`;
        
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
            } catch (e) {
              console.error('Error updating map:', e);
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
  }, [address, mapError, mapboxLoaded]);

  const updatePickerMarker = useCallback((coords: [number, number]) => {
      const win = window as any;
      if (!pickerMapRef.current || !win.mapboxgl || !mapboxLoaded) return;
      
      try {
        if (!pickerMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.innerHTML = '<div class="marker-pin"></div><div class="marker-pulse"></div>';
            pickerMarkerRef.current = new win.mapboxgl.Marker(el).setLngLat(coords).addTo(pickerMapRef.current);
        } else {
            pickerMarkerRef.current.setLngLat(coords);
        }
        pickerMapRef.current.flyTo({ center: coords, zoom: 15, essential: true });
      } catch(e) {
        console.error('Error updating picker marker:', e);
      }
  }, [mapboxLoaded]);

  // Mapa do Picker
  useEffect(() => {
    if (!mapboxLoaded || !isMapPickerOpen || !pickerContainerRef.current) {
      return;
    }

    let picker: any = null;
    const win = window as any;
    const mapboxgl = win.mapboxgl;
    
    if (!mapboxgl) {
      console.error('Mapbox GL JS not available');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      if (pickerMapRef.current) { 
        pickerMapRef.current.remove(); 
        pickerMapRef.current = null; 
      }
      
      picker = new mapboxgl.Map({
        container: pickerContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505],
        zoom: 11,
        attributionControl: false,
        trackResize: false
      });
      
      pickerMapRef.current = picker;
      
      picker.on('load', () => {
        console.log('Picker map loaded successfully');
        setTimeout(() => { 
          try { 
            if(pickerMapRef.current) pickerMapRef.current.resize(); 
          } catch(e) {
            console.error('Error resizing picker map:', e);
          }
        }, 500);
      });
      
      picker.on('error', (e: any) => {
        console.error('Picker map error:', e);
      });
      
      const handleMapClick = async (e: any) => {
         const { lng, lat } = e.lngLat;
         updatePickerMarker([lng, lat]);
         try {
             const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=br`);
             const data = await res.json();
             if(data.features && data.features.length > 0) {
               await parseAndSetAddress(data.features[0]);
             }
         } catch(err) { 
           console.error('Geocoding error:', err); 
         }
      };
      
      picker.on('click', handleMapClick);
    } catch (err) {
      console.error('Failed to initialize picker map:', err);
    }
    
    return () => {
      if (pickerMapRef.current) {
          try { pickerMapRef.current.remove(); } catch(e){}
          pickerMapRef.current = null;
          pickerMarkerRef.current = null;
      }
    };
  }, [isMapPickerOpen, mapboxLoaded, updatePickerMarker]);

  const handlePickerSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=5&types=address,place,locality,neighborhood`);
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch (e) { } finally { setIsSearching(false); }
  };

  const parseAndSetAddress = async (feature: any) => {
      const context = feature.context || [];
      const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'))?.text || 
                          context.find((c: any) => c.id.startsWith('locality'))?.text || '';
      const city = context.find((c: any) => c.id.startsWith('place'))?.text || feature.place_name?.split(',')[1]?.trim() || '';
      const state = context.find((c: any) => c.id.startsWith('region'))?.short_code?.replace('BR-', '') || '';
      let postcode = context.find((c: any) => c.id.startsWith('postcode'))?.text || '';
      
      const street = feature.text || feature.place_name?.split(',')[0] || '';
      
      // If CEP is missing but we have address info, try to get it via ViaCEP
      if (!postcode && street && city && state) {
        try {
          const searchUrl = `https://viacep.com.br/ws/${state}/${city}/${encodeURIComponent(street)}/json/`;
          const res = await fetch(searchUrl);
          const data = await res.json();
          
          if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
            postcode = data[0].cep || '';
            // Use neighborhood from ViaCEP if Mapbox didn't provide it
            const finalNeighborhood = neighborhood || data[0].bairro || '';
            
            setManualAddress({ 
              street, 
              neighborhood: finalNeighborhood, 
              city, 
              state,
              cep: postcode ? postcode.replace(/(\d{5})(\d{3})/, '$1-$2') : ''
            });
            return;
          }
        } catch (err) {
          console.error('Error fetching CEP from ViaCEP:', err);
        }
      }
      
      setManualAddress({ 
        street, 
        neighborhood, 
        city, 
        state,
        cep: postcode ? postcode.replace(/(\d{5})(\d{3})/, '$1-$2') : ''
      });
  };

  const handleSelectSearchResult = async (result: any) => {
      await parseAndSetAddress(result);
      setSearchResults([]);
      setSearchQuery('');
      if (result.center) updatePickerMarker(result.center);
  };

  const confirmManualAddress = async () => {
    // Use real CEP if available, otherwise try to get it via ViaCEP API
    let finalCep = manualAddress.cep?.replace(/\D/g, '') || '';
    
    // If CEP is missing but we have address info, try to get it via ViaCEP
    if (!finalCep && manualAddress.street && manualAddress.city && manualAddress.state) {
      try {
        // Try to search CEP by address using ViaCEP
        const searchUrl = `https://viacep.com.br/ws/${manualAddress.state}/${manualAddress.city}/${encodeURIComponent(manualAddress.street)}/json/`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
          finalCep = data[0].cep?.replace(/\D/g, '') || '';
          // Update manualAddress with found CEP and neighborhood if missing
          if (finalCep) {
            setManualAddress(prev => ({
              ...prev,
              cep: finalCep.replace(/(\d{5})(\d{3})/, '$1-$2'),
              neighborhood: prev.neighborhood || data[0].bairro || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching CEP from ViaCEP:', err);
      }
    }
    
    // Ensure we have the formatted CEP
    const formattedCep = finalCep ? finalCep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';
    
    setAddress({ 
      logradouro: manualAddress.street, 
      bairro: manualAddress.neighborhood || '', 
      localidade: manualAddress.city, 
      uf: manualAddress.state,
      cep: formattedCep || undefined
    });
    
    // Set CEP in the form field
    setCep(formattedCep);
    
    setIsMapPickerOpen(false);
    
    // Calculate logistics with CEP if available, otherwise use address
    if (finalCep) {
      calculateLogistics(finalCep);
    } else {
      calculateLogistics('Manual');
    }
  };

  const calculateLogistics = async (destCep: string) => {
    setCalculatingShipping(true);
    setShippingDisplay(null);
    setBestInternalShipping(null);
    setShippingOptions([]);
    setSelectedShippingOption(null);

    try {
      if (userMode === UserMode.ATACADO) {
        // Get multiple options for atacado mode
        const options = await logisticsService.calculateShippingOptions(destCep, address || undefined);
        if (!Array.isArray(options) || options.length === 0) {
          console.error('No shipping options returned');
          setCalculatingShipping(false);
          return;
        }
        setShippingOptions(options);
        
        // Select cheapest by default
        const cheapest = options.reduce((prev, curr) => 
          (curr?.real_cost || Infinity) < (prev?.real_cost || Infinity) ? curr : prev
        );
        setSelectedShippingOption(cheapest);
        
        setShippingDisplay({
          price: cheapest.display_price_was,
          days: cheapest.display_days_was
        });
        
        setBestInternalShipping({
          provider: cheapest.provider,
          method: cheapest.method,
          real_cost: cheapest.real_cost,
          estimated_days: cheapest.estimated_days,
          display_price_was: cheapest.display_price_was,
          display_days_was: cheapest.display_days_was
        });
      } else {
        // Single option for varejo mode (free shipping)
        const logisticsInfo = await logisticsService.calculateShipping(destCep, address || undefined);
        
        setShippingDisplay({
          price: logisticsInfo.display_price_was,
          days: logisticsInfo.display_days_was
        });

        setBestInternalShipping(logisticsInfo);
      }
    } catch (err) {
      console.error('Error calculating logistics:', err);
      // Fallback to free shipping on error
      setBestInternalShipping({
        provider: 'correios',
        method: 'PAC',
        real_cost: 0,
        estimated_days: 0,
        display_price_was: 0,
        display_days_was: 0
      });
    } finally {
      setCalculatingShipping(false);
    }
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
    // TODO: Add pix_key to StoreConfig or fetch from another source
    // For now, use a placeholder - this should be configured in store settings
    const pixKey = (storeConfig as any)?.pix_key || '';
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    } else {
      // Show error if PIX key is not configured
      console.warn('PIX key not configured in store settings');
    }
  };

  const handleCompleteOrder = () => {
      // Validate minimum quantity for atacado mode
      if (userMode === UserMode.ATACADO) {
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          if (totalQuantity < 10) {
              alert(`Mínimo de 10 peças necessário no modo Atacado. Você tem ${totalQuantity} peça(s) no carrinho.`);
              return;
          }
      }

      // Use selected shipping option for atacado, or bestInternalShipping for varejo
      const shippingToUse = userMode === UserMode.ATACADO && selectedShippingOption
          ? {
              provider: selectedShippingOption.provider,
              method: selectedShippingOption.method,
              real_cost: selectedShippingOption.real_cost,
              estimated_days: selectedShippingOption.estimated_days,
              display_price_was: selectedShippingOption.display_price_was,
              display_days_was: selectedShippingOption.display_days_was
            }
          : bestInternalShipping;

      if(address && shippingToUse) {
          const finalAddress = { ...address, numero: num, complemento: complement };
          
          // Pass Saved Card Token if selected
          let tokenToUse;
          if (paymentMethod === 'credit_card' && selectedSavedCardId) {
              const saved = currentUser?.saved_cards?.find(c => c.id === selectedSavedCardId);
              tokenToUse = saved?.gateway_token;
          }

          onComplete(
              finalAddress, 
              shippingToUse, 
              paymentMethod, 
              finalTotal, 
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
                                {(mapError || !mapboxLoaded) && (
                                  <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                                    <div className="text-center">
                                      <MapPin className="w-6 h-6 text-white/20 mx-auto mb-2" />
                                      <p className="text-[10px] text-white/40">Carregando mapa...</p>
                                    </div>
                                  </div>
                                )}
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
                        {/* CASHBACK OPTION */}
                        {currentUser && availableCashback > 0 && (
                            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-[10px] font-black">R$</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest block text-emerald-900">Cashback Disponível</span>
                                        <span className="text-lg font-light tracking-tighter text-emerald-700">{formatCurrency(availableCashback, locale)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUseCashback(!useCashback)}
                                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                                        useCashback ? 'bg-emerald-600' : 'bg-neutral-300'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                            useCashback ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        )}

                        {/* SPLIT CARDS SWITCH - Minimalista */}
                        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900">Dividir em dois cartões</span>
                            <button
                                onClick={() => {
                                    setSplitCards(!splitCards);
                                    if (!splitCards) {
                                        setSelectedSavedCardId2(null);
                                        setCardNumber2('');
                                        setCardName2('');
                                        setCardExpiry2('');
                                        setCardCvc2('');
                                    }
                                }}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                                    splitCards ? 'bg-black' : 'bg-neutral-300'
                                }`}
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                        splitCards ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* CARD 1 */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">
                                {splitCards ? 'Cartão 1' : 'Cartão de Pagamento'}
                            </h4>
                            
                            {/* SAVED CARDS LIST */}
                            {currentUser?.saved_cards && currentUser.saved_cards.length > 0 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {currentUser.saved_cards
                                            .filter(card => !splitCards || card.id !== selectedSavedCardId2)
                                            .map(card => (
                                            <div 
                                                key={card.id} 
                                                onClick={() => {
                                                    setSelectedSavedCardId(card.id === selectedSavedCardId ? null : card.id);
                                                    if (card.id !== selectedSavedCardId) {
                                                        setCardNumber('');
                                                        setCardName('');
                                                        setCardExpiry('');
                                                        setCardCvc('');
                                                    }
                                                }}
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
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número do Cartão</label>
                                            <input 
                                                className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-mono tracking-widest focus:border-black transition-all" 
                                                placeholder="0000 0000 0000 0000"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                maxLength={19}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome no Cartão</label>
                                            <input 
                                                className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-black uppercase focus:border-black transition-all" 
                                                placeholder="NOME COMO IMPRESSO"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6 md:col-span-2">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Validade</label>
                                                <input 
                                                    className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all" 
                                                    placeholder="MM/YY"
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                                    maxLength={5}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CVC</label>
                                                <input 
                                                    className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all" 
                                                    placeholder="123"
                                                    type="password"
                                                    value={cardCvc}
                                                    onChange={(e) => setCardCvc(formatCvc(e.target.value))}
                                                    maxLength={4}
                                                />
                                            </div>
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

                        {/* CARD 2 (Only if splitCards is enabled) */}
                        {splitCards && (
                            <div className="space-y-6 pt-6 border-t border-neutral-200">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-2">Cartão 2</h4>
                                
                                {/* SAVED CARDS LIST */}
                                {currentUser?.saved_cards && currentUser.saved_cards.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {currentUser.saved_cards
                                                .filter(card => card.id !== selectedSavedCardId)
                                                .map(card => (
                                                <div 
                                                    key={card.id} 
                                                    onClick={() => {
                                                        setSelectedSavedCardId2(card.id === selectedSavedCardId2 ? null : card.id);
                                                        if (card.id !== selectedSavedCardId2) {
                                                            setCardNumber2('');
                                                            setCardName2('');
                                                            setCardExpiry2('');
                                                            setCardCvc2('');
                                                        }
                                                    }}
                                                    className={`p-6 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${selectedSavedCardId2 === card.id ? 'border-black bg-neutral-900 text-white' : 'border-neutral-100 bg-white hover:border-neutral-300'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-6 bg-neutral-200 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-neutral-500">{card.brand}</div>
                                                        <div>
                                                            <p className="text-sm font-mono font-bold tracking-widest">•••• •••• •••• {card.last4}</p>
                                                            <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Exp: {card.exp_month}/{card.exp_year}</p>
                                                        </div>
                                                    </div>
                                                    {selectedSavedCardId2 === card.id && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                                                </div>
                                            ))}
                                        </div>
                                        {selectedSavedCardId2 && (
                                            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-center gap-3 text-[10px] font-bold text-neutral-500">
                                                <Lock className="w-3 h-3" /> Usando token seguro criptografado. Nenhum dado sensível trafega pela rede.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* NEW CARD FORM (Only if no saved card selected) */}
                                {!selectedSavedCardId2 && (
                                    <div className="space-y-8 bg-neutral-50/50 p-8 rounded-[2.5rem] border border-neutral-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Número do Cartão</label>
                                                <input 
                                                    className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-mono tracking-widest focus:border-black transition-all" 
                                                    placeholder="0000 0000 0000 0000"
                                                    value={cardNumber2}
                                                    onChange={(e) => setCardNumber2(formatCardNumber(e.target.value))}
                                                    maxLength={19}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome no Cartão</label>
                                                <input 
                                                    className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none font-black uppercase focus:border-black transition-all" 
                                                    placeholder="NOME COMO IMPRESSO"
                                                    value={cardName2}
                                                    onChange={(e) => setCardName2(e.target.value.toUpperCase())}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 md:col-span-2">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Validade</label>
                                                    <input 
                                                        className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all" 
                                                        placeholder="MM/YY"
                                                        value={cardExpiry2}
                                                        onChange={(e) => setCardExpiry2(formatExpiry(e.target.value))}
                                                        maxLength={5}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CVC</label>
                                                    <input 
                                                        className="w-full p-6 bg-white border border-neutral-100 rounded-2xl outline-none focus:border-black transition-all" 
                                                        placeholder="123"
                                                        type="password"
                                                        value={cardCvc2}
                                                        onChange={(e) => setCardCvc2(formatCvc(e.target.value))}
                                                        maxLength={4}
                                                    />
                                                </div>
                                            </div>
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
                <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-4 no-scrollbar">
                   {Array.isArray(checkoutItems) && checkoutItems.length > 0 ? checkoutItems.map((item, idx) => {
                     const hasDiscount = item.original_price && item.original_price > item.price;
                     const hasCoupon = !!item.applied_coupon_code;
                     
                     return (
                       <div key={idx} className="flex gap-4 items-start animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-none border border-neutral-100 shadow-sm"><img src={item?.image || ''} className="w-full h-full object-cover" alt={getLoc(item?.name)} /></div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[10px] font-black uppercase tracking-tight leading-tight mb-1 truncate">{getLoc(item?.name)}</h5>
                            <p className="text-[8px] text-neutral-400 uppercase font-bold tracking-widest">{getLoc(item?.color_name)} | {item?.size || 'N/A'}</p>
                            <p className="text-[9px] font-black mt-1">Qtd: {item?.quantity || 0}</p>
                            {hasCoupon && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600">{item.applied_coupon_code}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {hasDiscount && (
                              <span className="text-[9px] text-neutral-400 line-through block">{formatCurrency(item.original_price! * (item?.quantity || 0), locale)}</span>
                            )}
                            <span className={`text-[11px] font-black tracking-tighter ${hasCoupon ? 'text-emerald-600' : ''}`}>{formatCurrency((item?.price || 0) * (item?.quantity || 0), locale)}</span>
                          </div>
                       </div>
                     );
                   }) : (
                     <div className="text-center py-8 text-neutral-400 text-sm">Nenhum item no carrinho</div>
                   )}
                </div>

                {/* COUPON SECTION */}
                <div className="mb-8 pt-6 border-t border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="w-4 h-4 text-neutral-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Cupom de Desconto</span>
                  </div>
                  
                  {/* Info about items with pre-applied coupons */}
                  {itemsWithCoupon.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                            {itemsWithCoupon.length} {itemsWithCoupon.length === 1 ? 'item já possui' : 'itens já possuem'} cupom aplicado
                          </p>
                          <p className="text-[8px] text-emerald-600 mt-0.5">
                            Novos cupons serão aplicados apenas nos outros {itemsWithoutCoupon.length} {itemsWithoutCoupon.length === 1 ? 'item' : 'itens'}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {appliedCoupon ? (
                    <div className="bg-black text-white rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest block">{appliedCoupon.code}</span>
                          <span className="text-[8px] text-white/60 block mt-0.5">
                            {appliedCoupon.discount_type === 'percentage' 
                              ? `${appliedCoupon.discount_value}% de desconto`
                              : `${formatCurrency(appliedCoupon.discount_value, locale)} de desconto`
                            }
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="DIGITE O CUPOM"
                          className="flex-1 p-4 bg-white border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all placeholder:text-neutral-300"
                          disabled={itemsWithoutCoupon.length === 0}
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim() || itemsWithoutCoupon.length === 0}
                          className="px-6 py-4 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                          {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-[9px] font-bold">{couponError}</span>
                        </div>
                      )}
                      {itemsWithoutCoupon.length === 0 && (
                        <p className="text-[8px] text-neutral-400 text-center">
                          Todos os itens já possuem cupom aplicado
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-neutral-200">
                   {preAppliedDiscount > 0 && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                       <span>Desconto (cupons do produto)</span>
                       <span>-{formatCurrency(preAppliedDiscount, locale)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400"><span>Subtotal</span><span>{formatCurrency(subtotal, locale)}</span></div>
                   {manualCouponDiscount > 0 && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                       <span>Desconto ({appliedCoupon?.code})</span>
                       <span>-{formatCurrency(manualCouponDiscount, locale)}</span>
                     </div>
                   )}
                   
                   {/* FREIGHT DISPLAY LOGIC */}
                   {userMode === UserMode.ATACADO && shippingOptions.length > 0 ? (
                     <div className="space-y-3">
                       <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">
                         Opções de Frete
                       </div>
                       {shippingOptions.map((option, idx) => {
                         const isSelected = selectedShippingOption?.method === option.method;
                         const isCheapest = option.real_cost === Math.min(...shippingOptions.map(o => o.real_cost));
                         const isFastest = option.estimated_days === Math.min(...shippingOptions.map(o => o.estimated_days));
                         
                         return (
                           <button
                             key={idx}
                             onClick={() => setSelectedShippingOption(option)}
                             className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                               isSelected 
                                 ? 'border-neutral-900 bg-neutral-50' 
                                 : 'border-neutral-100 hover:border-neutral-300'
                             }`}
                           >
                             <div className="flex justify-between items-start mb-2">
                               <div>
                                 <div className="text-[11px] font-black uppercase tracking-tight">
                                   {option.method} - {option.provider}
                                 </div>
                                 <div className="flex gap-2 mt-1">
                                   {isCheapest && (
                                     <span className="text-[8px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                       Mais Barato
                                     </span>
                                   )}
                                   {isFastest && (
                                     <span className="text-[8px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                       Mais Rápido
                                     </span>
                                   )}
                                 </div>
                               </div>
                               <div className="text-right">
                                 <div className="text-[12px] font-black tracking-tighter">
                                   {formatCurrency(option.display_price_was, locale)}
                                 </div>
                                 <div className="text-[8px] text-neutral-400 uppercase tracking-widest mt-0.5">
                                   {option.estimated_days} dias
                                 </div>
                               </div>
                             </div>
                           </button>
                         );
                       })}
                     </div>
                   ) : (
                     <>
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
                          <span>Frete</span>
                          <div className="flex items-center gap-2">
                            {calculatingShipping ? (
                                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Calc...</span>
                            ) : shippingDisplay ? (
                                <>
                                    <span className="line-through text-neutral-500 decoration-red-500 decoration-2 font-medium">
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
                     </>
                   )}

                   {cashbackUsed > 0 && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                       <span>Cashback Aplicado</span>
                       <span>-{formatCurrency(cashbackUsed, locale)}</span>
                     </div>
                   )}
                   {paymentMethod === 'pix' && (
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-500">
                       <span>Desconto PIX (5%)</span>
                       <span>-{formatCurrency(pixDiscount, locale)}</span>
                     </div>
                   )}
                   
                   <div className="flex justify-between items-center pt-8 mt-6 border-t border-neutral-100">
                      <span className="text-xl font-black uppercase italic tracking-tighter">Total</span>
                      <span className="text-4xl font-light tracking-tighter">{formatCurrency(finalTotal, locale)}</span>
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
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between overflow-y-auto no-scrollbar">
              <div className="space-y-12">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">Localizador</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Confirme os detalhes do endereço</p>
                  </div>
                  <button onClick={() => setIsMapPickerOpen(false)} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Rua / Logradouro</label>
                    <input 
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-black transition-all" 
                      value={manualAddress.street} 
                      onChange={e => setManualAddress({...manualAddress, street: e.target.value})} 
                      placeholder="NOME DA RUA" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Bairro</label>
                      <input 
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all" 
                        value={manualAddress.neighborhood} 
                        onChange={e => setManualAddress({...manualAddress, neighborhood: e.target.value})} 
                        placeholder="BAIRRO"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Cidade</label>
                      <input 
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all" 
                        value={manualAddress.city} 
                        onChange={e => setManualAddress({...manualAddress, city: e.target.value})} 
                        placeholder="CIDADE"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Estado</label>
                      <input 
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all" 
                        value={manualAddress.state} 
                        onChange={e => setManualAddress({...manualAddress, state: e.target.value.toUpperCase()})} 
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">CEP</label>
                      <input 
                        className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all" 
                        value={manualAddress.cep} 
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2');
                          setManualAddress({...manualAddress, cep: formatted});
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={confirmManualAddress} 
                disabled={!manualAddress.street || !manualAddress.city || !manualAddress.neighborhood} 
                className="w-full py-8 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 mt-12 hover:scale-[1.02] active:scale-95 disabled:opacity-20 transition-all"
              >
                <Check className="w-4 h-4" /> Confirmar Localização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutView;
