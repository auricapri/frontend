/**
 * Shared types for marketplace admin components
 */

import type { MarketplaceConfig } from '../../../types/marketplace';
import type { Product } from '../../../types';
import type {
  FeeCalculation,
  MinimumPriceCalculation,
  MLProductBasic,
  MLProductFull,
} from '../../../api/marketplace.api';

// ============================================================================
// Marketplace Brand Configuration
// ============================================================================

export interface MarketplaceBrand {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  bgGradient: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  hoverBg: string;
  borderColor: string;
  description: string;
  available: boolean;
}

export const MARKETPLACE_BRANDS = {
  'mercado-livre': {
    id: 'mercado_livre',
    name: 'Mercado Livre',
    shortName: 'ML',
    logo: 'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years@2x.png',
    bgGradient: 'from-yellow-400 to-yellow-500',
    bgColor: 'bg-yellow-400',
    textColor: 'text-yellow-900',
    accentColor: '#FFE600',
    hoverBg: 'hover:bg-yellow-50',
    borderColor: 'border-yellow-400',
    description: 'O maior marketplace da América Latina',
    available: true,
  },
  'shopee': {
    id: 'shopee',
    name: 'Shopee',
    shortName: 'SP',
    logo: 'https://cf.shopee.com.br/file/br-50009109-f6d79dbc4021a3eb57f61ffe2c1bfbda_xhdpi',
    bgGradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    accentColor: '#EE4D2D',
    hoverBg: 'hover:bg-orange-50',
    borderColor: 'border-orange-500',
    description: 'Compre e venda pelo celular',
    available: false,
  },
  'aliexpress': {
    id: 'aliexpress',
    name: 'AliExpress',
    shortName: 'AE',
    logo: 'https://ae01.alicdn.com/kf/S7aca51d4a3d54c1d89e1f50b6c1c1c1cT.png',
    bgGradient: 'from-red-600 to-red-700',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    accentColor: '#E62E04',
    hoverBg: 'hover:bg-red-50',
    borderColor: 'border-red-600',
    description: 'Global marketplace',
    available: false,
  },
  'temu': {
    id: 'temu',
    name: 'Temu',
    shortName: 'TM',
    logo: 'https://aimg.kwcdn.com/upload_aimg/temu/da515ef6-a498-4ef3-9823-e1e53a10be5b.png',
    bgGradient: 'from-orange-600 to-orange-700',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    accentColor: '#FB7701',
    hoverBg: 'hover:bg-orange-50',
    borderColor: 'border-orange-600',
    description: 'Shop like a billionaire',
    available: false,
  },
  'alibaba': {
    id: 'alibaba',
    name: 'Alibaba',
    shortName: 'AB',
    logo: 'https://s.alicdn.com/@img/imgextra/i1/O1CN01AKUdEM1bz7VDjldnS_!!6000000003535-2-tps-160-64.png',
    bgGradient: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    accentColor: '#FF6A00',
    hoverBg: 'hover:bg-orange-50',
    borderColor: 'border-orange-500',
    description: 'Global B2B marketplace',
    available: false,
  },
  'tiktok-shop': {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    shortName: 'TT',
    logo: 'https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png',
    bgGradient: 'from-black to-gray-900',
    bgColor: 'bg-black',
    textColor: 'text-white',
    accentColor: '#FF0050',
    hoverBg: 'hover:bg-gray-50',
    borderColor: 'border-black',
    description: 'Venda direto no TikTok para milhoes de usuarios',
    available: true,
  },
} as const;

export type MarketplaceId = keyof typeof MARKETPLACE_BRANDS;
export type ViewState = 'grid' | 'marketplace';
export type MarketplaceTab = 'products' | 'orders' | 'questions' | 'metrics' | 'settings';

// ============================================================================
// Provider Types
// ============================================================================

export interface Provider {
  id: string;
  code: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface VariantPrice {
  variantId: string;
  variantLabel: string;
  costPrice: number;
  retailPrice: number;
  marketplacePrice: number;
  image: string | null;
  stock: number;
  sku: string;
  colorHex: string | null;
  size: string | null;
  colorName: string | null;
  marginPercent: number;
  estimatedProfit: number;
  commissionPercent: number;
}

export interface VariantPriceMapping {
  external_variation_id: number;
  local_variant_id: string;
  marketplace_price: number;
  label: string;
}

// ============================================================================
// Toast Types
// ============================================================================

export interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

// ============================================================================
// Modal Props
// ============================================================================

export interface ImportProductModalProps {
  brand: MarketplaceBrand;
  configId?: string;
  localProducts?: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

export interface ImportFromMarketplaceModalProps {
  brand: MarketplaceBrand;
  configId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ProductEditModalProps {
  brand: MarketplaceBrand;
  configId?: string;
  product: MLProductBasic;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ConnectModalProps {
  brand: MarketplaceBrand;
  providerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================================================
// Component Props
// ============================================================================

export interface PricingCalculatorProps {
  brand: MarketplaceBrand;
  configId?: string;
  product: Product;
  existingMapping?: {
    marketplace_price?: number;
    variant_prices?: Array<{
      local_variant_id: string;
      marketplace_price: number;
    }>;
  };
  onPriceChange: (price: number, variantPrices: VariantPrice[]) => void;
}

export interface DescriptionEditorProps {
  brand: MarketplaceBrand;
  value: string;
  onChange: (value: string) => void;
  originalDescription?: string;
}

// ============================================================================
// Tab Props
// ============================================================================

export interface TabBaseProps {
  brand: MarketplaceBrand;
  config: MarketplaceConfig;
  onRefresh?: () => void;
}

export interface ProductsTabProps extends TabBaseProps {
  localProducts: Product[];
}

export interface OrdersTabProps extends TabBaseProps {}

export interface QuestionsTabProps extends TabBaseProps {}

export interface MetricsTabProps extends TabBaseProps {}

export interface SettingsTabProps extends TabBaseProps {}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type {
  MarketplaceConfig,
  Product,
  FeeCalculation,
  MinimumPriceCalculation,
  MLProductBasic,
  MLProductFull,
};
