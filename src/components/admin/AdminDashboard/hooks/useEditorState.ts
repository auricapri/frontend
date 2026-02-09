/// Editor State Hook
/// Manages state for various editor modals

import { useState } from 'react';
import { Coupon, Supplier } from '../../../../types';
import { Campaign } from '../../../../api/marketing.api';
import { EditorItem } from '../types';

export const useEditorState = () => {
  const [editingItem, setEditingItem] = useState<EditorItem | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierEditor, setShowSupplierEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showCampaignEditor, setShowCampaignEditor] = useState(false);
  const [isDeletingTaxonomy, setIsDeletingTaxonomy] = useState(false);

  const openProductEditor = (product?: any) => {
    setEditingItem({
      type: 'product',
      data: product || { name: { pt: '' }, variants: [], is_active: true }
    });
  };

  const openCategoryEditor = (category?: any) => {
    setEditingItem({
      type: 'category',
      data: category || { name: { pt: '' }, is_active: true }
    });
  };

  const openCollectionEditor = (collection?: any) => {
    setEditingItem({
      type: 'collection',
      data: collection || { name: { pt: '' }, is_active: true }
    });
  };

  const openBannerEditor = (banner?: any) => {
    setEditingItem({ type: 'banner', data: banner });
  };

  const openSupplierEditor = (supplier?: Supplier | null) => {
    setEditingSupplier(supplier || null);
    setShowSupplierEditor(true);
  };

  const closeSupplierEditor = () => {
    setShowSupplierEditor(false);
    setEditingSupplier(null);
  };

  const openCampaignEditor = (campaign?: Campaign | null) => {
    setEditingCampaign(campaign || null);
    setShowCampaignEditor(true);
  };

  const closeCampaignEditor = () => {
    setShowCampaignEditor(false);
    setEditingCampaign(null);
  };

  const openCouponEditor = (coupon?: Coupon) => {
    setEditingCoupon(coupon || {
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      is_active: true
    } as Coupon);
  };

  return {
    editingItem,
    setEditingItem,
    editingCoupon,
    setEditingCoupon,
    editingSupplier,
    showSupplierEditor,
    editingCampaign,
    showCampaignEditor,
    isDeletingTaxonomy,
    setIsDeletingTaxonomy,
    openProductEditor,
    openCategoryEditor,
    openCollectionEditor,
    openBannerEditor,
    openSupplierEditor,
    closeSupplierEditor,
    openCampaignEditor,
    closeCampaignEditor,
    openCouponEditor,
  };
};
