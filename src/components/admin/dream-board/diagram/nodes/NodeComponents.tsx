import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { Upload, Package, Tag, Calculator, Variable, CheckCircle2, TrendingUp, Zap, MessageSquare, X, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { ProductNodeData, VariantNodeData, ResultNodeData, NodeComment } from '../types';
import { generateVarName } from '../hooks/useDiagramState';

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

export const ImageNode: React.FC<NodeProps> = ({ data, selected }) => {
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

export const ProductNode: React.FC<NodeProps<ProductNodeData>> = ({ data, selected }) => {
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
      <Handle type="target" position={Position.Top} id="top" className="!bg-cyan-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-cyan-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-cyan-500" />
      
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

export const VariantNode: React.FC<NodeProps<VariantNodeData>> = ({ data, selected }) => {
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

export const CalculatorNode: React.FC<NodeProps> = ({ data, selected }) => {
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

export const VariableNode: React.FC<NodeProps> = ({ data, selected }) => {
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

export const ResultNode: React.FC<NodeProps<ResultNodeData>> = ({ data, selected }) => {
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
      <Handle type="target" position={Position.Top} id="top" className="!bg-emerald-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-emerald-500" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-emerald-500" />
      
      <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 text-xs font-bold bg-transparent border-none focus:outline-none text-emerald-900"
        />
      </div>

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
