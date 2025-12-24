
import React, { useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Target,
  Scale,
  Calendar
} from 'lucide-react';
import { Product, GlobalFinancialSettings, Asset, Order } from '../types';
import { Locale } from '../i18n';
import { formatCurrency } from '../utils/currency';

interface AdminHealthProps {
  products: Product[];
  assets?: Asset[];
  orders: Order[];
  financials: GlobalFinancialSettings;
  locale: Locale;
}

const AdminHealth: React.FC<AdminHealthProps> = ({ products = [], assets = [], orders = [], financials, locale }) => {
  
  // 1. Safe Financials Accessor (Prevent NaN)
  const safeFinancials = useMemo(() => ({
      fixed_monthly: Number(financials?.fixed_monthly || 0),
      infra_tech: Number(financials?.infra_tech || 0),
      marketing_fixed: Number(financials?.marketing_fixed || 0),
      das_mei: Number(financials?.das_mei || 0),
      monthly_sales_vol: Number(financials?.monthly_sales_vol || 0),
      avg_freight_cost: Number(financials?.avg_freight_cost || 0),
      packaging_cost: Number(financials?.packaging_cost || 0)
  }), [financials]);

  // 2. Calculate Real Sales Metrics (Robust Logic from DB Orders)
  const salesMetrics = useMemo(() => {
      const now = new Date();
      
      // Filter valid orders
      const validOrders = orders.filter(o => o.status !== 'cancelled');
      
      const currentMonthOrders = validOrders.filter(o => {
          if (!o.created_at) return false;
          const d = new Date(o.created_at);
          return !isNaN(d.getTime()) && 
                 d.getMonth() === now.getMonth() && 
                 d.getFullYear() === now.getFullYear();
      });

      // Robust Sum: Use total_amount if available, else total
      const realizedRevenue = currentMonthOrders.reduce((acc, o: any) => {
          const val = Number(o.total || o.total_amount || 0);
          return acc + (isNaN(val) ? 0 : val);
      }, 0);
      
      const salesVolume = currentMonthOrders.length;
      
      // Calculate All-Time Avg Ticket
      const allTimeRevenue = validOrders.reduce((acc, o: any) => acc + Number(o.total || o.total_amount || 0), 0);
      const realAvgTicket = validOrders.length > 0 ? allTimeRevenue / validOrders.length : 0;

      return { realizedRevenue, salesVolume, realAvgTicket, currentMonthOrders };
  }, [orders]);

  // 3. Calculate Inventory Metrics
  const inventoryMetrics = useMemo(() => {
    let totalStock = 0;
    let totalRetailValue = 0;
    let immobilizedCapitalVariants = 0; 
    let activeSKUs = 0;

    products.forEach(p => {
      (p.variants || []).forEach(v => {
        if (v.is_active) {
          const qty = Number(v.stock_quantity) || 0;
          totalStock += qty;
          totalRetailValue += (Number(v.retail_price) || 0) * qty;
          
          const unitCost = Number(v.cost_price) || 0;
          immobilizedCapitalVariants += unitCost * qty;
          
          activeSKUs++;
        }
      });
    });

    let immobilizedCapitalAssets = 0;
    assets.forEach(a => {
        immobilizedCapitalAssets += ((Number(a.stock_quantity) || 0) * (Number(a.cost_price) || 0));
    });

    return { 
      totalStock, 
      totalRetailValue, 
      immobilizedCapital: immobilizedCapitalVariants + immobilizedCapitalAssets,
      activeSKUs,
      breakdown: { variants: immobilizedCapitalVariants, assets: immobilizedCapitalAssets },
      theoreticalAvgTicket: totalStock > 0 ? totalRetailValue / totalStock : 0
    };
  }, [products, assets]);

  // 4. Financial Projections & Health Logic
  const totalFixedCosts = 
    safeFinancials.fixed_monthly + 
    safeFinancials.infra_tech + 
    safeFinancials.marketing_fixed + 
    safeFinancials.das_mei;

  // Use Real Ticket if available, otherwise theoretical from inventory
  const avgTicket = salesMetrics.realAvgTicket > 0 
      ? salesMetrics.realAvgTicket 
      : (inventoryMetrics.theoreticalAvgTicket || 0);

  // Estimate Product Cost (CMV) based on Inventory Avg or fallback 40%
  const avgProductCost = inventoryMetrics.totalStock > 0 
    ? inventoryMetrics.immobilizedCapital / inventoryMetrics.totalStock 
    : avgTicket * 0.4;

  // Variable Cost Structure
  const taxRate = 0.10; // Est. 10% Taxes
  const variableCostPerUnit = 
    avgProductCost + 
    safeFinancials.avg_freight_cost + 
    safeFinancials.packaging_cost +
    (avgTicket * taxRate);

  const contributionMargin = avgTicket - variableCostPerUnit;
  const breakevenUnits = contributionMargin > 0 ? Math.ceil(totalFixedCosts / contributionMargin) : 0;

  // Projections (Meta)
  const projectedRevenue = safeFinancials.monthly_sales_vol * avgTicket;
  const projectedVariableCosts = safeFinancials.monthly_sales_vol * variableCostPerUnit;
  const projectedNetResult = projectedRevenue - totalFixedCosts - projectedVariableCosts;
  const profitMargin = projectedRevenue > 0 ? (projectedNetResult / projectedRevenue) * 100 : 0;

  // Realized Analysis (Current Month)
  const realizedVariableCosts = salesMetrics.salesVolume * variableCostPerUnit;
  const realizedNetResult = salesMetrics.realizedRevenue - totalFixedCosts - realizedVariableCosts;

  const healthStatus = projectedNetResult > 0 ? 'healthy' : 'critical';
  
  // Helper safe format
  const safeFormat = (val: number) => formatCurrency(isNaN(val) ? 0 : val, locale);

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      
      {/* HEADER SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Activity className="w-8 h-8" /> Saúde Financeira
          </h2>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Dados Reais do Banco de Dados & Projeções de Meta
          </p>
        </div>
        
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between gap-6 ${healthStatus === 'healthy' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status Projetado</span>
              <span className="text-xl font-black uppercase tracking-tighter">{healthStatus === 'healthy' ? 'Lucrativa' : 'Prejuízo Previsto'}</span>
           </div>
           {healthStatus === 'healthy' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
        </div>
      </div>

      {/* REALIZED vs TARGET ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Realized (Mês Atual) */}
          <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                      <span className="p-3 bg-white/20 rounded-xl"><Calendar className="w-5 h-5" /></span>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Mês Atual</span>
                  </div>
                  <h3 className="text-4xl font-light tracking-tighter mb-2">{safeFormat(salesMetrics.realizedRevenue)}</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">
                      {salesMetrics.salesVolume} Vendas Realizadas
                  </p>
              </div>
              {/* Progress Bar */}
              <div className="mt-6">
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-2 opacity-60">
                      <span>Progresso da Meta</span>
                      <span>{safeFinancials.monthly_sales_vol > 0 ? Math.round((salesMetrics.salesVolume / safeFinancials.monthly_sales_vol) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400 transition-all duration-1000" style={{ width: `${safeFinancials.monthly_sales_vol > 0 ? Math.min(100, (salesMetrics.salesVolume / safeFinancials.monthly_sales_vol) * 100) : 0}%` }} />
                  </div>
              </div>
          </div>

          {/* Card 2: Target (Meta Mensal) */}
          <div className="bg-white border border-neutral-100 p-8 rounded-[2.5rem] flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                  <span className="p-3 bg-neutral-100 rounded-xl"><Target className="w-5 h-5" /></span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Meta Mensal</span>
              </div>
              <h3 className="text-4xl font-light tracking-tighter mb-2 text-neutral-900">{safeFormat(projectedRevenue)}</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                  Baseado em {safeFinancials.monthly_sales_vol} vendas
              </p>
          </div>

          {/* Card 3: Ticket Médio */}
          <div className="bg-neutral-50 border border-neutral-100 p-8 rounded-[2.5rem] flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                  <span className="p-3 bg-white rounded-xl shadow-sm"><DollarSign className="w-5 h-5" /></span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Ticket Médio Real</span>
              </div>
              <h3 className="text-4xl font-light tracking-tighter mb-2 text-neutral-900">{safeFormat(avgTicket)}</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
                  {salesMetrics.realAvgTicket > 0 ? 'Baseado no Histórico de Vendas' : 'Baseado no Estoque (Estimado)'}
              </p>
          </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Fixed Costs */}
         <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
               <span className="p-3 bg-white rounded-xl shadow-sm"><Scale className="w-5 h-5" /></span>
               <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Custo Fixo Mensal</span>
            </div>
            <div>
               <h3 className="text-3xl font-light tracking-tighter mb-1 text-red-500">-{safeFormat(totalFixedCosts)}</h3>
               <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Burn Rate / Mês</p>
            </div>
         </div>

         {/* Breakeven */}
         <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
               <span className="p-3 bg-white rounded-xl shadow-sm"><Target className="w-5 h-5" /></span>
               <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Ponto de Equilíbrio</span>
            </div>
            <div>
               <h3 className="text-3xl font-light tracking-tighter mb-1">{isNaN(breakevenUnits) ? 0 : breakevenUnits} <span className="text-lg text-neutral-300">un.</span></h3>
               <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Necessário para pagar custos</p>
            </div>
         </div>

         {/* Capital Imobilizado */}
         <div className="bg-white border-2 border-dashed border-neutral-200 p-8 rounded-[2.5rem] flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
               <span className="p-3 bg-neutral-50 rounded-xl"><Package className="w-5 h-5" /></span>
               <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Capital Imobilizado</span>
            </div>
            <div>
               <h3 className="text-3xl font-light tracking-tighter mb-1">{safeFormat(inventoryMetrics.immobilizedCapital)}</h3>
               <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                 Prod: {safeFormat(inventoryMetrics.breakdown.variants)} + Ativos: {safeFormat(inventoryMetrics.breakdown.assets)}
               </p>
            </div>
         </div>
      </div>

      {/* DETAILED PROJECTION (DRE - Layout Original) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-black uppercase italic tracking-tighter">Demonstrativo Projetado (Meta)</h4>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-neutral-100 px-3 py-1 rounded-full text-neutral-500">Baseado na Meta de {safeFinancials.monthly_sales_vol} un.</span>
            </div>
            
            <div className="space-y-6">
               {/* Revenue */}
               <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest">Receita Bruta Projetada</span>
                  </div>
                  <span className="text-xl font-medium tracking-tighter text-green-600">
                     + {safeFormat(projectedRevenue)}
                  </span>
               </div>

               {/* Variable Costs (Detailed) */}
               <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-400">(-) Custos Variáveis</span>
                     <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">
                        CMV + Impostos ({(taxRate * 100).toFixed(0)}%) + Frete Médio
                     </span>
                  </div>
                  <span className="text-xl font-medium tracking-tighter text-red-400">
                     - {safeFormat(projectedVariableCosts)}
                  </span>
               </div>

               {/* Fixed Costs */}
               <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-400">(-) Custos Fixos</span>
                     <span className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">Operação Mensal</span>
                  </div>
                  <span className="text-xl font-medium tracking-tighter text-red-400">
                     - {safeFormat(totalFixedCosts)}
                  </span>
               </div>

               {/* Net Result */}
               <div className={`flex justify-between items-center p-6 rounded-2xl ${projectedNetResult > 0 ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black uppercase tracking-widest">Lucro Líquido Projetado</span>
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Margem: {isNaN(profitMargin) ? 0 : profitMargin.toFixed(1)}%</span>
                  </div>
                  <span className="text-3xl font-bold tracking-tighter">
                     {safeFormat(projectedNetResult)}
                  </span>
               </div>
            </div>
         </div>

         {/* Real Analysis Sidebar */}
         <div className="space-y-6">
            <div className="bg-neutral-900 text-white p-8 rounded-[2.5rem] shadow-xl">
               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-white/60">Análise Real (YTD)</h5>
               
               <div className="space-y-6">
                  {realizedNetResult < 0 && (
                     <div className="flex gap-4 items-start">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-none" />
                        <div>
                           <p className="text-xs font-bold leading-relaxed mb-1">Mês no Vermelho</p>
                           <p className="text-[10px] text-white/60 leading-relaxed">
                              Resultado parcial atual: {safeFormat(realizedNetResult)}. Faltam {Math.max(0, breakevenUnits - salesMetrics.salesVolume)} vendas para o ponto de equilíbrio.
                           </p>
                        </div>
                     </div>
                  )}

                  {salesMetrics.realAvgTicket > 0 && salesMetrics.realAvgTicket < (totalFixedCosts / (safeFinancials.monthly_sales_vol || 1)) && (
                     <div className="flex gap-4 items-start">
                        <TrendingDown className="w-5 h-5 text-yellow-400 flex-none" />
                        <div>
                           <p className="text-xs font-bold leading-relaxed mb-1">Ticket Médio Baixo</p>
                           <p className="text-[10px] text-white/60 leading-relaxed">
                              Seu ticket real ({safeFormat(salesMetrics.realAvgTicket)}) pode não cobrir os custos fixos mesmo batendo a meta de volume.
                           </p>
                        </div>
                     </div>
                  )}
                  
                  {salesMetrics.salesVolume > 0 && realizedNetResult > 0 && (
                      <div className="flex gap-4 items-start">
                        <Activity className="w-5 h-5 text-green-400 flex-none" />
                        <div>
                           <p className="text-xs font-bold leading-relaxed mb-1">Operação Saudável</p>
                           <p className="text-[10px] text-white/60 leading-relaxed">
                              Você está operando com lucro neste momento. Continue monitorando o CAC e o CMV.
                           </p>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminHealth;
