import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaymentMethod } from '../../../constants/enums';
import { Locale } from '../../../i18n';
import { CouponsApi } from '../../../api/coupons.api';
import { formatCurrency } from '../../../utils/currency';
import { MAPBOX_TOKEN, getMapboxStyle } from '../../../utils/mapbox';
import { maskCep, maskCreditCard, maskExpiryDate, maskPhone, normalizeCepDigits, unmask } from '../../../utils/masks';
import { LogisticsService } from '../../../services/logistics.service';
import {
  AddressData,
  type CartItem,
  type Coupon,
  type InternalLogisticsInfo,
  type LocalizedText,
  type MapboxFeature,
  type StoreConfig,
  UserMode,
  type UserMode as UserModeType,
  type UserProfile,
} from '../../../types';
import { usePaymentProcessing } from './usePaymentProcessing';
import { useShippingCalculation } from './useShippingCalculation';

export type UseCheckoutStateParams = {
  items: CartItem[];
  currentUser: UserProfile | null;
  storeConfig?: StoreConfig;
  userMode: UserModeType;
  onComplete: (
    address: AddressData,
    logistics: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    finalAmount: number,
    saveCard: boolean,
    cardToken?: string,
    phone?: string
  ) => void;
  locale: Locale;
};

export function useCheckoutState(params: UseCheckoutStateParams) {
  const { items, currentUser, storeConfig, userMode, onComplete, locale } = params;

  const logisticsService = useMemo(() => new LogisticsService(), []);

  const [step, setStep] = useState(1);
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState<AddressData | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [hasUserEditedCep, setHasUserEditedCep] = useState(false);

  const shipping = useShippingCalculation({ logisticsService, userMode, address });

  const [mapError, setMapError] = useState(false);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [phone, setPhone] = useState('');
  const [cepError, setCepError] = useState<string | null>(null);
  const [manualCepError, setManualCepError] = useState<string | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [isManualAddress, setIsManualAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [splitCards, setSplitCards] = useState(false);
  const [, setCard1Amount] = useState<number>(0);
  const [useCashback, setUseCashback] = useState(false);

  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string | null>(null);
  const [selectedSavedCardId2, setSelectedSavedCardId2] = useState<string | null>(null);
  const [saveCardForFuture, setSaveCardForFuture] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [cardNumber2, setCardNumber2] = useState('');
  const [cardName2, setCardName2] = useState('');
  const [cardExpiry2, setCardExpiry2] = useState('');
  const [cardCvc2, setCardCvc2] = useState('');

  const formatCardNumber = (value: string): string => maskCreditCard(value);
  const formatExpiry = (value: string): string => maskExpiryDate(value);
  const formatCvc = (value: string): string => value.replace(/\D/g, '').slice(0, 4);

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

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MapboxFeature[]>([]);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
  });

  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const getLoc = (obj: LocalizedText | string | null | undefined) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || '';
  };

  useEffect(() => {
    setCheckoutItems(items);
  }, [items]);

  const itemsWithCoupon = useMemo(
    () => (Array.isArray(checkoutItems) ? checkoutItems : []).filter((item) => item?.applied_coupon_code),
    [checkoutItems]
  );

  const itemsWithoutCoupon = useMemo(
    () => (Array.isArray(checkoutItems) ? checkoutItems : []).filter((item) => !item?.applied_coupon_code),
    [checkoutItems]
  );

  const safeItems = Array.isArray(checkoutItems) ? checkoutItems : [];
  const subtotal = safeItems.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
  const originalSubtotal = safeItems.reduce((sum, item) => {
    const originalPrice = item?.original_price || item?.price || 0;
    return sum + (originalPrice * (item?.quantity || 0));
  }, 0);

  const preAppliedDiscount = originalSubtotal - subtotal;

  const manualCouponDiscount = useMemo(() => {
    if (!appliedCoupon || itemsWithoutCoupon.length === 0) return 0;

    const eligibleSubtotal = itemsWithoutCoupon.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);

    if (appliedCoupon.discount_type === 'percentage') {
      return eligibleSubtotal * (appliedCoupon.discount_value / 100);
    }
    return Math.min(appliedCoupon.discount_value, eligibleSubtotal);
  }, [appliedCoupon, itemsWithoutCoupon]);

  const shippingCost = userMode === UserMode.ATACADO && shipping.selectedShippingOption ? shipping.selectedShippingOption.display_price_was : 0;
  const availableCashback = currentUser?.loyalty?.cashback_balance || 0;
  const totalBeforeDiscounts = subtotal - manualCouponDiscount + shippingCost;
  const pixDiscount = paymentMethod === PaymentMethod.PIX ? totalBeforeDiscounts * 0.05 : 0;
  const totalAfterPix = totalBeforeDiscounts - pixDiscount;
  const cashbackUsed = useCashback ? Math.min(availableCashback, Math.max(0, totalAfterPix)) : 0;
  const finalTotal = Math.max(0, totalAfterPix - cashbackUsed);

  useEffect(() => {
    if (splitCards && finalTotal > 0) {
      setCard1Amount(finalTotal / 2);
    } else {
      setCard1Amount(finalTotal);
    }
  }, [splitCards, finalTotal]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const couponsApi = new CouponsApi();
      const coupon = await couponsApi.getByCode(couponCode.trim().toUpperCase());

      if (!coupon) {
        setCouponError('Cupom inválido ou expirado');
        setCouponLoading(false);
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        setCouponError('Este cupom expirou');
        setCouponLoading(false);
        return;
      }

      const eligibleSubtotal = itemsWithoutCoupon.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);

      if (coupon.min_purchase_amount && eligibleSubtotal < coupon.min_purchase_amount) {
        setCouponError(`Compra mínima de ${formatCurrency(coupon.min_purchase_amount, locale)} para itens elegíveis`);
        setCouponLoading(false);
        return;
      }

      if (coupon.product_ids && coupon.product_ids.length > 0) {
        const hasEligibleProduct = itemsWithoutCoupon.some((item) => coupon.product_ids?.includes(item.product_id));
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

  useEffect(() => {
    if (currentUser?.phone && !phone) {
      setPhone(currentUser.phone);
    }
  }, [currentUser?.phone, phone]);

  useEffect(() => {
    if (currentUser?.default_address && !address && !addressLoaded && !hasUserEditedCep) {
      const def = currentUser.default_address;

      let logradouro = '';
      let bairro = '';

      if (def.street_address) {
        const streetAddr = def.street_address;
        const parts = streetAddr.split(' - ');

        if (parts.length > 0) {
          const firstPart = parts[0];
          const commaIndex = firstPart.lastIndexOf(',');
          if (commaIndex > 0) {
            logradouro = firstPart.substring(0, commaIndex).trim();
            const numPart = firstPart.substring(commaIndex + 1).trim();
            if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
              setNum(numPart.replace(/\D/g, ''));
            }
          } else {
            logradouro = firstPart.trim();
          }
        }

        if (parts.length > 1) {
          bairro = parts[1].trim();
        }
      } else if (def.line1) {
        logradouro = def.line1.trim();
        bairro = def.line2?.trim() || '';
      }

      if (!logradouro || logradouro.trim() === '') {
        if (def.street_address) {
          const streetAddr = def.street_address;
          if (!streetAddr.includes(' - ')) {
            logradouro = streetAddr.split(',')[0].trim();
          }
        }
        if (!logradouro || logradouro.trim() === '') {
          logradouro = def.line1?.trim() || '';
        }
      }

      const cepValue = def.postal_code || '';
      const cleanedCep = cepValue ? cepValue.replace(/\D/g, '') : '';
      const formattedCep = cleanedCep.length === 8 ? cleanedCep.substring(0, 5) + '-' + cleanedCep.substring(5, 8) : cepValue;

      const newAddress: AddressData = {
        logradouro: logradouro,
        bairro: bairro,
        localidade: def.city || '',
        uf: def.state_province || def.state || '',
        cep: formattedCep || '',
      };

      setAddress(newAddress);
      setAddressLoaded(true);

      if (cleanedCep && cleanedCep.length === 8) {
        setCep(formattedCep);
        setTimeout(() => {
          shipping.calculateLogistics(cleanedCep);
        }, 100);
      }
    }
  }, [address, addressLoaded, currentUser?.default_address, hasUserEditedCep, shipping, userMode]);

  const fetchCoordinates = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=1`
      );
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
    } catch {
      return null;
    }
    return null;
  };

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

    if (checkMapbox()) return;

    const interval = setInterval(() => {
      if (checkMapbox()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!checkMapbox()) {
        setMapError(true);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const shouldShowMiniMap = !!(mapboxLoaded && isManualAddress && address?.cep && mapContainerRef.current && !mapError);
    if (!shouldShowMiniMap) {
      return;
    }

    let isMounted = true;
    const initializeMap = async () => {
      const mapboxgl = (window as any).mapboxgl;
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
            trackResize: false,
          });

          mapRef.current.on('error', () => setMapError(true));
        } catch {
          setMapError(true);
          return;
        }
      }

      const fullAddress = `${address.logradouro}, ${address.bairro || ''}, ${address.localidade} - ${address.uf}`;

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
        } catch {
          return;
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          return;
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [address, isManualAddress, mapError, mapboxLoaded]);

  const updatePickerMarker = useCallback(
    (coords: [number, number]) => {
      const win = window as unknown as { mapboxgl?: any };
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
      } catch {
        return;
      }
    },
    [mapboxLoaded]
  );

  useEffect(() => {
    if (!mapboxLoaded || !isMapPickerOpen || !pickerContainerRef.current) {
      return;
    }

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      if (pickerMapRef.current) {
        pickerMapRef.current.remove();
        pickerMapRef.current = null;
      }

      const picker = new mapboxgl.Map({
        container: pickerContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505],
        zoom: 11,
        attributionControl: false,
        trackResize: false,
      });

      pickerMapRef.current = picker;

      picker.on('load', () => {
        setTimeout(() => {
          try {
            if (pickerMapRef.current) pickerMapRef.current.resize();
          } catch {
            return;
          }
        }, 500);
      });

      const handleMapClick = async (e: { lngLat: { lng: number; lat: number } }) => {
        const { lng, lat } = e.lngLat;
        updatePickerMarker([lng, lat]);
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=br`
          );
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            await parseAndSetAddress(data.features[0]);
          }
        } catch {
          return;
        }
      };

      picker.on('click', handleMapClick);
    } catch {
      return;
    }

    return () => {
      if (pickerMapRef.current) {
        try {
          pickerMapRef.current.remove();
        } catch {
          return;
        }
        pickerMapRef.current = null;
        pickerMarkerRef.current = null;
      }
    };
  }, [isMapPickerOpen, mapboxLoaded, updatePickerMarker]);

  const handlePickerSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=5&types=address,place,locality,neighborhood`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch {
      return;
    } finally {
      setIsSearching(false);
    }
  };

  const parseAndSetAddress = async (feature: MapboxFeature) => {
    const context = feature.context || [];
    const neighborhood =
      context.find((c) => c.id.startsWith('neighborhood'))?.text || context.find((c) => c.id.startsWith('locality'))?.text || '';
    const city = context.find((c) => c.id.startsWith('place'))?.text || feature.place_name?.split(',')[1]?.trim() || '';
    const state = context.find((c) => c.id.startsWith('region'))?.short_code?.replace('BR-', '') || '';
    let postcode = context.find((c) => c.id.startsWith('postcode'))?.text || '';
    const street = feature.text || feature.place_name?.split(',')[0] || '';

    if (!postcode && street && city && state) {
      try {
        const searchUrl = `https://viacep.com.br/ws/${state}/${city}/${encodeURIComponent(street)}/json/`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
          postcode = data[0].cep || '';
          const finalNeighborhood = neighborhood || data[0].bairro || '';

          setManualAddress({
            street,
            neighborhood: finalNeighborhood,
            city,
            state,
            cep: postcode ? postcode.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
          });
          return;
        }
      } catch {
        return;
      }
    }

    setManualAddress({
      street,
      neighborhood,
      city,
      state,
      cep: postcode ? postcode.replace(/(\d{5})(\d{3})/, '$1-$2') : '',
    });
  };

  const handleSelectSearchResult = async (result: MapboxFeature) => {
    await parseAndSetAddress(result);
    setSearchResults([]);
    setSearchQuery('');
    if (result.center) updatePickerMarker(result.center);
  };

  const confirmManualAddress = async () => {
    setHasUserEditedCep(true);
    setManualCepError(null);

    const finalCep = normalizeCepDigits(manualAddress.cep || '');
    if (finalCep.length > 0 && finalCep.length !== 8) {
      setManualCepError('CEP deve ter 8 dígitos');
      return;
    }

    if (finalCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${finalCep}/json/`);
        if (!res.ok) throw new Error('CEP lookup failed');
        const data = await res.json();
        if (data.erro) {
          setManualCepError('CEP inválido');
          return;
        }
      } catch {
        setManualCepError('Não foi possível validar o CEP');
        return;
      }
    }

    const formattedCep = finalCep ? maskCep(finalCep) : '';

    setAddress({
      logradouro: manualAddress.street,
      bairro: manualAddress.neighborhood || '',
      localidade: manualAddress.city,
      uf: manualAddress.state,
      cep: formattedCep || undefined,
    });
    setIsManualAddress(true);
    setCep(formattedCep || '');
    setIsMapPickerOpen(false);

    shipping.calculateLogistics(finalCep);
  };

  const handleCepChange = async (val: string) => {
    setHasUserEditedCep(true);
    const cleaned = normalizeCepDigits(val);
    const formatted = cleaned ? maskCep(cleaned) : '';
    setCep(formatted);
    setCepError(null);

    if (cleaned.length === 0) {
      setAddress(null);
      setIsManualAddress(false);
      shipping.resetShipping();
      return;
    }

    if (cleaned.length < 8) {
      setAddress(null);
      setIsManualAddress(false);
      shipping.resetShipping();
      return;
    }

    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        if (!res.ok) throw new Error('CEP lookup failed');
        const data = await res.json();
        if (data.erro) throw new Error('CEP not found');
        setAddress(data);
        setIsManualAddress(false);
        shipping.calculateLogistics(cleaned);
      } catch {
        try {
          const resFallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleaned}`);
          if (!resFallback.ok) throw new Error('Fallback failed');
          const dataFallback = await resFallback.json();
          setAddress({
            logradouro: dataFallback.address || '',
            bairro: dataFallback.district || '',
            localidade: dataFallback.city || '',
            uf: dataFallback.state || '',
          });
          setIsManualAddress(false);
          shipping.calculateLogistics(cleaned);
        } catch {
          setCepError('Falha ao carregar CEP. Use o buscador de mapa.');
          setAddress(null);
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const payment = usePaymentProcessing({
    items,
    currentUser,
    storeConfig,
    userMode,
    address,
    num,
    complement,
    phone,
    paymentMethod,
    finalTotal,
    saveCardForFuture,
    selectedSavedCardId,
    bestInternalShipping: shipping.bestInternalShipping,
    selectedShippingOption: shipping.selectedShippingOption,
    onComplete,
  });

  return {
    currentUser,
    userMode,
    locale,
    step,
    setStep,
    cep,
    setCep,
    address,
    setAddress,
    loadingCep,
    mapError,
    mapboxLoaded,
    num,
    setNum,
    complement,
    setComplement,
    phone,
    setPhone,
    cepError,
    manualCepError,
    isMapPickerOpen,
    setIsMapPickerOpen,
    addressLoaded,
    setAddressLoaded,
    isManualAddress,
    setIsManualAddress,
    paymentMethod,
    setPaymentMethod,
    splitCards,
    setSplitCards,
    payment,
    useCashback,
    setUseCashback,
    selectedSavedCardId,
    setSelectedSavedCardId,
    selectedSavedCardId2,
    setSelectedSavedCardId2,
    saveCardForFuture,
    setSaveCardForFuture,
    cardNumber,
    setCardNumber,
    cardName,
    setCardName,
    cardExpiry,
    setCardExpiry,
    cardCvc,
    setCardCvc,
    cardNumber2,
    setCardNumber2,
    cardName2,
    setCardName2,
    cardExpiry2,
    setCardExpiry2,
    cardCvc2,
    setCardCvc2,
    formatCardNumber,
    formatExpiry,
    formatCvc,
    couponCode,
    setCouponCode,
    couponLoading,
    couponError,
    appliedCoupon,
    checkoutItems,
    itemsWithCoupon,
    itemsWithoutCoupon,
    subtotal,
    originalSubtotal,
    preAppliedDiscount,
    manualCouponDiscount,
    shippingCost,
    shipping,
    availableCashback,
    pixDiscount,
    cashbackUsed,
    finalTotal,
    handleApplyCoupon,
    handleRemoveCoupon,
    getLoc,
    mapContainerRef,
    pickerContainerRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    handlePickerSearch,
    handleSelectSearchResult,
    manualAddress,
    setManualAddress,
    confirmManualAddress,
    handleCepChange,
    maskPhone,
    unmask,
  };
}

export type CheckoutState = ReturnType<typeof useCheckoutState>;
