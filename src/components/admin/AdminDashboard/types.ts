/// Admin Dashboard Types
/// Type definitions for admin dashboard

import { Locale } from '../../../i18n';
import { Coupon, Supplier } from '../../../types';
import { Campaign } from '../../../api/marketing.api';

export interface AdminDashboardProps {
  onLogout: () => void;
  t: (key: string) => string;
  locale: Locale;
  onProductChange: () => void;
}

export interface EditorItem {
  type: string;
  data: any;
}

export interface DeleteConfirmState {
  productIds: string[];
  productNames: string[];
}

export interface DeleteQueueItem {
  id: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  error?: string;
}

export interface EditorState {
  editingItem: EditorItem | null;
  editingCoupon: Coupon | null;
  editingSupplier: Supplier | null;
  showSupplierEditor: boolean;
  editingCampaign: Campaign | null;
  showCampaignEditor: boolean;
}

export type MarketingSubTab = 'banners' | 'campaigns' | 'users' | 'analytics';

export interface SidebarNavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export interface SidebarCategory {
  id: string;
  label: string;
  items: SidebarNavItem[];
}
