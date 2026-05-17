/**
 * useMapPicker - Address search (Nominatim/OSM) + optional Mapbox minimap display
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN, getMapboxStyle } from '../../../utils/mapbox';
import { loadMapbox } from '../../../utils/loadMapbox';
import { maskCep, normalizeCepDigits } from '../../../utils/masks';
import type { MapboxFeature, ManualAddressState, UseMapPickerParams, UseMapPickerReturn } from './types';

// Brazilian state name → 2-letter abbreviation
const BR_STATES: Record<string, string> = {
  acre: 'AC', alagoas: 'AL', amapa: 'AP', amazonas: 'AM',
  bahia: 'BA', ceara: 'CE', 'distrito federal': 'DF', 'espirito santo': 'ES',
  goias: 'GO', maranhao: 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', para: 'PA', paraiba: 'PB', parana: 'PR',
  pernambuco: 'PE', piaui: 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
  'rio grande do sul': 'RS', rondonia: 'RO', roraima: 'RR', 'santa catarina': 'SC',
  'sao paulo': 'SP', sergipe: 'SE', tocantins: 'TO',
};
function brStateCode(name: string): string {
  const norm = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return BR_STATES[norm] ?? name.substring(0, 2).toUpperCase();
}

// Nominatim address result → MapboxFeature shape (reuses existing types/UI)
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}
function nominatimToFeature(r: NominatimResult): MapboxFeature {
  const addr = r.address ?? {};
  const road = addr.road || r.display_name.split(',')[0] || '';
  const neighborhood = addr.suburb || addr.neighbourhood || '';
  const city = addr.city || addr.town || addr.village || '';
  const state = addr.state ? brStateCode(addr.state) : '';
  const postcode = addr.postcode || '';
  const lon = parseFloat(r.lon);
  const lat = parseFloat(r.lat);
  return {
    id: String(r.place_id),
    type: 'Feature',
    place_type: [r.type || 'address'],
    relevance: 1,
    properties: {},
    text: road,
    place_name: r.display_name,
    center: [lon, lat],
    geometry: { type: 'Point', coordinates: [lon, lat] },
    context: [
      ...(neighborhood ? [{ id: 'neighborhood.0', text: neighborhood }] : []),
      ...(city ? [{ id: 'place.0', text: city }] : []),
      ...(state ? [{ id: 'region.0', text: state, short_code: `BR-${state}` }] : []),
      ...(postcode ? [{ id: 'postcode.0', text: postcode }] : []),
    ],
  };
}

async function searchNominatim(query: string): Promise<MapboxFeature[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=br&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'pt-BR,pt', 'User-Agent': 'Auricapri-Checkout/1.0' },
  });
  if (!res.ok) return [];
  const data: NominatimResult[] = await res.json();
  return Array.isArray(data) ? data.map(nominatimToFeature) : [];
}

export function useMapPicker(params: UseMapPickerParams): UseMapPickerReturn {
  const { addressState, shipping } = params;

  // Modal state
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Map state
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MapboxFeature[]>([]);

  // Manual address state
  const [manualAddress, setManualAddress] = useState<ManualAddressState>({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
  });
  const [manualCepError, setManualCepError] = useState<string | null>(null);

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pickerMapRef = useRef<any>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const pickerMarkerRef = useRef<any>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch coordinates via Nominatim (no token required)
  const fetchCoordinates = async (query: string): Promise<[number, number] | null> => {
    try {
      const features = await searchNominatim(query);
      if (features.length > 0) return features[0].center;
    } catch {
      // fall through
    }
    return null;
  };

  // Load Mapbox dynamically on mount
  useEffect(() => {
    let cancelled = false;
    loadMapbox()
      .then((mapboxgl) => {
        if (cancelled) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        setMapboxLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMapError(true);
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize mini map for manual address display
  useEffect(() => {
    const shouldShowMiniMap = !!(
      mapboxLoaded &&
      addressState.isManualAddress &&
      addressState.address?.cep &&
      mapContainerRef.current &&
      !mapError
    );
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

      const address = addressState.address;
      const fullAddress = `${address?.logradouro}, ${address?.bairro || ''}, ${address?.localidade} - ${address?.uf}`;

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
  }, [addressState.address, addressState.isManualAddress, mapError, mapboxLoaded]);

  // Update picker marker
  const updatePickerMarker = useCallback(
    (coords: [number, number]) => {
      const win = window as unknown as { mapboxgl?: any }; // allow: pragmatic any
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

  // Parse and set address from search result — also applies to checkout state
  const parseAndSetAddress = async (feature: MapboxFeature) => {
    const context = feature.context || [];
    const neighborhood =
      context.find((c) => c.id.startsWith('neighborhood'))?.text ||
      context.find((c) => c.id.startsWith('locality'))?.text ||
      '';
    const city = context.find((c) => c.id.startsWith('place'))?.text || feature.place_name?.split(',')[1]?.trim() || '';
    const state = context.find((c) => c.id.startsWith('region'))?.short_code?.replace('BR-', '') || '';
    let postcode = context.find((c) => c.id.startsWith('postcode'))?.text || '';
    const street = feature.text || feature.place_name?.split(',')[0] || '';

    const applyToCheckout = (finalNeighborhood: string, formattedCep: string) => {
      addressState.setAddress({
        logradouro: street,
        bairro: finalNeighborhood,
        localidade: city,
        uf: state,
        cep: formattedCep || undefined,
      });
      addressState.setIsManualAddress(true);
      if (formattedCep) {
        addressState.setCep(formattedCep);
        shipping.calculateLogistics(normalizeCepDigits(formattedCep));
      }
    };

    if (!postcode && street && city && state) {
      try {
        const searchUrl = `https://viacep.com.br/ws/${state}/${city}/${encodeURIComponent(street)}/json/`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
          postcode = data[0].cep || '';
          const finalNeighborhood = neighborhood || data[0].bairro || 'Centro';
          const rawCep = normalizeCepDigits(postcode);
          const formattedCep = rawCep ? maskCep(rawCep) : '';

          setManualAddress({ street, neighborhood: finalNeighborhood, city, state, cep: formattedCep });
          applyToCheckout(finalNeighborhood, formattedCep);
          return;
        }
      } catch {
        // fall through to Nominatim data
      }
    }

    const finalNeighborhood = neighborhood || 'Centro';
    const rawCep = normalizeCepDigits(postcode);
    const formattedCep = rawCep ? maskCep(rawCep) : '';

    setManualAddress({ street, neighborhood: finalNeighborhood, city, state, cep: formattedCep });
    applyToCheckout(finalNeighborhood, formattedCep);
  };

  // Initialize picker map when modal opens
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

  // Handle picker search (used by Enter key / search button)
  const handlePickerSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const features = await searchNominatim(searchQuery);
      setSearchResults(features);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search query change with debounce (600ms — avoids hammering Nominatim)
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    if (query.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Show spinner only after debounce fires, not while user is still typing
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const features = await searchNominatim(query);
        setSearchResults(features);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  }, []);

  // Handle selecting a search result
  const handleSelectSearchResult = async (result: MapboxFeature) => {
    await parseAndSetAddress(result);
    setSearchResults([]);
    setSearchQuery('');
    if (result.center) updatePickerMarker(result.center);
  };

  // Confirm manual address
  const confirmManualAddress = async () => {
    addressState.setAddressLoaded(true);
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

    // Validate required neighborhood (backend requires min 1 char)
    if (!manualAddress.neighborhood || manualAddress.neighborhood.trim() === '') {
      setManualCepError('Bairro é obrigatório');
      return;
    }

    const formattedCep = finalCep ? maskCep(finalCep) : '';

    addressState.setAddress({
      logradouro: manualAddress.street,
      bairro: manualAddress.neighborhood,
      localidade: manualAddress.city,
      uf: manualAddress.state,
      cep: formattedCep || undefined,
    });
    addressState.setIsManualAddress(true);
    addressState.setCep(formattedCep || '');
    setIsMapPickerOpen(false);

    shipping.calculateLogistics(finalCep);
  };

  return {
    // Modal state
    isMapPickerOpen,
    setIsMapPickerOpen,

    // Map state
    mapboxLoaded,
    mapError,

    // Refs
    mapContainerRef,
    pickerContainerRef,

    // Search
    searchQuery,
    setSearchQuery,
    handleSearchQueryChange,
    isSearching,
    searchResults,
    handlePickerSearch,
    handleSelectSearchResult,

    // Manual address
    manualAddress,
    setManualAddress,
    manualCepError,
    confirmManualAddress,
  };
}
