import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { MAPBOX_TOKEN } from '../../utils/mapbox';
import { type AddressData } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: AddressData, cep: string) => void;
  onCalculateLogistics: (cep: string) => void;
}

interface ManualAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCalculateLogistics
}) => {
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualAddress, setManualAddress] = useState<ManualAddress>({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: ''
  });

  const pickerMapRef = useRef<any>(null);
  const pickerContainerRef = useRef<HTMLDivElement>(null);
  const pickerMarkerRef = useRef<any>(null);

  // Check if Mapbox is loaded
  useEffect(() => {
    const checkMapbox = () => {
      const win = window as any;
      if (win.mapboxgl || win.mapboxLoaded) {
        setMapboxLoaded(true);
      } else {
        setTimeout(checkMapbox, 100);
      }
    };
    checkMapbox();
  }, []);

  const updatePickerMarker = useCallback((coords: [number, number]) => {
    if (!mapboxLoaded || !pickerMapRef.current) return;
    
    const win = window as any;
    const mapboxgl = win.mapboxgl;
    if (!mapboxgl) return;

    try {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.remove();
      }
      pickerMarkerRef.current = new mapboxgl.Marker({ color: '#000' })
        .setLngLat(coords)
        .addTo(pickerMapRef.current);
    } catch (e) {
      console.error('Error updating picker marker:', e);
    }
  }, [mapboxLoaded]);

  // Initialize picker map
  useEffect(() => {
    if (!mapboxLoaded || !isOpen || !pickerContainerRef.current) {
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
        setTimeout(() => { 
          try { 
            if(pickerMapRef.current) pickerMapRef.current.resize(); 
          } catch(e) {
            console.error('Error resizing picker map:', e);
          }
        }, 500);
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
        try { pickerMapRef.current.remove(); } catch (_e) { void _e; }
        pickerMapRef.current = null;
        pickerMarkerRef.current = null;
      }
    };
  }, [isOpen, mapboxLoaded, updatePickerMarker]);

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

  const executeSearch = useCallback(async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=br&limit=5&types=address,place,locality,neighborhood`);
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch (_e) { void _e; } finally { setIsSearching(false); }
  }, []);

  const debouncedSearch = useDebounce(executeSearch, 400);

  const handlePickerSearch = () => {
    if (!searchQuery) return;
    debouncedSearch(searchQuery);
  };

  const handleSelectSearchResult = async (result: any) => {
    await parseAndSetAddress(result);
    setSearchResults([]);
    setSearchQuery('');
    if (result.center) updatePickerMarker(result.center);
  };

  const confirmManualAddress = async () => {
    let finalCep = manualAddress.cep?.replace(/\D/g, '') || '';
    
    if (!finalCep && manualAddress.street && manualAddress.city && manualAddress.state) {
      try {
        const searchUrl = `https://viacep.com.br/ws/${manualAddress.state}/${manualAddress.city}/${encodeURIComponent(manualAddress.street)}/json/`;
        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0 && !data[0].erro) {
          finalCep = data[0].cep?.replace(/\D/g, '') || '';
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
    
    const formattedCep = finalCep ? finalCep.replace(/(\d{5})(\d{3})/, '$1-$2') : '';
    
    const addressData: AddressData = {
      logradouro: manualAddress.street,
      bairro: manualAddress.neighborhood || '',
      localidade: manualAddress.city,
      uf: manualAddress.state,
      cep: formattedCep || undefined
    };
    
    onConfirm(addressData, formattedCep);
    onCalculateLogistics(finalCep || 'Manual');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-[70vh]">
        <div className="w-full md:w-1/2 relative bg-neutral-100 flex items-center justify-center">
          <div ref={pickerContainerRef} className="w-full h-full" />
          <div className="absolute top-8 left-8 right-8 z-10">
            <div className="relative group">
              <input
                className="w-full p-6 pr-16 bg-white border-none rounded-2xl shadow-2xl text-xs font-black uppercase tracking-widest outline-none placeholder:text-neutral-300"
                placeholder="Busque sua rua e cidade..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePickerSearch()}
              />
              <button
                onClick={handlePickerSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-xl hover:scale-105 transition-all"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-2">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full p-4 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest">{res.text}</p>
                    <p className="text-[9px] text-neutral-400 truncate">{res.place_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between overflow-y-auto no-scrollbar">
          <div className="space-y-12">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">
                  Localizador
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Confirme os detalhes do endereço
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                  Rua / Logradouro
                </label>
                <input
                  className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-black transition-all"
                  value={manualAddress.street}
                  onChange={e => setManualAddress({...manualAddress, street: e.target.value})}
                  placeholder="NOME DA RUA"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                    Bairro
                  </label>
                  <input
                    className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all"
                    value={manualAddress.neighborhood}
                    onChange={e => setManualAddress({...manualAddress, neighborhood: e.target.value})}
                    placeholder="BAIRRO"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                    Cidade
                  </label>
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
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                    Estado
                  </label>
                  <input
                    className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-black transition-all"
                    value={manualAddress.state}
                    onChange={e => setManualAddress({...manualAddress, state: e.target.value.toUpperCase()})}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                    CEP
                  </label>
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
  );
};
