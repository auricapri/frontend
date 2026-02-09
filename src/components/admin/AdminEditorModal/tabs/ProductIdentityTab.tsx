import React from 'react';
import {
  Plus, Trash2, ImageIcon, Sliders, Upload, Loader2, Check,
  Scale, Ruler, DollarSign, Package, Link, FileText
} from 'lucide-react';
import { Product, ProductVariant, Category, Collection, Asset, SizeGuide } from '../../../../types';
import { Supplier } from '../../../../types/suppliers';
import { Gender } from '../../../../constants/enums';
import { Locale } from '../../../../i18n';
import { RichTextEditor, AiAssistButton } from '../../../ui';
import { LocalizedText } from '../types';

interface ProductIdentityTabProps {
  productData: Product;
  categories: Category[];
  collections: Collection[];
  suppliers: Supplier[];
  assets: Asset[];
  sizeGuides: SizeGuide[];
  editLocale: Locale;
  uploading: string | null;
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  updateNested: (field: string, value: string) => void;
  updateSimple: (field: string, value: any) => void;
  onMasterUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectVariantImage: (variantIndex: number, imageUrl: string) => void;
  updateVariant: (index: number, field: keyof ProductVariant, value: any) => void;
  updateVariantLocalized: (idx: number, field: string, value: string) => void;
  onToggleAsset: (variantIdx: number, assetId: string) => void;
  addVariant: () => void;
  removeVariant: (idx: number) => void;
  removeBaseImage: (idx: number) => void;
  toggleCollectionForProduct: (collectionId: string) => void;
  t: (key: string) => string;
}

export const ProductIdentityTab: React.FC<ProductIdentityTabProps> = ({
  productData,
  categories,
  collections,
  suppliers,
  assets,
  sizeGuides,
  editLocale,
  uploading,
  getLocVal,
  updateNested,
  updateSimple,
  onMasterUpload,
  onSelectVariantImage,
  updateVariant,
  updateVariantLocalized,
  onToggleAsset,
  addVariant,
  removeVariant,
  removeBaseImage,
  toggleCollectionForProduct,
  t,
}) => {
  return (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        {/* Left Column - Identity Fields */}
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Identidade ({editLocale})
            </label>
            <input
              className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-3xl font-black outline-none focus:bg-white focus:border-black transition-all"
              value={getLocVal(productData.name)}
              onChange={e => updateNested('name', e.target.value)}
              placeholder="Nome do Produto"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Descrição ({editLocale})
              </label>
              <AiAssistButton
                label="Gerar"
                variant="small"
                promptTemplate={`Crie uma descrição curta e atraente para o produto "{{productName}}" da categoria "{{category}}".

Requisitos:
- Máximo 300 caracteres
- Destaque os benefícios principais
- Tom profissional e elegante
- Adequado para loja de moda premium

Retorne APENAS a descrição, sem HTML, sem explicações.`}
                context={{
                  productName: getLocVal(productData.name) || 'Produto',
                  category: categories.find(c => c.id === productData.category_id)?.name
                    ? getLocVal(categories.find(c => c.id === productData.category_id)?.name)
                    : 'Moda',
                }}
                onAccept={(content) => updateNested('description', content)}
                systemInstruction="Você é um copywriter especialista em moda de luxo e e-commerce premium."
              />
            </div>
            <RichTextEditor
              mode="simple"
              value={getLocVal(productData.description)}
              onChange={(html) => updateNested('description', html)}
              placeholder="Descrição do produto..."
              minHeight="200px"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Apresentação do Produto ({editLocale})
              </label>
              <AiAssistButton
                label="Gerar apresentação"
                variant="small"
                promptTemplate={`Crie uma apresentação completa e detalhada para o produto "{{productName}}" da categoria "{{category}}".

Descrição atual: {{description}}

Requisitos:
1. Estruture com seções claras (ex: Sobre, Características, Detalhes, Cuidados)
2. Use linguagem elegante e sofisticada
3. Destaque materiais, acabamentos e diferenciais
4. Inclua sugestões de uso e combinações
5. Tom aspiracional adequado para moda premium
6. Formato com parágrafos bem estruturados
7. Máximo 800 palavras

Retorne APENAS o texto da apresentação, sem HTML, sem explicações.`}
                context={{
                  productName: getLocVal(productData.name) || 'Produto',
                  category: categories.find(c => c.id === productData.category_id)?.name
                    ? getLocVal(categories.find(c => c.id === productData.category_id)?.name)
                    : 'Moda',
                  description: getLocVal(productData.description) || '',
                }}
                onAccept={(content) => updateNested('presentation', content)}
                systemInstruction="Você é um redator de conteúdo especialista em moda de luxo, com experiência em criar apresentações de produtos que transmitem exclusividade e sofisticação."
              />
            </div>
            <p className="text-[8px] text-neutral-400 -mt-2">
              Adicione textos formatados, imagens e vídeos do YouTube para criar uma apresentação completa.
            </p>
            <RichTextEditor
              mode="full"
              value={getLocVal(productData.presentation)}
              onChange={(html) => updateNested('presentation', html)}
              placeholder="Apresentação completa do produto com textos, imagens e vídeos..."
              minHeight="400px"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Categoria
              </label>
              <select
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl font-black uppercase text-[11px] outline-none"
                value={productData.category_id || ''}
                onChange={e => updateSimple('category_id', e.target.value)}
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{getLocVal(cat.name)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Fornecedor *
              </label>
              <select
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl font-black uppercase text-[11px] outline-none focus:border-black transition-all"
                value={productData.supplier_id || ''}
                onChange={e => updateSimple('supplier_id', e.target.value)}
                required
              >
                <option value="">Selecione um fornecedor...</option>
                {suppliers.filter(s => s.is_active).map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.store_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Coleções
            </label>
            <div className="max-h-32 overflow-y-auto bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-2 no-scrollbar">
              {collections.map(col => {
                const isSelected = (productData.collection_ids || []).includes(col.id);
                return (
                  <div
                    key={col.id}
                    onClick={() => toggleCollectionForProduct(col.id)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected ? 'bg-black text-white border-black' : 'bg-white hover:bg-neutral-100 border-transparent'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-white border-white' : 'border-neutral-300'}`} />
                    <span className="text-[9px] font-bold uppercase tracking-widest truncate">
                      {getLocVal(col.name)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-neutral-50 border border-neutral-100 rounded-2xl">
            <input
              type="checkbox"
              className="w-5 h-5 accent-black cursor-pointer"
              checked={productData.has_free_shipping || false}
              onChange={e => updateSimple('has_free_shipping', e.target.checked)}
            />
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-900 cursor-pointer">
                Frete Grátis
              </label>
              <p className="text-[8px] text-neutral-400 mt-1">
                Ao ativar, R$35 será adicionado ao preço de varejo
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Gênero
            </label>
            <select
              className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl font-black uppercase text-[11px] outline-none focus:border-black transition-all"
              value={productData.gender || Gender.FEMALE}
              onChange={e => updateSimple('gender', e.target.value)}
            >
              <option value={Gender.FEMALE}>{t('gender.female')}</option>
              <option value={Gender.MALE}>{t('gender.male')}</option>
              <option value={Gender.UNISEX}>{t('gender.unisex')}</option>
            </select>
          </div>
        </div>

        {/* Right Column - Gallery */}
        <div className="space-y-10">
          <div className="bg-neutral-50 p-10 rounded-[2.5rem] border border-neutral-100">
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Galeria Master
                </label>
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                {uploading === 'master' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                <input type="file" className="hidden" accept="image/*" onChange={onMasterUpload} disabled={!!uploading} />
              </label>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
              {(productData.base_images || []).map((img: string, i: number) => (
                <div key={i} className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden border border-neutral-200 group shadow-sm">
                  <img src={img} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeBaseImage(i)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <div className="space-y-10 border-t border-neutral-100 pt-10">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-6">
            <Sliders className="w-8 h-8" /> SKUs & Variantes
          </h3>
          <button
            onClick={addVariant}
            className="px-10 py-4 bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" /> Novo SKU
          </button>
        </div>

        <div className="space-y-12">
          {(productData.variants || []).map((v: ProductVariant, idx: number) => (
            <VariantCard
              key={v.id || idx}
              variant={v}
              idx={idx}
              editLocale={editLocale}
              productData={productData}
              assets={assets}
              sizeGuides={sizeGuides}
              getLocVal={getLocVal}
              onSelectVariantImage={onSelectVariantImage}
              updateVariant={updateVariant}
              updateVariantLocalized={updateVariantLocalized}
              onToggleAsset={onToggleAsset}
              removeVariant={removeVariant}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Variant Card Component (extracted for clarity)
interface VariantCardProps {
  variant: ProductVariant;
  idx: number;
  editLocale: Locale;
  productData: Product;
  assets: Asset[];
  sizeGuides: SizeGuide[];
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  onSelectVariantImage: (variantIndex: number, imageUrl: string) => void;
  updateVariant: (index: number, field: keyof ProductVariant, value: any) => void;
  updateVariantLocalized: (idx: number, field: string, value: string) => void;
  onToggleAsset: (variantIdx: number, assetId: string) => void;
  removeVariant: (idx: number) => void;
}

const VariantCard: React.FC<VariantCardProps> = ({
  variant: v,
  idx,
  editLocale,
  productData,
  assets,
  sizeGuides,
  getLocVal,
  onSelectVariantImage,
  updateVariant,
  updateVariantLocalized,
  onToggleAsset,
  removeVariant,
}) => {
  return (
    <div className="bg-neutral-50 p-12 rounded-[4rem] border border-neutral-100 space-y-12 relative group animate-in slide-in-from-bottom-4">
      <button
        onClick={() => removeVariant(idx)}
        className="absolute top-10 right-10 p-4 text-red-400 hover:bg-red-50 rounded-2xl transition-all"
      >
        <Trash2 className="w-6 h-6" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Variant Image Column */}
        <div className="md:col-span-1 space-y-4">
          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
            Imagem da Variante
          </label>
          <div className="aspect-[3/4] bg-white rounded-3xl border border-neutral-200 relative overflow-hidden shadow-inner mb-4">
            {v.variant_images?.[0] ? (
              <img src={v.variant_images[0]} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-200">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-[8px] font-black uppercase">Sem Imagem</span>
              </div>
            )}
          </div>
          <div>
            <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-300 mb-2 block">
              Selecionar da Galeria Master
            </span>
            {productData.base_images && productData.base_images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {productData.base_images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => onSelectVariantImage(idx, img)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      v.variant_images?.[0] === img
                        ? 'border-black opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-100 hover:border-neutral-200'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    {v.variant_images?.[0] === img && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[8px] text-red-400 font-medium bg-red-50 p-2 rounded-lg">
                Nenhuma imagem na galeria master. Faça upload acima primeiro.
              </p>
            )}
          </div>
        </div>

        {/* Variant Details Column */}
        <div className="md:col-span-4 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">SKU</label>
              <input
                className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-mono text-xs font-bold"
                value={v.sku || ''}
                onChange={e => updateVariant(idx, 'sku', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Tamanho</label>
              <input
                className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-black text-xs uppercase"
                value={v.size || ''}
                onChange={e => updateVariant(idx, 'size', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Cor ({editLocale})</label>
              <input
                className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold"
                value={getLocVal(v.color_name)}
                onChange={e => updateVariantLocalized(idx, 'color_name', e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Hex Cor</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-10 h-10 rounded-xl border-none cursor-pointer"
                  value={v.color_hex || '#000000'}
                  onChange={e => updateVariant(idx, 'color_hex', e.target.value)}
                />
                <input
                  className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-mono text-xs font-bold uppercase"
                  value={v.color_hex || ''}
                  onChange={e => updateVariant(idx, 'color_hex', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Estoque</label>
              <input
                type="number"
                className="w-full p-5 bg-white border border-neutral-200 rounded-2xl font-mono text-xs font-bold"
                value={v.stock_quantity || 0}
                onChange={e => updateVariant(idx, 'stock_quantity', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Composition & Care Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-neutral-400" />
                <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Composição & Cuidados
                </h5>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                  Composição ({editLocale})
                </label>
                <RichTextEditor
                  mode="simple"
                  value={getLocVal(v.composition)}
                  onChange={(html) => updateVariantLocalized(idx, 'composition', html)}
                  placeholder="Ex: 100% Algodão"
                  minHeight="80px"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                  Cuidados ({editLocale})
                </label>
                <RichTextEditor
                  mode="simple"
                  value={getLocVal(v.care_instructions)}
                  onChange={(html) => updateVariantLocalized(idx, 'care_instructions', html)}
                  placeholder="Ex: Lavar à mão..."
                  minHeight="80px"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Ruler className="w-5 h-5 text-neutral-400" />
                <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Guia de Medidas
                </h5>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                  Selecionar Guia Global
                </label>
                <select
                  className="w-full p-4 bg-neutral-50 rounded-xl text-xs font-bold outline-none border border-neutral-100"
                  value={v.size_guide_id || ''}
                  onChange={(e) => updateVariant(idx, 'size_guide_id', e.target.value || null)}
                >
                  <option value="">-- Sem Guia --</option>
                  {sizeGuides.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative aspect-[3/2] bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 overflow-hidden flex flex-col items-center justify-center">
                {v.size_guide_id ? (
                  (() => {
                    const selectedGuide = sizeGuides.find(g => g.id === v.size_guide_id);
                    return selectedGuide ? (
                      <img src={selectedGuide.image_url} className="w-full h-full object-contain p-2" alt="Selected Guide" />
                    ) : (
                      <span className="text-[8px] text-red-400 font-bold uppercase">Guia não encontrado</span>
                    );
                  })()
                ) : (
                  <div className="text-center p-4 text-neutral-300">
                    <Ruler className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Nenhum guia selecionado</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attributes & Costs Section */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <Scale className="w-5 h-5 text-neutral-400" />
              <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Atributos & Custos
              </h5>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[8px] font-bold uppercase text-neutral-300">Custo (C_prod)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <input
                    type="number"
                    className="w-full p-4 pl-10 bg-neutral-50 rounded-xl text-sm font-bold"
                    value={v.cost_price || 0}
                    onChange={e => updateVariant(idx, 'cost_price', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-bold uppercase text-neutral-300">Peso (g)</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                  <input
                    type="number"
                    className="w-full p-4 pl-10 bg-neutral-50 rounded-xl text-sm font-bold"
                    value={v.weight_g || 0}
                    onChange={e => updateVariant(idx, 'weight_g', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Correlated Assets Section */}
          <div className="bg-neutral-100/50 p-8 rounded-[2.5rem] border border-neutral-200">
            <div className="flex items-center gap-4 mb-6">
              <Link className="w-5 h-5 text-neutral-400" />
              <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Insumos & Ativos Vinculados (Obrigatórios na Venda)
              </h5>
            </div>
            <div className="flex flex-wrap gap-2">
              {assets.map(asset => {
                const isLinked = (v.correlated_assets || []).find((l: any) => l.asset_id === asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => onToggleAsset(idx, asset.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                      isLinked
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-400 border-neutral-200 hover:border-black'
                    }`}
                  >
                    <Package className="w-3 h-3" />
                    {asset.name}
                    {isLinked && <span className="ml-2 bg-white/20 px-1.5 rounded">x1</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Face Swap Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                className="w-5 h-5 accent-purple-600 cursor-pointer"
                checked={v.face_swap_enabled || false}
                onChange={e => updateVariant(idx, 'face_swap_enabled', e.target.checked)}
              />
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-900 cursor-pointer">
                  Face Swap (Experimentar Virtualmente)
                </label>
                <p className="text-[8px] text-purple-600 mt-1">
                  Permite que clientes enviem uma foto para ver como ficariam usando este produto
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
