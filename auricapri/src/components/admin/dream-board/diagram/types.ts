import { Node, Edge } from 'reactflow';
import { TemplateType } from '../diagram-templates';

export interface DiagramEditorProps {
  diagram: {
    nodes: Node[];
    edges: Edge[];
    metadata?: DiagramMetadata;
  };
  products?: import('../../../types').Product[];
  collections?: import('../../../types').Collection[];
  locale?: import('../../../i18n').Locale;
  onSave: (diagram: { nodes: Node[]; edges: Edge[]; metadata?: DiagramMetadata }) => void;
  onClose: () => void;
}

export interface NodeComment {
  id: string;
  text: string;
  timestamp: string;
}

export interface DiagramMetadata {
  mainProductId?: string;
  resultNodeId?: string;
  description?: string;
  flowType?: 'cost' | 'revenue' | 'mixed';
  totalVariables?: Record<string, number>;
  finalResult?: number;
  modifiedProducts?: Array<{ productId: string; productName: string; changes: Record<string, unknown> }>;
  modifiedVariants?: Array<{ variantId: string; productId: string; changes: Record<string, unknown> }>;
  templateType?: TemplateType;
}

export interface VariantNodeData {
  label: string;
  variantId: string;
  productId: string;
  productName?: string;
  sku: string;
  color?: string;
  colorHex?: string;
  size?: string;
  retail_price: number;
  wholesale_price: number;
  cost_price?: number;
  stock_quantity: number;
  variant_images?: string[];
  isModified?: boolean;
  comments?: NodeComment[];
  onUpdateData?: (data: Record<string, unknown>) => void;
}

export interface ProductNodeData {
  label: string;
  productId?: string;
  productName: string;
  productImage?: string;
  value: number;
  unit: string;
  category?: string;
  color?: string;
  variants?: import('../../../types').DiagramVariant[];
  comments?: NodeComment[];
  onUpdateData?: (data: Record<string, unknown>) => void;
}

export interface ResultNodeData {
  label: string;
  title: string;
  formula?: string;
  variables: Record<string, number>;
  finalResult: number;
  color?: string;
  onUpdateData?: (data: Record<string, unknown>) => void;
}

export interface CustomEdgeData {
  label?: string;
  onLabelChange?: (label: string) => void;
}

export const NODE_TEMPLATES = [
  { label: 'Fornecedor', color: '#6366F1', type: 'default' },
  { label: 'Producao', color: '#F59E0B', type: 'default' },
  { label: 'QA/Inspecao', color: '#EF4444', type: 'default' },
  { label: 'Estoque', color: '#10B981', type: 'default' },
  { label: 'Marketing', color: '#EC4899', type: 'default' },
  { label: 'Campanha', color: '#8B5CF6', type: 'default' },
  { label: 'Venda', color: '#3B82F6', type: 'default' },
  { label: 'Cliente', color: '#14B8A6', type: 'default' },
  { label: 'Logistica', color: '#F97316', type: 'default' },
  { label: 'Personalizado', color: '#6B7280', type: 'default' },
] as const;

export const SPECIAL_NODES = [
  { label: 'Imagem', color: '#0EA5E9', type: 'image', icon: 'Image', description: 'Upload de imagem' },
  { label: 'Produto', color: '#06B6D4', type: 'product', icon: 'Package', description: 'Produto com valor' },
  { label: 'Variacao', color: '#F59E0B', type: 'variant', icon: 'Tag', description: 'Variacao de produto' },
  { label: 'Calculo', color: '#22C55E', type: 'calculator', icon: 'Calculator', description: 'Formula matematica' },
  { label: 'Variavel', color: '#A855F7', type: 'variable', icon: 'Variable', description: 'Valor numerico' },
  { label: 'Resultado', color: '#16A34A', type: 'result', icon: 'CheckCircle2', description: 'Resultado final' },
] as const;

export const nodeStyles = {
  padding: '12px 20px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  border: '2px solid',
  minWidth: '120px',
  textAlign: 'center' as const,
};
