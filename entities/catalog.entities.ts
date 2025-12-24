
import { LocalizedText } from './common.entities';

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size?: string;
  color_name: LocalizedText;
  color_hex?: string;
  
  // PREÇOS DE VENDA (Output)
  retail_price: number;
  wholesale_price: number;
  
  // DADOS FÍSICOS & CUSTOS (Input para Precificação V19)
  cost_price?: number; // C_prod (Custo Aquisição/Produção específico deste tamanho)
  weight_g?: number;   // Peso específico
  dimensions?: ProductDimensions; // Dimensões específicas para cubagem
  ncm?: string;       // NCM pode variar se for kit, mas geralmente segue o produto, mantido aqui por flexibilidade
  gtin?: string;      // Código de Barras

  stock_quantity: number;
  variant_images: string[];
  attributes?: Record<string, any>;
  is_active: boolean;
}

// PRICING SCENARIO (Rules & Logic only)
// Agora isso define o CONTEXTO de venda, não o produto físico.
export interface PricingScenario {
  id: string;
  name: string; // e.g., "E-commerce SP", "Marketplace Full", "B2B SC"
  
  // Variáveis de Mercado (Regras)
  channel: 'ecommerce' | 'marketplace' | 'wholesale';
  region_uf: string;
  tax_rate_percent: number;   // T_var (ICMS/Difal do cenário)
  ads_cac_target: number;     // C_ads (Meta de Custo por Aquisição para este canal)
  commission_percent: number; // Marketplace fee
  
  // Meta de Lucro para este cenário
  target_margin_percent: number;
}

export interface Category {
  id: string;
  name: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  _associatedProductIds?: string[]; // Helper para UI
}

export interface Collection {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  slug: string;
  image_url?: string;
  is_active: boolean;
  seo_metadata?: any;
  _associatedProductIds?: string[]; // Helper para UI
}

export interface Product {
  id: string;
  category_id: string;
  collection_ids?: string[];
  name: LocalizedText;
  description: LocalizedText;
  slug: LocalizedText;
  is_active: boolean;
  is_highlight: boolean;
  
  // Pricing Scenarios (Contextos de Venda disponíveis para este produto)
  pricing_scenarios?: PricingScenario[];

  base_images: string[];
  default_image_url?: string;
  created_at?: string;
  variants?: ProductVariant[];
  average_rating?: number;
  total_reviews?: number;
}
