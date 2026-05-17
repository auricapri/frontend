/// UserProfileView Types
/// Type definitions for user profile components

import { UserProfile, Order, SavedAddress } from '../../../types';
import { Locale } from '../../../i18n';

export interface UserProfileViewProps {
  user: UserProfile;
  t: (key: string) => any;
  locale: Locale;
  onUpdate: (user: UserProfile) => void;
  onLogout?: () => void;
  storeConfig?: any; // allow: pragmatic any
}

export type TabId = 'profile' | 'orders' | 'addresses' | 'affiliate';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ProfileFormState {
  fullName: string;
  phone: string;
  cpf: string;
  isUpdating: boolean;
}

export interface OrdersState {
  orders: Order[];
  loading: boolean;
  selectedOrder: Order | null;
  viewingReceiptOrder: Order | null;
  orderReviews: Record<string, boolean>;
}

export interface AddressesState {
  addresses: SavedAddress[];
  loading: boolean;
  settingDefault: string | null;
  deletingAddress: string | null;
}

export interface LoyaltyData {
  xp: number;
  level: number;
  cashback: number;
  nextLevelXp: number;
  xpProgress: number;
}

// Helper function type
export type GetLocFn = (obj: any) => string; // allow: pragmatic any
