export interface DiagramComment {
  id: string;
  text: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface DiagramVariant {
  variantId: string;
  productId: string;
  sku: string;
  color?: string;
  colorHex?: string;
  size?: string;
  retail_price: number;
  wholesale_price: number;
  cost_price?: number;
  stock_quantity: number;
  isModified?: boolean;
}

export interface ModifiedProduct {
  productId: string;
  productName: string;
  changes: Record<string, any>;
}

export interface ModifiedVariant {
  variantId: string;
  productId: string;
  changes: Record<string, any>;
}

export interface DiagramMetadata {
  mainProductId?: string;
  resultNodeId?: string;
  description?: string;
  flowType?: 'cost' | 'revenue' | 'mixed';
  totalVariables?: Record<string, number>;
  finalResult?: number;
  modifiedProducts?: ModifiedProduct[];
  modifiedVariants?: ModifiedVariant[];
  templateType?: 'cost' | 'revenue' | 'collection' | 'custom';
}

export interface DiagramData {
  nodes: any[];
  edges: any[];
  metadata?: DiagramMetadata;
}
