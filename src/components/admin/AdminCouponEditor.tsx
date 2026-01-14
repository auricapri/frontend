
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertTriangle, Calculator, Check, Search, Trash2, Loader2 } from 'lucide-react';
import { Coupon, Product, GlobalFinancialSettings } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';

interface AdminCouponEditorProps {
  coupon: Coupon;
  products: Product[];
  financials: GlobalFinancialSettings;
  onClose: () => void;
  onSave: (coupon: Coupon) => void;
  onDelete?: (id: string) => Promise<void> | void;
  locale: Locale;
}

const AdminCouponEditor: React.FC<AdminCouponEditorProps> = ({ 
  coupon: initialData, 
  products, 
  financials, 
  onClose, 
  onSave, 
  onDelete,
  locale 
}) => {
  const [data, setData] = useState<Coupon>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [simulation, setSimulation] = useState<{
    items: { 
        sku: string; 
        productName: string; 
        originalPrice: number; 
        finalPrice: number; 
        
        // Custos Detalhados
        costProduct: number; // CMV
        costTax: number;     // Impostos + Gateway
        costFixed: number;   // Fixo + Embalagem + Frete Médio
        totalCost: number;
        
        margin: number; 
        isLoss: boolean 
    }[];
    hasRisk: boolean;
  }>({ items: [], hasRisk: false });

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  // Filtrar produtos selecionados
  const selectedProducts = useMemo(() => {
    if (!data.product_ids || data.product_ids.length === 0) return [];
    return products.filter(p => data.product_ids?.includes(p.id));
  }, [data.product_ids, products]);

  // Função de Cálculo de Viabilidade (Margin Guard)
  const runSimulation = () => {
    if (!selectedProducts.length) {
        setSimulation({ items: [], hasRisk: false });
        return;
    }

    const itemsResults: any[] = [];
    let riskFound = false;

    // Custos Fixos Rateados (Ex: Aluguel / Vendas Esperadas)
    const totalFixedMonthly = financials.fixed_monthly + financials.infra_tech + financials.marketing_fixed + financials.das_mei;
    const fixedPerUnit = totalFixedMonthly / (financials.monthly_sales_vol || 1);

    selectedProducts.forEach(prod => {
        const variant = prod.variants?.[0];
        if (!variant) return;

        const originalPrice = variant.retail_price;
        let finalPrice = originalPrice;

        // Aplica o Desconto
        if (data.discount_type === 'percentage') {
            finalPrice = originalPrice * (1 - data.discount_value / 100);
        } else {
            finalPrice = Math.max(0, originalPrice - data.discount_value);
        }

        // 1. Custo da Mercadoria (CMV) - Se não tiver, estima 40% do preço original
        const costProduct = variant.cost_price || (originalPrice * 0.4); 
        
        // 2. Impostos e Taxas (Simples Nacional + Gateway Pagamento estim. 10%)
        // Em um cenário real, isso viria do PricingScenario, mas aqui usamos uma média segura.
        const taxRate = 0.10; 
        const costTax = finalPrice * taxRate;

        // 3. Custos Operacionais Unitários (Logística Reversa Media + Embalagem + Rateio Fixo)
        const costFixed = financials.packaging_cost + financials.avg_freight_cost + fixedPerUnit;

        const totalCost = costProduct + costTax + costFixed;
        const margin = finalPrice - totalCost;
        const isLoss = margin < 0;

        if (isLoss) riskFound = true;

        itemsResults.push({
            sku: variant.sku,
            productName: getLoc(prod.name),
            originalPrice,
            finalPrice,
            costProduct,
            costTax,
            costFixed,
            totalCost,
            margin,
            isLoss
        });
    });

    setSimulation({ items: itemsResults, hasRisk: riskFound });
  };

  useEffect(() => {
    runSimulation();
  }, [data.discount_value, data.discount_type, data.product_ids]);

  const canDelete = Boolean(onDelete && data.id);

  const toggleProduct = (id: string) => {
    const current = data.product_ids || [];
    if (current.includes(id)) {
        setData({ ...data, product_ids: current.filter(i => i !== id) });
    } else {
        setData({ ...data, product_ids: [...current, id] });
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        <header className="h-24 px-8 md:px-12 flex justify-between items-center border-b border-neutral-100 bg-white">
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-400">Ofertas & Promoções</span>
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Editor de Cupom</h2>
           </div>
           <button onClick={onClose} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
           
           {/* Left Col: Config */}
           <div className="w-full md:w-1/4 bg-neutral-50 p-8 md:p-10 border-r border-neutral-100 overflow-y-auto no-scrollbar space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Código do Cupom</label>
                 <input 
                   className="w-full p-6 bg-white border border-neutral-200 rounded-2xl text-2xl font-black font-mono uppercase outline-none focus:border-black"
                   value={data.code}
                   onChange={e => setData({...data, code: e.target.value.toUpperCase()})}
                   placeholder="SUMMER20"
                 />
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Tipo Desc.</label>
                    <select 
                      className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none"
                      value={data.discount_type}
                      onChange={e => setData({...data, discount_type: e.target.value as any})}
                    >
                       <option value="percentage">Porcentagem (%)</option>
                       <option value="fixed">Valor Fixo ($)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Valor do Desconto</label>
                    <input 
                      type="number"
                      className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none"
                      value={data.discount_value}
                      onChange={e => setData({...data, discount_value: Number(e.target.value)})}
                    />
                 </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-neutral-200">
                 <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Validade (Opcional)</label>
                 <input 
                   type="date"
                   className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-xs font-bold outline-none"
                   value={data.expires_at ? new Date(data.expires_at).toISOString().split('T')[0] : ''}
                   onChange={e => setData({...data, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                 />
              </div>

              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200">
                 <input 
                   type="checkbox" 
                   className="w-5 h-5 accent-black"
                   checked={data.is_active}
                   onChange={e => setData({...data, is_active: e.target.checked})}
                 />
                 <span className="text-xs font-bold uppercase tracking-widest">Cupom Ativo</span>
              </div>
           </div>

           {/* Right Col: Product Linking & Simulation */}
           <div className="flex-1 p-8 md:p-12 flex flex-col h-full overflow-hidden bg-white">
              
              {/* Product Selector */}
              <div className="mb-8">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Vincular Produtos (Necessário para Simulação)</h3>
                    <div className="relative w-64">
                       <input 
                         className="w-full py-2 pl-8 pr-4 bg-neutral-100 rounded-lg text-xs outline-none" 
                         placeholder="Buscar produtos..." 
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                       />
                       <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                 </div>
                 <div className="h-48 overflow-y-auto bg-neutral-50 border border-neutral-100 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-3 gap-2 no-scrollbar">
                    {products.filter(p => getLoc(p.name).toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                       <div 
                         key={p.id} 
                         onClick={() => toggleProduct(p.id)}
                         className={`p-3 rounded-xl flex flex-col justify-center gap-1 cursor-pointer transition-all border ${
                            (data.product_ids || []).includes(p.id) ? 'bg-black text-white border-black' : 'bg-white hover:bg-neutral-100 border-transparent'
                         }`}
                       >
                          <div className="flex items-center justify-between gap-2">
                             <span className="text-[10px] font-bold truncate flex-1">{getLoc(p.name)}</span>
                             {(data.product_ids || []).includes(p.id) && <Check className="w-3 h-3 flex-none" />}
                          </div>
                          <span className={`text-[9px] font-mono ${(data.product_ids || []).includes(p.id) ? 'text-white/60' : 'text-neutral-400'}`}>
                             {formatCurrency(p.variants?.[0]?.retail_price || 0, locale)}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Simulation Table */}
              <div className="flex-1 bg-neutral-900 text-white rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-3">
                          <Calculator className="w-5 h-5 text-neutral-400" />
                          <h4 className="text-sm font-black uppercase tracking-widest">Simulação de Margem Real</h4>
                       </div>
                       <p className="text-[9px] text-neutral-500 mt-1 pl-8">Custos Fixos Globais e Taxas incluídos no cálculo.</p>
                    </div>
                    {simulation.hasRisk ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-full border border-red-500/50 animate-pulse">
                           <AlertTriangle className="w-4 h-4" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Risco de Prejuízo</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full border border-green-500/50">
                           <Check className="w-4 h-4" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Margem Positiva</span>
                        </div>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto no-scrollbar">
                    {simulation.items.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-neutral-600 text-xs uppercase tracking-widest">
                          Selecione produtos acima para calcular o impacto.
                       </div>
                    ) : (
                       <table className="w-full text-left">
                          <thead className="text-[8px] text-neutral-500 font-black uppercase tracking-widest border-b border-white/10">
                             <tr>
                                <th className="pb-4 pl-4">Produto</th>
                                <th className="pb-4 text-right">Preço Original</th>
                                <th className="pb-4 text-right text-white">Preço c/ Desc.</th>
                                <th className="pb-4 text-right text-red-400">CMV (Custo)</th>
                                <th className="pb-4 text-right text-red-400">Taxas/Imp.</th>
                                <th className="pb-4 text-right text-red-400">Fixos/Log.</th>
                                <th className="pb-4 text-right pr-4">Margem Líq.</th>
                             </tr>
                          </thead>
                          <tbody className="text-[10px] font-medium divide-y divide-white/5">
                             {simulation.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                   <td className="py-3 pl-4">
                                      <div className="truncate max-w-[120px] font-bold">{item.productName}</div>
                                      <div className="text-[8px] text-neutral-600">{item.sku}</div>
                                   </td>
                                   <td className="py-3 text-right text-neutral-400 line-through">{formatCurrency(item.originalPrice, locale)}</td>
                                   <td className="py-3 text-right font-bold text-white text-xs">{formatCurrency(item.finalPrice, locale)}</td>
                                   <td className="py-3 text-right text-white/40">-{formatCurrency(item.costProduct, locale)}</td>
                                   <td className="py-3 text-right text-white/40">-{formatCurrency(item.costTax, locale)}</td>
                                   <td className="py-3 text-right text-white/40">-{formatCurrency(item.costFixed, locale)}</td>
                                   <td className={`py-3 text-right font-black pr-4 ${item.isLoss ? 'text-red-500' : 'text-green-500'}`}>
                                      {item.margin > 0 ? '+' : ''}{formatCurrency(item.margin, locale)}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    )}
                 </div>
              </div>

           </div>
        </div>

        <div className="h-24 px-12 border-t border-neutral-100 flex items-center justify-end gap-6 bg-white">
           <div className="flex-1">
              {simulation.hasRisk && (
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Atenção: Margem Negativa em alguns itens</p>
              )}
           </div>

           {canDelete && (
             <button
               onClick={async () => {
                 if (!data.id) return;
                 if (!confirm(`Tem certeza que deseja excluir o cupom "${data.code}"?`)) return;

                 try {
                   setIsDeleting(true);
                   await onDelete?.(data.id);
                 } catch (error: unknown) {
                   const message = error instanceof Error ? error.message : 'Erro ao excluir cupom';
                   alert(message);
                 } finally {
                   setIsDeleting(false);
                 }
               }}
               disabled={isDeleting}
               className="px-8 py-5 bg-white text-red-600 border border-red-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-50 transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-white flex items-center gap-3"
             >
               {isDeleting ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" /> Excluindo
                 </>
               ) : (
                 <>
                   <Trash2 className="w-4 h-4" /> Excluir
                 </>
               )}
             </button>
           )}

           <button 
             onClick={() => onSave(data)}
             disabled={simulation.hasRisk || !data.code}
             className="px-12 py-5 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
           >
              <Save className="w-4 h-4" /> {simulation.hasRisk ? 'Salvar Com Risco' : 'Salvar Oferta'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default AdminCouponEditor;
