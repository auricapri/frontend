import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Move, X, Search, Loader2, Package, MousePointer2 } from 'lucide-react';
import { Product, ProductVariant, ProductImageHotspot, HotspotInput, LocalizedText } from '../../types';
import { hotspotsApi } from '../../api/hotspots.api';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';

interface HotspotsEditorProps {
  product: Product;
  products: Product[];
  locale: Locale;
  onHotspotsChange?: () => void;
}

interface DraftHotspot extends HotspotInput {
  tempId?: string;
  linked_variant?: ProductVariant;
  linked_product?: Product;
}

export function HotspotsEditor({ product, products, locale, onHotspotsChange }: HotspotsEditorProps) {
  const [hotspots, setHotspots] = useState<DraftHotspot[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [pendingHotspotPosition, setPendingHotspotPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Get all images from product (base_images + variant_images)
  const allImages = React.useMemo(() => {
    const images = new Set<string>(product.base_images || []);
    (product.variants || []).forEach(v => {
      (v.variant_images || []).forEach(img => images.add(img));
    });
    return Array.from(images);
  }, [product]);

  // Auto-select first image
  useEffect(() => {
    if (allImages.length > 0 && !selectedImageUrl) {
      setSelectedImageUrl(allImages[0]);
    }
  }, [allImages, selectedImageUrl]);

  // Load existing hotspots
  useEffect(() => {
    const loadHotspots = async () => {
      if (!product.id) return;
      setIsLoading(true);
      try {
        const data = await hotspotsApi.getAllByProductIdAdmin(product.id);
        setHotspots(data.map(h => ({
          ...h,
          tempId: h.id
        })));
      } catch (err) {
        console.error('Failed to load hotspots:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHotspots();
  }, [product.id]);

  // Get hotspots for current image
  const currentImageHotspots = hotspots.filter(h => h.image_url === selectedImageUrl);

  // Helper to get localized text
  const getLocText = (text: LocalizedText | string | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[locale] || text.en || text.pt || Object.values(text)[0] || '';
  };

  // Handle image click to add hotspot
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;

    const container = imageContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingHotspotPosition({ x, y });
    setEditingHotspotId(null);
    setShowVariantSelector(true);
  }, [isDragging]);

  // Handle hotspot drag
  const handleHotspotDrag = useCallback((e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    setIsDragging(hotspotId);

    const container = imageContainerRef.current;
    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));

      setHotspots(prev => prev.map(h =>
        (h.id === hotspotId || h.tempId === hotspotId)
          ? { ...h, x_percent: x, y_percent: y }
          : h
      ));
      setHasChanges(true);
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Select variant for hotspot
  const handleSelectVariant = (variant: ProductVariant, variantProduct: Product) => {
    const newHotspot: DraftHotspot = {
      product_id: product.id,
      image_url: selectedImageUrl,
      x_percent: pendingHotspotPosition?.x || 50,
      y_percent: pendingHotspotPosition?.y || 50,
      linked_variant_id: variant.id,
      is_active: true,
      tempId: `temp-${Date.now()}`,
      linked_variant: variant,
      linked_product: variantProduct
    };

    if (editingHotspotId) {
      // Update existing hotspot
      setHotspots(prev => prev.map(h =>
        (h.id === editingHotspotId || h.tempId === editingHotspotId)
          ? { ...h, linked_variant_id: variant.id, linked_variant: variant, linked_product: variantProduct }
          : h
      ));
    } else {
      // Add new hotspot
      setHotspots(prev => [...prev, newHotspot]);
    }

    setShowVariantSelector(false);
    setPendingHotspotPosition(null);
    setEditingHotspotId(null);
    setHasChanges(true);
  };

  // Delete hotspot
  const handleDeleteHotspot = (hotspotId: string) => {
    setHotspots(prev => prev.filter(h => h.id !== hotspotId && h.tempId !== hotspotId));
    setHasChanges(true);
  };

  // Edit hotspot variant
  const handleEditHotspot = (hotspotId: string) => {
    const hotspot = hotspots.find(h => h.id === hotspotId || h.tempId === hotspotId);
    if (hotspot) {
      setEditingHotspotId(hotspotId);
      setPendingHotspotPosition({ x: hotspot.x_percent, y: hotspot.y_percent });
      setShowVariantSelector(true);
    }
  };

  // Save all hotspots
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const hotspotsToSave = hotspots.map(h => ({
        id: h.id,
        image_url: h.image_url,
        x_percent: h.x_percent,
        y_percent: h.y_percent,
        linked_variant_id: h.linked_variant_id,
        label: h.label || {},
        is_active: h.is_active
      }));

      await hotspotsApi.saveBatch(product.id, hotspotsToSave);
      setHasChanges(false);
      onHotspotsChange?.();
    } catch (err) {
      console.error('Failed to save hotspots:', err);
      alert('Erro ao salvar hotspots');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter products for search
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const name = getLocText(p.name).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
          Carregando hotspots...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Image Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Selecionar Imagem
          </label>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Salvar Hotspots
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {allImages.map((img, idx) => {
            const count = hotspots.filter(h => h.image_url === img).length;
            return (
              <button
                key={idx}
                onClick={() => setSelectedImageUrl(img)}
                className={`relative flex-none w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImageUrl === img
                    ? 'border-black shadow-lg scale-105'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {count > 0 && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Canvas with Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Clique na imagem para adicionar um hotspot
              </label>
              <div className="flex items-center gap-2 text-[9px] text-neutral-400">
                <MousePointer2 className="w-3 h-3" />
                <span>Arraste para reposicionar</span>
              </div>
            </div>

            <div
              ref={imageContainerRef}
              onClick={handleImageClick}
              className="relative aspect-square bg-neutral-100 rounded-[2rem] overflow-hidden cursor-crosshair border-2 border-dashed border-neutral-200"
            >
              {selectedImageUrl ? (
                <img src={selectedImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Selecione uma imagem</span>
                </div>
              )}

              {/* Render hotspots */}
              {currentImageHotspots.map(hotspot => (
                <div
                  key={hotspot.id || hotspot.tempId}
                  style={{
                    left: `${hotspot.x_percent}%`,
                    top: `${hotspot.y_percent}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  className={`absolute group ${isDragging === (hotspot.id || hotspot.tempId) ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  {/* Hotspot dot */}
                  <div
                    onMouseDown={(e) => handleHotspotDrag(e, (hotspot.id || hotspot.tempId)!)}
                    className="w-6 h-6 bg-white border-2 border-black rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                  </div>

                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <div className="bg-black text-white px-3 py-2 rounded-xl text-[9px] font-bold">
                      {hotspot.linked_product ? getLocText(hotspot.linked_product.name) : 'Produto não encontrado'}
                      {hotspot.linked_variant?.color_name && (
                        <span className="text-white/70"> - {getLocText(hotspot.linked_variant.color_name)}</span>
                      )}
                      {hotspot.linked_variant?.size && (
                        <span className="text-white/70"> ({hotspot.linked_variant.size})</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hotspots List */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Hotspots nesta imagem ({currentImageHotspots.length})
          </label>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {currentImageHotspots.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-2xl">
                <Plus className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Nenhum hotspot
                </p>
                <p className="text-[9px] text-neutral-400 mt-1">
                  Clique na imagem para adicionar
                </p>
              </div>
            ) : (
              currentImageHotspots.map(hotspot => (
                <div
                  key={hotspot.id || hotspot.tempId}
                  className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {hotspot.linked_product?.base_images?.[0] && (
                      <img
                        src={hotspot.linked_variant?.variant_images?.[0] || hotspot.linked_product.base_images[0]}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {hotspot.linked_product ? getLocText(hotspot.linked_product.name) : 'Produto não encontrado'}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {hotspot.linked_variant?.color_name && getLocText(hotspot.linked_variant.color_name)}
                        {hotspot.linked_variant?.size && ` - ${hotspot.linked_variant.size}`}
                      </p>
                      {hotspot.linked_variant && (
                        <p className="text-[10px] font-bold text-emerald-600">
                          {formatCurrency(hotspot.linked_variant.retail_price, locale)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditHotspot((hotspot.id || hotspot.tempId)!)}
                      className="flex-1 px-3 py-2 bg-neutral-100 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
                    >
                      Trocar Variante
                    </button>
                    <button
                      onClick={() => handleDeleteHotspot((hotspot.id || hotspot.tempId)!)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Variant Selector Modal */}
      {showVariantSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Selecionar Produto</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {editingHotspotId ? 'Trocar variante do hotspot' : 'Escolha um produto para criar o hotspot'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowVariantSelector(false);
                  setPendingHotspotPosition(null);
                  setEditingHotspotId(null);
                }}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-neutral-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-black transition-all"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="space-y-4">
                {filteredProducts.map(p => {
                  const variants = p.variants || [];
                  if (variants.length === 0) return null;

                  return (
                    <div key={p.id} className="space-y-2">
                      <div className="flex items-center gap-3 px-2">
                        {p.base_images?.[0] && (
                          <img src={p.base_images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <span className="text-sm font-bold">{getLocText(p.name)}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        {variants.map(variant => (
                          <button
                            key={variant.id}
                            onClick={() => handleSelectVariant(variant, p)}
                            className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all text-left"
                          >
                            {variant.variant_images?.[0] && (
                              <img src={variant.variant_images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">
                                {getLocText(variant.color_name)}
                                {variant.size && ` - ${variant.size}`}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-bold">
                                {formatCurrency(variant.retail_price, locale)}
                              </p>
                            </div>
                            <Package className="w-4 h-4 text-neutral-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-12 text-neutral-400">
                    <Package className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
