import React, { useState, useRef } from 'react';
import { X, Save, Upload, Image as ImageIcon, Loader2, MapPin, Instagram, Facebook, Globe, Phone, Mail, Building2, User, FileText, Truck, Package, DollarSign, Tag, Star } from 'lucide-react';
import { AddressData } from '../../types';
import { Supplier } from '../../types/suppliers';
import { supabase } from '../../utils/supabase';
import { MapPicker } from '../checkout/MapPicker';
import { getCurrencySymbol } from '../../utils/currency';
import { Locale } from '../../i18n';

interface AdminSupplierEditorProps {
  supplier: Supplier | null;
  onClose: () => void;
  onSave: (supplier: Partial<Supplier>) => Promise<void>;
  locale?: Locale;
}

const AdminSupplierEditor: React.FC<AdminSupplierEditorProps> = ({ supplier, onClose, onSave, locale = 'pt' }) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    store_name: supplier?.store_name || '',
    image_url: supplier?.image_url || null,
    facade_image_url: supplier?.facade_image_url || null,
    instagram_url: supplier?.instagram_url || null,
    facebook_url: supplier?.facebook_url || null,
    tiktok_url: supplier?.tiktok_url || null,
    guarantees_stock: supplier?.guarantees_stock || false,
    address: supplier?.address || null,
    phone: supplier?.phone || null,
    email: supplier?.email || null,
    comments: supplier?.comments || null,
    cnpj: supplier?.cnpj || null,
    contact_person: supplier?.contact_person || null,
    payment_terms: supplier?.payment_terms || null,
    delivery_time: supplier?.delivery_time || null,
    minimum_order_quantity: supplier?.minimum_order_quantity || null,
    minimum_wholesale_value: supplier?.minimum_wholesale_value || null,
    website: supplier?.website || null,
    notes: supplier?.notes || null,
    categories: supplier?.categories || [],
    material_rating: supplier?.material_rating || null,
    is_active: supplier?.is_active !== undefined ? supplier.is_active : true,
  });

  const [categoryInput, setCategoryInput] = useState('');

  const [uploading, setUploading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const facadeInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'facade_image_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(field);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `supplier-${field}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `suppliers/${fileName}`;
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (err: any) {
      alert(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleAddressConfirm = (address: AddressData, _cep: string) => {
    setFormData(prev => ({ ...prev, address }));
    setShowMapPicker(false);
  };

  const handleSave = async () => {
    if (!formData.store_name || formData.store_name.trim() === '') {
      alert('Nome da loja é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      const cleanedData = { ...formData };

      // Converter address de objeto para string se necessário
      if (cleanedData.address && typeof cleanedData.address === 'object') {
        const addr = cleanedData.address as AddressData;
        const parts = [];
        if (addr.logradouro) parts.push(addr.logradouro);
        if (addr.numero) parts.push(`nº ${addr.numero}`);
        if (addr.bairro) parts.push(addr.bairro);
        if (addr.localidade) parts.push(addr.localidade);
        if (addr.uf) parts.push(addr.uf);
        if (addr.cep) parts.push(`CEP: ${addr.cep}`);
        (cleanedData as any).address = parts.length > 0 ? parts.join(', ') : null;
      }

      Object.keys(cleanedData).forEach(key => {
        const value = (cleanedData as any)[key];
        if (typeof value === 'string' && value.trim() === '') {
          (cleanedData as any)[key] = null;
        }
      });

      await onSave(cleanedData);
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Erro desconhecido ao salvar fornecedor';
      alert(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const formatAddress = (address: AddressData | null | undefined): string => {
    if (!address) return 'Nenhum endereço cadastrado';
    const parts = [];
    if (address.logradouro) parts.push(address.logradouro);
    if (address.numero) parts.push(`nº ${address.numero}`);
    if (address.bairro) parts.push(address.bairro);
    if (address.localidade) parts.push(address.localidade);
    if (address.uf) parts.push(address.uf);
    if (address.cep) parts.push(`CEP: ${address.cep}`);
    return parts.length > 0 ? parts.join(', ') : 'Endereço incompleto';
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-y-auto">
        <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl my-8">
          <div className="sticky top-0 bg-white border-b border-neutral-100 px-8 py-6 flex justify-between items-center z-10">
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">
                {supplier?.store_name || 'Cadastro completo de fornecedor'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 md:p-12 space-y-12 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">
                    Imagem Principal
                  </label>
                  <div className="relative aspect-square bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 overflow-hidden group">
                    {formData.image_url ? (
                      <>
                        <img src={formData.image_url} className="w-full h-full object-cover" alt="Supplier" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        {uploading === 'image_url' ? (
                          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-neutral-300 mb-2" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                              Upload do dispositivo
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleImageUpload(e, 'image_url')}
                      disabled={uploading === 'image_url'}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">
                    Imagem da Fachada
                  </label>
                  <div className="relative aspect-square bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 overflow-hidden group">
                    {formData.facade_image_url ? (
                      <>
                        <img src={formData.facade_image_url} className="w-full h-full object-cover" alt="Facade" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        {uploading === 'facade_image_url' ? (
                          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-neutral-300 mb-2" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                              Upload do dispositivo
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={facadeInputRef}
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleImageUpload(e, 'facade_image_url')}
                      disabled={uploading === 'facade_image_url'}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-8">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">
                    Nome da Loja *
                  </label>
                  <input
                    type="text"
                    className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-black transition-all"
                    placeholder="NOME DA LOJA"
                    value={formData.store_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Tag className="w-3 h-3" /> Categorias do Fornecedor
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm outline-none focus:border-black transition-all"
                          placeholder="Ex: Roupas, Calçados, Acessórios"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && categoryInput.trim()) {
                              e.preventDefault();
                              const newCategories = [...(formData.categories || []), categoryInput.trim()];
                              setFormData(prev => ({ ...prev, categories: newCategories }));
                              setCategoryInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (categoryInput.trim()) {
                              const newCategories = [...(formData.categories || []), categoryInput.trim()];
                              setFormData(prev => ({ ...prev, categories: newCategories }));
                              setCategoryInput('');
                            }
                          }}
                          className="px-4 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                      {formData.categories && formData.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.categories.map((cat, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg text-xs font-medium"
                            >
                              <span>{cat}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newCategories = formData.categories?.filter((_, i) => i !== idx);
                                  setFormData(prev => ({ ...prev, categories: newCategories }));
                                }}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Star className="w-3 h-3" /> Nota do Material (1-5)
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, material_rating: rating }))}
                            className={`transition-all ${
                              formData.material_rating && formData.material_rating >= rating
                                ? 'text-yellow-400 scale-110'
                                : 'text-neutral-300 hover:text-yellow-200'
                            }`}
                          >
                            <Star
                              className="w-8 h-8"
                              fill={formData.material_rating && formData.material_rating >= rating ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                      </div>
                      {formData.material_rating && (
                        <div className="text-center">
                          <span className="text-sm font-black">
                            Avaliação: {formData.material_rating}/5
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, material_rating: null }))}
                            className="ml-3 text-xs text-red-500 hover:underline"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Telefone
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="(00) 00000-0000"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email
                    </label>
                    <input
                      type="email"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="email@exemplo.com"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Endereço
                  </label>
                  <div className="space-y-3">
                    <div className="p-5 bg-neutral-50 border border-neutral-100 rounded-2xl">
                      <p className="text-sm text-neutral-600 mb-3">{formatAddress(formData.address)}</p>
                      <button
                        onClick={() => setShowMapPicker(true)}
                        className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                      >
                        {formData.address ? 'Alterar Endereço' : 'Selecionar Endereço'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> CNPJ
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <User className="w-3 h-3" /> Pessoa de Contato
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="Nome do contato"
                      value={formData.contact_person || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Instagram className="w-3 h-3" /> Instagram
                    </label>
                    <input
                      type="url"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="https://instagram.com/..."
                      value={formData.instagram_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Facebook className="w-3 h-3" /> Facebook
                    </label>
                    <input
                      type="url"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="https://facebook.com/..."
                      value={formData.facebook_url || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Globe className="w-3 h-3" /> Website
                    </label>
                    <input
                      type="url"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="https://..."
                      value={formData.website || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Condições de Pagamento
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="Ex: 30/60 dias"
                      value={formData.payment_terms || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Truck className="w-3 h-3" /> Prazo de Entrega
                    </label>
                    <input
                      type="text"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="Ex: 15 dias úteis"
                      value={formData.delivery_time || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <Package className="w-3 h-3" /> Pedido Mínimo (Quantidade)
                    </label>
                    <input
                      type="number"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="0"
                      value={formData.minimum_order_quantity || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_order_quantity: e.target.value ? parseInt(e.target.value) : null }))}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Valor Mínimo Atacado ({getCurrencySymbol(locale)})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all"
                      placeholder="0.00"
                      value={formData.minimum_wholesale_value || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_wholesale_value: e.target.value ? parseFloat(e.target.value) : null }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">
                    Comentários sobre o Fornecedor
                  </label>
                  <textarea
                    className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all min-h-[100px]"
                    placeholder="Observações e comentários sobre o fornecedor..."
                    value={formData.comments || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">
                    Observações Gerais
                  </label>
                  <textarea
                    className="w-full p-5 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:border-black transition-all min-h-[100px]"
                    placeholder="Notas adicionais..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="guarantees_stock"
                    className="w-5 h-5 rounded border-neutral-300"
                    checked={formData.guarantees_stock || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, guarantees_stock: e.target.checked }))}
                  />
                  <label htmlFor="guarantees_stock" className="text-sm font-black uppercase tracking-widest cursor-pointer">
                    A loja garante estoque
                  </label>
                </div>

                <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="w-5 h-5 rounded border-neutral-300"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <label htmlFor="is_active" className="text-sm font-black uppercase tracking-widest cursor-pointer">
                    Fornecedor ativo
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-neutral-100">
              <button
                onClick={onClose}
                className="px-8 py-4 border border-neutral-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.store_name || uploading !== null}
                className="px-12 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Fornecedor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMapPicker && (
        <MapPicker
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onConfirm={handleAddressConfirm}
          onCalculateLogistics={(_cep: string) => undefined}
        />
      )}
    </>
  );
};

export default AdminSupplierEditor;
