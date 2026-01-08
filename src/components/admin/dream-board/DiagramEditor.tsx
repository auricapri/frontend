import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Plus, Trash2, Image, Calculator, Upload, Variable, Package, CheckCircle2, Zap, TrendingUp, MessageSquare, ChevronDown, ChevronRight, Layout, Database, Tag } from 'lucide-react';
import { Product, Collection, ProductVariant, LocalizedText, DiagramVariant } from '../../../types';
import ResourcePanel from './ResourcePanel';
import { 
  generateCostFlowTemplate, 
  generateRevenueFlowTemplate, 
  generateCollectionFlowTemplate,
  generateProductNode,
  generateVariantNode,
  TEMPLATE_CONFIGS,
  TemplateType
} from './diagram-templates';
import { Locale } from '../../../i18n';

// ==================== INTERFACES ====================

interface DiagramEditorProps {
  diagram: {
    nodes: any[];
    edges: any[];
    metadata?: DiagramMetadata;
  };
  products?: Product[];
  collections?: Collection[];
  locale?: Locale;
  onSave: (diagram: { nodes: any[]; edges: any[]; metadata?: DiagramMetadata }) => void;
  onClose: () => void;
}

interface NodeComment {
  id: string;
  text: string;
  timestamp: string;
}

interface DiagramMetadata {
  mainProductId?: string;
  resultNodeId?: string;
  description?: string;
  flowType?: 'cost' | 'revenue' | 'mixed';
  totalVariables?: Record<string, number>;
  finalResult?: number;
  modifiedProducts?: Array<{ productId: string; productName: string; changes: Record<string, any> }>;
  modifiedVariants?: Array<{ variantId: string; productId: string; changes: Record<string, any> }>;
  templateType?: TemplateType;
}

interface VariantNodeData {
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
  onUpdateData?: (data: any) => void;
}

interface ProductNodeData {
  label: string;
  productId?: string;
  productName: string;
  productImage?: string;
  value: number;
  unit: string;
  category?: string;
  color?: string;
  variants?: DiagramVariant[];
  comments?: NodeComment[];
  onUpdateData?: (data: any) => void;
}

interface ResultNodeData {
  label: string;
  title: string;
  formula?: string;
  variables: Record<string, number>;
  finalResult: number;
  color?: string;
  onUpdateData?: (data: any) => void;
}

// ==================== CONSTANTES ====================

const NODE_TEMPLATES = [
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
];

const SPECIAL_NODES = [
  { label: 'Imagem', color: '#0EA5E9', type: 'image', icon: Image, description: 'Upload de imagem' },
  { label: 'Produto', color: '#06B6D4', type: 'product', icon: Package, description: 'Produto com valor' },
  { label: 'Variacao', color: '#F59E0B', type: 'variant', icon: Tag, description: 'Variacao de produto' },
  { label: 'Calculo', color: '#22C55E', type: 'calculator', icon: Calculator, description: 'Formula matematica' },
  { label: 'Variavel', color: '#A855F7', type: 'variable', icon: Variable, description: 'Valor numerico' },
  { label: 'Resultado', color: '#16A34A', type: 'result', icon: CheckCircle2, description: 'Resultado final' },
];

const nodeStyles = {
  padding: '12px 20px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  border: '2px solid',
  minWidth: '120px',
  textAlign: 'center' as const,
};

// ==================== HELPER FUNCTIONS ====================

const generateVarName = (name: string): string => {
  return `var_${name?.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'item'}`;
};

const getLocalizedText = (text: LocalizedText | string | undefined, locale: string = 'pt'): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale as keyof LocalizedText] || text.pt || text.en || '';
};

// ==================== COLLAPSIBLE COMMENTS COMPONENT ====================

interface CollapsibleCommentsProps {
  comments: NodeComment[];
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
}

const CollapsibleComments: React.FC<CollapsibleCommentsProps> = ({ comments, onAddComment, onDeleteComment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="border-t border-neutral-200 mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-neutral-50 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-600">
          <MessageSquare className="w-3 h-3" />
          Comentarios ({comments.length})
        </span>
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-neutral-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-2 pb-2 space-y-2">
          {comments.length > 0 && (
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-amber-50 rounded px-2 py-1.5 group relative">
                  <p className="text-[10px] text-neutral-700">{comment.text}</p>
                  <p className="text-[8px] text-neutral-400 mt-0.5">
                    {new Date(comment.timestamp).toLocaleDateString('pt-BR')}
                  </p>
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
                  >
                    <X className="w-2.5 h-2.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Adicionar comentario..."
              className="flex-1 px-2 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== EDGE COMPONENT ====================

interface CustomEdgeData {
  label?: string;
  onLabelChange?: (label: string) => void;
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data?.onLabelChange) {
      data.onLabelChange(labelText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLabelText(data?.label || '');
      setIsEditing(false);
    }
  };

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeWidth: 2 }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-xs border border-neutral-300 rounded-lg bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              placeholder="Comentario..."
            />
          ) : (
            <button
              onDoubleClick={handleDoubleClick}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                labelText
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                  : 'bg-white/80 text-neutral-400 border border-dashed border-neutral-300 hover:border-neutral-400 hover:bg-white'
              }`}
              title="Duplo clique para editar"
            >
              <MessageSquare className="w-3 h-3" />
              {labelText || 'Adicionar nota'}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// ==================== NODE COMPONENTS ====================

const ImageNode: React.FC<NodeProps> = ({ data, selected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (data.onUpdateImage) {
          data.onUpdateImage(event.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden ${selected ? 'border-blue-500 shadow-lg' : 'border-neutral-200'}`}
      style={{ minWidth: 150, minHeight: 100 }}
    >
      {/* Handles em todas as direções */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-blue-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-blue-500" />
      
      {data.imageUrl ? (
        <div className="relative group">
          <img
            src={data.imageUrl}
            alt={data.label || 'Imagem'}
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-white text-black text-xs font-medium rounded-lg"
            >
              Trocar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 flex flex-col items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
        >
          <Upload className="w-6 h-6 text-neutral-400" />
          <span className="text-xs text-neutral-500">Upload Imagem</span>
        </button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      
      <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100">
        <input
          type="text"
          value={data.label || ''}
          onChange={(e) => data.onUpdateLabel?.(e.target.value)}
          placeholder="Legenda..."
          className="w-full text-xs text-center bg-transparent border-none focus:outline-none"
        />
      </div>
      
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-blue-500" />
    </div>
  );
};

const ProductNode: React.FC<NodeProps<ProductNodeData>> = ({ data, selected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productName, setProductName] = useState(data.productName || 'Produto');
  const [productImage, setProductImage] = useState(data.productImage || '');
  const [value, setValue] = useState<number>(data.value ?? 0);
  const [unit, setUnit] = useState<string>(data.unit ?? 'R$');
  const [category, setCategory] = useState<string>(data.category ?? '');

  const varName = generateVarName(productName);

  const handleUpdate = useCallback((updates: Partial<ProductNodeData>) => {
    if (data.onUpdateData) {
      data.onUpdateData({
        productName,
        productImage,
        value,
        unit,
        category,
        ...updates,
      });
    }
  }, [data, productName, productImage, value, unit, category]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = event.target?.result as string;
        setProductImage(newImage);
        handleUpdate({ productImage: newImage });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden w-52 ${
        selected ? 'border-cyan-500 shadow-lg' : 'border-neutral-200'
      }`}
    >
      {/* Handles em todas as direções */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-cyan-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-cyan-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-cyan-500" />
      
      {/* Imagem do Produto */}
      {productImage ? (
        <div className="relative group">
          <img
            src={productImage}
            alt={productName}
            className="w-full h-28 object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-white text-black text-xs font-medium rounded-lg"
            >
              Trocar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-28 flex flex-col items-center justify-center gap-2 bg-cyan-50 hover:bg-cyan-100 transition-colors"
        >
          <Package className="w-8 h-8 text-cyan-400" />
          <span className="text-xs text-cyan-600">Adicionar Imagem</span>
        </button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Nome e Categoria */}
      <div className="px-3 py-2 border-b border-neutral-100 bg-cyan-50">
        <input
          type="text"
          value={productName}
          onChange={(e) => {
            setProductName(e.target.value);
            handleUpdate({ productName: e.target.value });
          }}
          placeholder="Nome do produto..."
          className="w-full text-xs font-bold text-neutral-800 bg-transparent border-none focus:outline-none"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            handleUpdate({ category: e.target.value });
          }}
          placeholder="Categoria (ex: Fornecedor, Embalagem)"
          className="w-full text-[10px] text-neutral-500 bg-transparent border-none focus:outline-none mt-0.5"
        />
      </div>

      {/* Valor e Unidade */}
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const newVal = parseFloat(e.target.value) || 0;
              setValue(newVal);
              handleUpdate({ value: newVal });
            }}
            className="flex-1 px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
            step="0.01"
            placeholder="0.00"
          />
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              handleUpdate({ unit: e.target.value });
            }}
            className="px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            <option value="R$">R$</option>
            <option value="kg">kg</option>
            <option value="un">un</option>
            <option value="%">%</option>
            <option value="h">h</option>
          </select>
        </div>

        {/* Variável auto-gerada */}
        <div className="bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-200">
          <p className="text-[10px] font-mono text-purple-700 font-bold">
            {varName}
          </p>
          <p className="text-xs font-bold text-purple-900">
            {value} {unit}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-cyan-500" />
    </div>
  );
};

// ==================== VARIANT NODE COMPONENT ====================

const VariantNode: React.FC<NodeProps<VariantNodeData>> = ({ data, selected }) => {
  const [sku, setSku] = useState(data.sku || '');
  const [color, setColor] = useState(data.color || '');
  const [colorHex, setColorHex] = useState(data.colorHex || '#6B7280');
  const [size, setSize] = useState(data.size || '');
  const [retailPrice, setRetailPrice] = useState(data.retail_price ?? 0);
  const [wholesalePrice, setWholesalePrice] = useState(data.wholesale_price ?? 0);
  const [costPrice, setCostPrice] = useState(data.cost_price ?? 0);
  const [stockQuantity, setStockQuantity] = useState(data.stock_quantity ?? 0);
  const [comments, setComments] = useState<NodeComment[]>(data.comments || []);
  const variantImage = data.variant_images?.[0] || '';

  const varName = generateVarName(sku || 'variacao');

  const handleUpdate = useCallback((updates: Partial<VariantNodeData>) => {
    if (data.onUpdateData) {
      data.onUpdateData({
        sku,
        color,
        colorHex,
        size,
        retail_price: retailPrice,
        wholesale_price: wholesalePrice,
        cost_price: costPrice,
        stock_quantity: stockQuantity,
        variant_images: data.variant_images,
        comments,
        isModified: true,
        ...updates,
      });
    }
  }, [data, sku, color, colorHex, size, retailPrice, wholesalePrice, costPrice, stockQuantity, comments]);

  const handleAddComment = (text: string) => {
    const newComment: NodeComment = {
      id: `comment-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    handleUpdate({ comments: updatedComments });
  };

  const handleDeleteComment = (id: string) => {
    const updatedComments = comments.filter(c => c.id !== id);
    setComments(updatedComments);
    handleUpdate({ comments: updatedComments });
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden w-48 ${
        selected ? 'border-amber-500 shadow-lg' : 'border-neutral-200'
      } ${data.isModified ? 'ring-2 ring-amber-300' : ''}`}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-amber-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-amber-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-amber-500" />

      {/* Imagem da Variante */}
      {variantImage ? (
        <div className="relative">
          <img
            src={variantImage}
            alt={sku}
            className="w-full h-24 object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-24 bg-amber-50 flex items-center justify-center border-b border-amber-100">
          <Tag className="w-8 h-8 text-amber-300" />
        </div>
      )}

      <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: colorHex }}
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              handleUpdate({ sku: e.target.value });
            }}
            placeholder="SKU..."
            className="w-full text-xs font-bold text-neutral-800 bg-transparent border-none focus:outline-none"
          />
          {data.productName && (
            <p className="text-[10px] text-neutral-500 truncate">{data.productName}</p>
          )}
        </div>
        <Tag className="w-4 h-4 text-amber-500 flex-shrink-0" />
      </div>

      <div className="p-2 space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[8px] text-neutral-500 uppercase">Cor</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  handleUpdate({ color: e.target.value });
                }}
                placeholder="Cor"
                className="flex-1 px-1.5 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <input
                type="color"
                value={colorHex}
                onChange={(e) => {
                  setColorHex(e.target.value);
                  handleUpdate({ colorHex: e.target.value });
                }}
                className="w-6 h-6 rounded border border-neutral-200 cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="text-[8px] text-neutral-500 uppercase">Tamanho</label>
            <input
              type="text"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                handleUpdate({ size: e.target.value });
              }}
              placeholder="P, M, G..."
              className="w-full px-1.5 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[8px] text-neutral-500 uppercase">Varejo</label>
            <input
              type="number"
              value={retailPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setRetailPrice(val);
                handleUpdate({ retail_price: val });
              }}
              className="w-full px-1.5 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-[8px] text-neutral-500 uppercase">Atacado</label>
            <input
              type="number"
              value={wholesalePrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setWholesalePrice(val);
                handleUpdate({ wholesale_price: val });
              }}
              className="w-full px-1.5 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[8px] text-neutral-500 uppercase">Custo</label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setCostPrice(val);
                handleUpdate({ cost_price: val });
              }}
              className="w-full px-1.5 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-[8px] text-neutral-500 uppercase">Estoque</label>
            <input
              type="number"
              value={stockQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setStockQuantity(val);
                handleUpdate({ stock_quantity: val });
              }}
              className="w-full px-1.5 py-1 text-[10px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="bg-purple-50 px-2 py-1 rounded border border-purple-200">
          <p className="text-[8px] font-mono text-purple-700 font-bold">{varName}</p>
          <p className="text-[10px] font-bold text-purple-900">R$ {retailPrice.toFixed(2)}</p>
        </div>
      </div>

      <CollapsibleComments
        comments={comments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-amber-500" />
    </div>
  );
};

const CalculatorNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [formula, setFormula] = useState(data.formula || '');
  const [variables, setVariables] = useState<Record<string, number>>(data.variables || {});
  const [result, setResult] = useState<number | string>(data.result || 0);

  const extractVariables = (formulaStr: string): string[] => {
    const matches = formulaStr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const reserved = ['Math', 'PI', 'E', 'abs', 'sqrt', 'pow', 'min', 'max', 'round', 'floor', 'ceil'];
    return [...new Set(matches.filter(m => !reserved.includes(m)))];
  };

  const calculateResult = useCallback(() => {
    try {
      const vars = extractVariables(formula);
      let evalFormula = formula;
      
      vars.forEach(v => {
        const value = variables[v] ?? 0;
        evalFormula = evalFormula.replace(new RegExp(`\\b${v}\\b`, 'g'), String(value));
      });
      
      evalFormula = evalFormula
        .replace(/PI/g, String(Math.PI))
        .replace(/E/g, String(Math.E));
      
      const safeEval = new Function(`return ${evalFormula}`)();
      const newResult = typeof safeEval === 'number' ? Math.round(safeEval * 100) / 100 : 'Erro';
      setResult(newResult);
      
      if (data.onUpdateData) {
        data.onUpdateData({ formula, variables, result: newResult });
      }
    } catch {
      setResult('Erro');
    }
  }, [formula, variables, data]);

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    const vars = extractVariables(newFormula);
    const newVars: Record<string, number> = {};
    vars.forEach(v => {
      newVars[v] = variables[v] ?? 0;
    });
    setVariables(newVars);
  };

  const handleVariableChange = (varName: string, value: number) => {
    setVariables(prev => ({ ...prev, [varName]: value }));
  };

  useEffect(() => {
    calculateResult();
  }, [formula, variables, calculateResult]);

  const varList = extractVariables(formula);

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden ${selected ? 'border-green-500 shadow-lg' : 'border-neutral-200'}`}
      style={{ minWidth: 200 }}
    >
      {/* Handles em todas as direções */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-green-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-green-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-green-500" />
      
      <div className="px-3 py-2 bg-green-50 border-b border-green-100 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-green-600" />
        <span className="text-xs font-bold text-green-700">Calculo</span>
      </div>
      
      <div className="p-3 space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">Formula</label>
          <input
            type="text"
            value={formula}
            onChange={(e) => handleFormulaChange(e.target.value)}
            placeholder="var_produto + var_embalagem"
            className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
          />
        </div>
        
        {varList.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">Variaveis</label>
            {varList.map(varName => (
              <div key={varName} className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-600 w-20 truncate">{varName}</span>
                <input
                  type="number"
                  value={variables[varName] ?? 0}
                  onChange={(e) => handleVariableChange(varName, parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2 py-1 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">Resultado:</span>
            <span className="text-lg font-bold text-green-600">{result}</span>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-green-500" />
    </div>
  );
};

const VariableNode: React.FC<NodeProps> = ({ data, selected }) => {
  const [name, setName] = useState(data.varName || 'variavel');
  const [value, setValue] = useState<number>(data.varValue ?? 0);

  const handleUpdate = useCallback((newName: string, newValue: number) => {
    if (data.onUpdateData) {
      data.onUpdateData({ varName: newName, varValue: newValue });
    }
  }, [data]);

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden ${selected ? 'border-purple-500 shadow-lg' : 'border-neutral-200'}`}
      style={{ minWidth: 150 }}
    >
      {/* Handles em todas as direções */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-purple-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-purple-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-purple-500" />
      
      <div className="px-3 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
        <Variable className="w-4 h-4 text-purple-600" />
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            handleUpdate(e.target.value, value);
          }}
          className="flex-1 text-xs font-bold text-purple-700 bg-transparent border-none focus:outline-none font-mono"
        />
      </div>
      
      <div className="p-3">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newVal = parseFloat(e.target.value) || 0;
            setValue(newVal);
            handleUpdate(name, newVal);
          }}
          className="w-full px-3 py-2 text-center text-lg font-bold border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </div>
      
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-purple-500" />
    </div>
  );
};

const ResultNode: React.FC<NodeProps<ResultNodeData>> = ({ data, selected }) => {
  const [title, setTitle] = useState(data.title ?? 'Resultado Final');
  const [formula, setFormula] = useState(data.formula ?? '');
  const variables = data.variables ?? {};
  const finalResult = data.finalResult ?? 0;

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (data.onUpdateData) {
      data.onUpdateData({ title: newTitle });
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    if (data.onUpdateData) {
      data.onUpdateData({ formula: newFormula });
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border-2 overflow-hidden w-60 ${
        selected ? 'border-emerald-500 shadow-lg' : 'border-neutral-200'
      }`}
    >
      {/* Handles em todas as direções - ResultNode aceita conexões de qualquer lado */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-emerald-500" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-emerald-500" />
      
      {/* Header */}
      <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 text-xs font-bold bg-transparent border-none focus:outline-none text-emerald-900"
        />
      </div>

      {/* Formula Customizada (opcional) */}
      <div className="px-3 pt-3">
        <label className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
          Formula (opcional)
        </label>
        <input
          type="text"
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          placeholder="Soma automatica se vazio"
          className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono mt-1"
        />
      </div>

      {/* Variáveis Utilizadas */}
      <div className="p-3 space-y-2 max-h-32 overflow-y-auto">
        {Object.entries(variables).length > 0 ? (
          <>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
              Variaveis ({Object.keys(variables).length})
            </p>
            {Object.entries(variables).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center text-xs bg-neutral-50 px-2 py-1 rounded border border-neutral-200"
              >
                <span className="font-mono text-purple-700 font-medium truncate max-w-[100px]">{key}</span>
                <span className="font-bold text-neutral-900">{typeof value === 'number' ? value.toFixed(2) : value}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-neutral-400">
            <TrendingUp className="w-6 h-6 mb-1" />
            <p className="text-xs italic">Conecte produtos ou variaveis</p>
          </div>
        )}
      </div>

      {/* Resultado Final */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-100">
        <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-bold mb-1">
          Valor Final
        </p>
        <p className="text-3xl font-black text-emerald-600">
          {typeof finalResult === 'number' ? finalResult.toFixed(2) : finalResult}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <Zap className="w-3 h-3 text-amber-500" />
          <p className="text-[10px] text-emerald-600">
            Pronto para IA processar
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-emerald-500" />
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const DiagramEditor: React.FC<DiagramEditorProps> = ({ 
  diagram, 
  products = [], 
  collections = [], 
  locale = 'pt', 
  onSave, 
  onClose 
}) => {
  const [nodeDataUpdates, setNodeDataUpdates] = useState<Record<string, any>>({});
  const edgesRef = useRef<Edge[]>([]);
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Função para extrair todas as variáveis do diagrama (para metadados e header)
  const extractAllVariables = useCallback((nodes: Node[]): Record<string, number> => {
    const vars: Record<string, number> = {};
    
    nodes.forEach(node => {
      if (node.type === 'product') {
        const varName = generateVarName(node.data.productName || 'produto');
        vars[varName] = node.data.value ?? 0;
      } else if (node.type === 'variant') {
        const varName = generateVarName(node.data.sku || 'variacao');
        vars[varName] = node.data.retail_price ?? 0;
      } else if (node.type === 'variable') {
        const varName = node.data.varName ?? `var_${node.id}`;
        vars[varName] = node.data.varValue ?? 0;
      } else if (node.type === 'calculator' && typeof node.data.result === 'number') {
        vars[`calc_${node.id.replace('node-', '')}`] = node.data.result;
      }
    });
    
    return vars;
  }, []);

  // Função para encontrar todos os nós conectados a um nó específico (recursivamente)
  const findConnectedNodes = useCallback((
    targetNodeId: string,
    allNodes: Node[],
    allEdges: Edge[],
    visited: Set<string> = new Set()
  ): Node[] => {
    if (visited.has(targetNodeId)) return [];
    visited.add(targetNodeId);

    const connectedNodes: Node[] = [];
    
    // Encontrar edges que apontam para o targetNode (source -> target)
    const incomingEdges = allEdges.filter(e => e.target === targetNodeId);
    
    incomingEdges.forEach(edge => {
      const sourceNode = allNodes.find(n => n.id === edge.source);
      if (sourceNode && !visited.has(sourceNode.id)) {
        connectedNodes.push(sourceNode);
        // Recursivamente encontrar nós conectados ao source
        const upstreamNodes = findConnectedNodes(sourceNode.id, allNodes, allEdges, visited);
        connectedNodes.push(...upstreamNodes);
      }
    });

    return connectedNodes;
  }, []);

  // Função para extrair variáveis apenas dos nós conectados
  const extractConnectedVariables = useCallback((
    resultNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): Record<string, number> => {
    const vars: Record<string, number> = {};
    const connectedNodes = findConnectedNodes(resultNodeId, allNodes, allEdges);
    
    connectedNodes.forEach(node => {
      if (node.type === 'product') {
        const varName = generateVarName(node.data.productName || 'produto');
        vars[varName] = node.data.value ?? 0;
      } else if (node.type === 'variant') {
        const varName = generateVarName(node.data.sku || 'variacao');
        vars[varName] = node.data.retail_price ?? 0;
      } else if (node.type === 'variable') {
        const varName = node.data.varName ?? `var_${node.id}`;
        vars[varName] = node.data.varValue ?? 0;
      } else if (node.type === 'calculator' && typeof node.data.result === 'number') {
        vars[`calc_${node.id.replace('node-', '')}`] = node.data.result;
      }
    });
    
    return vars;
  }, [findConnectedNodes]);

  // Função para calcular resultado final
  const calculateFinalResult = useCallback((
    resultNode: Node,
    connectedVariables: Record<string, number>
  ): number => {
    // Se houver fórmula customizada, usar ela
    if (resultNode.data.formula && resultNode.data.formula.trim()) {
      try {
        let formula = resultNode.data.formula;
        Object.entries(connectedVariables).forEach(([key, value]) => {
          formula = formula.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        });
        const result = new Function(`return ${formula}`)();
        return typeof result === 'number' ? Math.round(result * 100) / 100 : 0;
      } catch {
        return 0;
      }
    }
    
    // Caso contrário, somar apenas as variáveis conectadas
    return Object.values(connectedVariables).reduce((a, b) => a + b, 0);
  }, []);

  // Função para atualizar todos os ResultNodes com base nas conexões
  const updateResultNodes = useCallback((currentNodes: Node[], currentEdges: Edge[]): Node[] => {
    return currentNodes.map(n => {
      if (n.type === 'result') {
        const connectedVars = extractConnectedVariables(n.id, currentNodes, currentEdges);
        const finalResult = calculateFinalResult(n, connectedVars);
        return { ...n, data: { ...n.data, variables: connectedVars, finalResult } };
      }
      return n;
    });
  }, [extractConnectedVariables, calculateFinalResult]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodeDataUpdates(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], ...newData }
    }));
    setNodes(nds => {
      const updatedNodes = nds.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, ...newData } }
          : n
      );
      
      // Atualizar nós de resultado com base nas conexões atuais
      return updateResultNodes(updatedNodes, edgesRef.current);
    });
  }, [updateResultNodes]);

  const createNodeWithCallbacks = useCallback((node: any) => {
    const baseData = { ...node.data };
    
    if (node.type === 'image') {
      baseData.onUpdateImage = (url: string) => updateNodeData(node.id, { imageUrl: url });
      baseData.onUpdateLabel = (label: string) => updateNodeData(node.id, { label });
    } else if (node.type === 'calculator') {
      baseData.onUpdateData = (calcData: any) => updateNodeData(node.id, calcData);
    } else if (node.type === 'variable') {
      baseData.onUpdateData = (varData: any) => updateNodeData(node.id, varData);
    } else if (node.type === 'product') {
      baseData.onUpdateData = (productData: any) => updateNodeData(node.id, productData);
    } else if (node.type === 'variant') {
      baseData.onUpdateData = (variantData: any) => updateNodeData(node.id, variantData);
    } else if (node.type === 'result') {
      baseData.onUpdateData = (resultData: any) => updateNodeData(node.id, resultData);
    }
    
    return { ...node, data: baseData };
  }, [updateNodeData]);

  const initialNodes: Node[] = diagram.nodes.length > 0 
    ? diagram.nodes.map(n => {
        const node = {
          ...n,
          type: n.type || 'default',
          style: n.type && n.type !== 'default' ? undefined : {
            ...nodeStyles,
            backgroundColor: n.data?.color ? `${n.data.color}20` : '#F3F4F6',
            borderColor: n.data?.color || '#6B7280',
            color: n.data?.color || '#374151',
          },
        };
        return createNodeWithCallbacks(node);
      })
    : [];

  // Função para atualizar label de um edge
  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges(eds => eds.map(e => 
      e.id === edgeId 
        ? { ...e, data: { ...e.data, label } }
        : e
    ));
  }, []);

  // Criar edges com callbacks
  const createEdgeWithCallbacks = useCallback((edge: Edge): Edge => {
    return {
      ...edge,
      type: 'custom',
      data: {
        ...edge.data,
        onLabelChange: (label: string) => updateEdgeLabel(edge.id, label),
      },
    };
  }, [updateEdgeLabel]);

  const initialEdges: Edge[] = diagram.edges.map(e => createEdgeWithCallbacks({
    ...e,
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 2 },
    data: { label: e.label || '' },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Manter referência atualizada dos edges
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Atualizar nós de resultado quando edges ou dados dos nodes mudam
  useEffect(() => {
    const hasResultNode = nodes.some(n => n.type === 'result');
    
    if (hasResultNode) {
      setNodes(nds => updateResultNodes(nds, edges));
    }
  }, [edges, nodes.filter(n => n.type !== 'result').map(n => JSON.stringify(n.data)).join(',')]);

  const nodeTypes = useMemo(() => ({
    image: ImageNode,
    calculator: CalculatorNode,
    variable: VariableNode,
    product: ProductNode,
    variant: VariantNode,
    result: ResultNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  const onConnect = useCallback(
    (params: Connection) => {
      const edgeId = `edge-${Date.now()}`;
      setEdges((eds) => {
        const newEdge = createEdgeWithCallbacks({
          id: edgeId,
          source: params.source!,
          target: params.target!,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'custom',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
          data: { label: '' },
        });
        
        const newEdges = [...eds, newEdge];
        // Atualizar referência imediatamente
        edgesRef.current = newEdges;
        
        // Atualizar ResultNodes após nova conexão
        setNodes(nds => updateResultNodes(nds, newEdges));
        
        return newEdges;
      });
    },
    [setEdges, setNodes, updateResultNodes, createEdgeWithCallbacks]
  );

  // Atualizar ResultNodes quando edges são removidos
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    // Após mudança nos edges, atualizar ResultNodes
    setTimeout(() => {
      setNodes(nds => updateResultNodes(nds, edgesRef.current));
    }, 0);
  }, [onEdgesChange, setNodes, updateResultNodes]);

  const addNode = (template: typeof NODE_TEMPLATES[0] | typeof SPECIAL_NODES[0]) => {
    const nodeId = `node-${Date.now()}`;
    const isSpecial = 'type' in template && template.type !== 'default';
    
    let newNode: Node;
    
    if (isSpecial && template.type === 'image') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'image',
        data: { 
          label: '',
          imageUrl: '',
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'product') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'product',
        data: { 
          label: 'Produto',
          productName: 'Novo Produto',
          productImage: '',
          value: 0,
          unit: 'R$',
          category: '',
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'calculator') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'calculator',
        data: { 
          label: 'Calculo',
          formula: '',
          variables: {},
          result: 0,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'variable') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'variable',
        data: { 
          label: 'Variavel',
          varName: 'var',
          varValue: 0,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'variant') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'variant',
        data: { 
          label: 'Variacao',
          variantId: '',
          productId: '',
          sku: 'SKU-NOVO',
          color: '',
          colorHex: '#6B7280',
          size: '',
          retail_price: 0,
          wholesale_price: 0,
          cost_price: 0,
          stock_quantity: 0,
          comments: [],
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'result') {
      const allVars = extractAllVariables(nodes);
      const finalResult = Object.values(allVars).reduce((a: number, b: number) => a + b, 0);
      
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'result',
        data: { 
          label: 'Resultado',
          title: 'Resultado Final',
          formula: '',
          variables: allVars,
          finalResult,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else {
      newNode = {
        id: nodeId,
        type: 'default',
        data: { 
          label: template.label === 'Personalizado' ? 'Novo No' : template.label,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
        style: {
          ...nodeStyles,
          backgroundColor: `${template.color}20`,
          borderColor: template.color,
          color: template.color,
        },
      };
    }
    
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const updateNodeLabel = () => {
    if (!selectedNode || !editingLabel.trim()) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, label: editingLabel } }
          : n
      )
    );
    setSelectedNode(null);
    setEditingLabel('');
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEditingLabel(node.data.label || '');
  };

  // Handlers para ResourcePanel
  const handleAddProductFromResource = useCallback((product: Product) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 };
    const newNode = createNodeWithCallbacks(generateProductNode(product, position, locale));
    setNodes((nds) => [...nds, newNode]);
    setShowResourcePanel(false);
  }, [createNodeWithCallbacks, locale]);

  const handleAddVariantFromResource = useCallback((product: Product, variant: ProductVariant) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 };
    const newNode = createNodeWithCallbacks(generateVariantNode(product, variant, position, locale));
    setNodes((nds) => [...nds, newNode]);
    setShowResourcePanel(false);
  }, [createNodeWithCallbacks, locale]);

  const handleAddCollectionFromResource = useCallback((collection: Collection, collectionProducts: Product[]) => {
    const { nodes: templateNodes, edges: templateEdges } = generateCollectionFlowTemplate(
      collection,
      collectionProducts,
      locale
    );
    
    const nodesWithCallbacks = templateNodes.map(n => createNodeWithCallbacks(n));
    const edgesWithCallbacks = templateEdges.map(e => createEdgeWithCallbacks(e));
    
    setNodes((nds) => [...nds, ...nodesWithCallbacks]);
    setEdges((eds) => [...eds, ...edgesWithCallbacks]);
    setShowResourcePanel(false);
  }, [createNodeWithCallbacks, createEdgeWithCallbacks, locale]);

  // Handler para aplicar template
  const handleApplyTemplate = useCallback((templateType: TemplateType) => {
    let templateData: { nodes: Node[]; edges: Edge[] };
    
    switch (templateType) {
      case 'cost':
        templateData = generateCostFlowTemplate();
        break;
      case 'revenue':
        templateData = generateRevenueFlowTemplate();
        break;
      case 'collection':
        templateData = { nodes: [], edges: [] };
        break;
      default:
        templateData = { nodes: [], edges: [] };
    }
    
    const nodesWithCallbacks = templateData.nodes.map(n => createNodeWithCallbacks(n));
    const edgesWithCallbacks = templateData.edges.map(e => createEdgeWithCallbacks(e));
    
    setNodes((nds) => [...nds, ...nodesWithCallbacks]);
    setEdges((eds) => [...eds, ...edgesWithCallbacks]);
    setShowTemplateSelector(false);
  }, [createNodeWithCallbacks, createEdgeWithCallbacks]);

  const handleSave = () => {
    const allVars = extractAllVariables(nodes);
    const resultNode = nodes.find(n => n.type === 'result');
    const finalResult = resultNode ? calculateFinalResult(resultNode, allVars) : 0;
    
    const cleanNodes = nodes.map(({ id, type, data, position }) => {
      const cleanData = { ...data };
      delete cleanData.onUpdateImage;
      delete cleanData.onUpdateLabel;
      delete cleanData.onUpdateData;
      return { id, type: type || 'default', data: cleanData, position };
    });
    
    // Salvar edges com labels e handles
    const cleanEdges = edges.map(({ id, source, target, sourceHandle, targetHandle, data }) => ({ 
      id, 
      source, 
      target,
      sourceHandle,
      targetHandle,
      label: data?.label || '',
    }));
    
    // Extrair produtos e variantes modificados
    const modifiedProducts: DiagramMetadata['modifiedProducts'] = [];
    const modifiedVariants: DiagramMetadata['modifiedVariants'] = [];
    
    nodes.forEach(node => {
      if (node.type === 'product' && node.data.productId) {
        modifiedProducts.push({
          productId: node.data.productId,
          productName: node.data.productName,
          changes: {
            value: node.data.value,
            category: node.data.category,
          },
        });
      }
      if (node.type === 'variant' && node.data.variantId && node.data.isModified) {
        modifiedVariants.push({
          variantId: node.data.variantId,
          productId: node.data.productId,
          changes: {
            retail_price: node.data.retail_price,
            wholesale_price: node.data.wholesale_price,
            cost_price: node.data.cost_price,
            stock_quantity: node.data.stock_quantity,
            sku: node.data.sku,
            color: node.data.color,
            colorHex: node.data.colorHex,
            size: node.data.size,
          },
        });
      }
    });
    
    // Metadados para IA futura
    const metadata: DiagramMetadata = {
      resultNodeId: resultNode?.id,
      totalVariables: allVars,
      finalResult,
      flowType: 'mixed',
      modifiedProducts: modifiedProducts.length > 0 ? modifiedProducts : undefined,
      modifiedVariants: modifiedVariants.length > 0 ? modifiedVariants : undefined,
    };
    
    onSave({ nodes: cleanNodes, edges: cleanEdges, metadata });
  };

  const isDefaultNode = selectedNode?.type === 'default' || !selectedNode?.type;

  // Calcular totais para exibição
  const totalVariables = extractAllVariables(nodes);
  const totalCount = Object.keys(totalVariables).length;
  const totalSum = Object.values(totalVariables).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 h-[85vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold">Editor de Diagrama</h2>
            {totalCount > 0 && (
              <p className="text-xs text-neutral-500">
                {totalCount} variáveis | Total: <span className="font-bold text-emerald-600">R$ {Number(totalSum).toFixed(2)}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 border-r border-neutral-100 p-4 overflow-y-auto">
            {/* Botões de acesso rápido */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowResourcePanel(!showResourcePanel)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  showResourcePanel
                    ? 'bg-cyan-500 text-white'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Base
              </button>
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  showTemplateSelector
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                Templates
              </button>
            </div>

            {/* Seletor de Templates */}
            {showTemplateSelector && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="text-xs font-bold text-purple-800 mb-2">Aplicar Template</h4>
                <div className="space-y-1.5">
                  {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyTemplate(key as TemplateType)}
                      className="w-full text-left px-3 py-2 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors"
                    >
                      <p className="text-xs font-medium text-neutral-800">{config.name}</p>
                      <p className="text-[10px] text-neutral-500">{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">
              Nos Especiais
            </h3>
            <div className="space-y-2 mb-6">
              {SPECIAL_NODES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => addNode(template)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-50 transition-colors text-left border border-neutral-100"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    <template.icon className="w-4 h-4" style={{ color: template.color }} />
                  </div>
                  <div>
                    <span className="text-sm font-medium block">{template.label}</span>
                    <span className="text-[10px] text-neutral-400">
                      {template.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">
              Nos de Processo
            </h3>
            <div className="space-y-1">
              {NODE_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => addNode(template)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors text-left"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: template.color }}
                  />
                  <span className="text-sm font-medium">{template.label}</span>
                </button>
              ))}
            </div>

            {selectedNode && isDefaultNode && (
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">
                  Editar No
                </h3>
                <input
                  type="text"
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-black"
                  onKeyDown={(e) => e.key === 'Enter' && updateNodeLabel()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={updateNodeLabel}
                    className="flex-1 px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={deleteSelectedNode}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {selectedNode && !isDefaultNode && (
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">
                  Acoes
                </h3>
                <button
                  onClick={deleteSelectedNode}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir No
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                Dicas
              </h3>
              <ul className="text-xs text-neutral-500 space-y-1">
                <li>• Arraste nos para mover</li>
                <li>• Conecte de qualquer lado do card</li>
                <li>• <strong>Duplo clique na linha</strong>: adicionar comentario</li>
                <li>• <strong>Produto</strong>: gera variavel automatica</li>
                <li>• <strong>Resultado</strong>: soma variaveis conectadas</li>
                <li>• Use o <strong>MiniMap</strong> para navegar</li>
              </ul>
            </div>
          </aside>

          {/* Resource Panel */}
          {showResourcePanel && (
            <aside className="w-72 border-r border-neutral-100 bg-neutral-50">
              <ResourcePanel
                locale={locale}
                onAddProduct={handleAddProductFromResource}
                onAddCollection={handleAddCollectionFromResource}
                onAddVariant={handleAddVariantFromResource}
              />
            </aside>
          )}

          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{
                type: 'custom',
                markerEnd: { type: MarkerType.ArrowClosed },
              }}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <MiniMap 
                nodeStrokeWidth={3}
                zoomable
                pannable
                className="!bg-neutral-100 !border !border-neutral-200 !rounded-xl !shadow-lg"
                maskColor="rgba(0, 0, 0, 0.1)"
                nodeColor={(node) => {
                  if (node.type === 'product') return '#06B6D4';
                  if (node.type === 'variant') return '#F59E0B';
                  if (node.type === 'result') return '#16A34A';
                  if (node.type === 'calculator') return '#22C55E';
                  if (node.type === 'variable') return '#A855F7';
                  if (node.type === 'image') return '#0EA5E9';
                  return node.data?.color || '#6B7280';
                }}
              />
            </ReactFlow>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Salvar Diagrama
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DiagramEditor;
