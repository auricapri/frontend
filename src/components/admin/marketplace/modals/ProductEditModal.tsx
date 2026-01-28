/**
 * ProductEditModal - Modal for editing marketplace product info and images
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Edit3,
  Image,
  Eye,
  Plus,
  Star,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { supabase } from '../../../../utils/supabase';
import { marketplaceApi } from '../../../../api/marketplace.api';
import { formatCurrency, type Locale } from '../../../../utils/currency';
import { logger } from '../../../../utils/logger';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface ProductEditModalProps {
  brand: MarketplaceBrand;
  product: any; // Marketplace mapping with nested product
  locale: string;
  onClose: () => void;
  onSave: (data: { price: number; description: string }) => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  brand,
  product,
  locale,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'images'>('info');
  const [formData, setFormData] = useState({
    price: product.marketplace_price || product.product?.variants?.[0]?.retail_price || 0,
    description: product.description || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<string[]>(product.product?.images || []);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await marketplaceApi.updateMapping(product.id, {
        marketplace_price: formData.price,
      });
      await onSave(formData);
    } catch (err) {
      logger.error('Failed to save product', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const productId = product.product?.id || 'temp';
      const filePath = `marketplace-products/${productId}/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setImages([...images, urlData.publicUrl]);
        logger.info('Image uploaded successfully', { path: filePath });
      }
    } catch (err) {
      logger.error('Failed to upload image', err);
      // Fallback to local preview if upload fails
      const previewUrl = URL.createObjectURL(file);
      setImages([...images, previewUrl]);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${brand.bgGradient} flex items-center justify-between`}>
          <h2 className={`text-lg font-bold ${brand.textColor}`}>Editar Produto</h2>
          <button onClick={onClose} className={`p-2 rounded-lg bg-white/20 hover:bg-white/30 ${brand.textColor}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Informações
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'images'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Image className="w-4 h-4" />
            Imagens ({images.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 gap-8">
              {/* Preview */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                    {images[0] ? (
                      <img src={images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-16 h-16 text-neutral-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium mb-2">{product.product?.name}</h4>
                    <p className="text-2xl font-bold" style={{ color: brand.accentColor }}>
                      {formatCurrency(formData.price, locale as Locale)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preço</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border rounded-xl resize-none"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-700">
                    <strong>Estoque:</strong>{' '}
                    {product.product?.variants?.reduce(
                      (sum: number, v: any) => sum + (v.stock_quantity || 0),
                      0
                    ) || 0}{' '}
                    unidades (gerenciado no site)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-6">
              {/* Image Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Imagens do Produto</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${brand.bgColor} ${brand.textColor}`}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Adicionar Imagem
                  </button>
                </div>

                {images.length === 0 ? (
                  <div className="border-2 border-dashed border-neutral-200 rounded-xl p-12 text-center">
                    <Image className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                    <p className="text-neutral-500 mb-4">Nenhuma imagem adicionada</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      Adicionar primeira imagem
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square bg-neutral-100 rounded-xl overflow-hidden"
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />

                        {/* Main image badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white text-xs font-medium rounded">
                            Principal
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {index > 0 && (
                            <button
                              onClick={() => handleReorderImages(index, 0)}
                              className="p-2 bg-white rounded-lg hover:bg-neutral-100 transition-colors"
                              title="Tornar principal"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add more images button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-neutral-400 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-neutral-400" />
                      <span className="text-xs text-neutral-500">Adicionar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-700 mb-2">
                  Dicas para imagens no {brand.name}:
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• Use imagens de alta qualidade (mínimo 500x500px)</li>
                  <li>• Fundo branco ou claro é preferido</li>
                  <li>• A primeira imagem é a principal (thumbnail)</li>
                  <li>• Adicione até 10 imagens por produto</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-neutral-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
