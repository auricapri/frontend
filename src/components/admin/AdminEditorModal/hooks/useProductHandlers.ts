import { ProductVariant, Product, Collection } from '../../../../types';
import { supabase } from '../../../../utils/supabase';
import { AdminEditableData } from '../types';
import { generateUUID } from '../utils';

interface UseProductHandlersProps {
  item: { type: string; data: AdminEditableData; editLocale: string };
  onUpdateData: (newData: AdminEditableData) => void;
  setUploading: (value: string | null) => void;
}

export const useProductHandlers = ({
  item,
  onUpdateData,
  setUploading,
}: UseProductHandlersProps) => {

  const handleMasterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('master');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      const current = (item.data as Product).base_images || [];
      onUpdateData({ ...item.data, base_images: [...current, publicUrl] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Upload error: ${message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleGenericUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string = 'image_url',
    updateNested: (field: string, value: string) => void,
    updateSimple: (field: string, value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading('generic');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.type}-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `misc/${fileName}`;
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);

      if (item.type === 'banner') {
        updateNested('image_url', publicUrl);
      } else {
        updateSimple(field, publicUrl);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSelectVariantImage = (variantIndex: number, imageUrl: string) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    variants[variantIndex] = { ...variants[variantIndex], variant_images: [imageUrl] };
    onUpdateData({ ...newData, variants });
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    if (!variants[index]) return;
    variants[index] = { ...variants[index], [field]: value };
    newData.variants = variants;
    onUpdateData(newData);
  };

  const updateVariantLocalized = (idx: number, field: string, value: string) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    if (!variants[idx]) return;
    const v = { ...variants[idx] };

    let currentVal = v[field as keyof ProductVariant];
    if (typeof currentVal === 'string' && (currentVal as string).startsWith('{')) {
      const parsed = (() => {
        try { return JSON.parse(currentVal as string); } catch { return null; }
      })();
      if (parsed) currentVal = parsed;
    }

    if (!currentVal || typeof currentVal !== 'object') {
      const existingStr = typeof currentVal === 'string' ? currentVal : '';
      currentVal = { pt: existingStr, en: existingStr, es: '', fr: '' };
    }

    // @ts-ignore
    v[field] = { ...currentVal, [item.editLocale]: value };
    variants[idx] = v;
    newData.variants = variants;
    onUpdateData(newData as unknown as AdminEditableData);
  };

  const handleToggleAsset = (variantIdx: number, assetId: string) => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    const variant = variants[variantIdx];
    const currentLinks = variant.correlated_assets || [];

    let newLinks;
    if (currentLinks.find((l: any) => l.asset_id === assetId)) {
      newLinks = currentLinks.filter((l: any) => l.asset_id !== assetId);
    } else {
      newLinks = [...currentLinks, { asset_id: assetId, quantity_required: 1 }];
    }

    variants[variantIdx] = { ...variant, correlated_assets: newLinks };
    onUpdateData({ ...newData, variants } as unknown as AdminEditableData);
  };

  const addVariant = () => {
    if (item.type !== 'product') return;
    const newData = { ...(item.data as Product) };
    const variants = [...(newData.variants || [])];
    variants.push({
      id: generateUUID(),
      product_id: (item.data as Product).id,
      sku: `SKU-${Date.now()}`,
      size: 'Unique',
      color_name: { pt: 'Nova Cor', en: 'New Color', es: '', fr: '' },
      color_hex: '#000000',
      retail_price: 0,
      wholesale_price: 0,
      cost_price: 0,
      weight_g: 0,
      stock_quantity: 1,
      variant_images: [],
      is_active: true,
      face_swap_enabled: false,
      correlated_assets: [],
      composition: { pt: '', en: '' },
      care_instructions: { pt: '', en: '' }
    });
    newData.variants = variants;
    onUpdateData(newData as unknown as AdminEditableData);
  };

  const removeVariant = (idx: number) => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    onUpdateData({
      ...productData,
      variants: (productData.variants || []).filter((_: any, i: number) => i !== idx)
    } as unknown as AdminEditableData);
  };

  const removeBaseImage = (idx: number) => {
    if (item.type !== 'product') return;
    const productData = item.data as Product;
    const newData = {
      ...productData,
      base_images: (productData.base_images || []).filter((_: any, i: number) => i !== idx)
    };
    onUpdateData(newData as unknown as AdminEditableData);
  };

  const toggleCollectionForProduct = (collectionId: string) => {
    const current = (item.data as any).collection_ids || [];
    let newIds;
    if (current.includes(collectionId)) {
      newIds = current.filter((id: string) => id !== collectionId);
    } else {
      newIds = [...current, collectionId];
    }
    onUpdateData({ ...item.data, collection_ids: newIds } as AdminEditableData);
  };

  return {
    handleMasterUpload,
    handleGenericUpload,
    handleSelectVariantImage,
    updateVariant,
    updateVariantLocalized,
    handleToggleAsset,
    addVariant,
    removeVariant,
    removeBaseImage,
    toggleCollectionForProduct,
  };
};
