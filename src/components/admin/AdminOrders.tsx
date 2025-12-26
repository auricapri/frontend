
import React, { useMemo, useState } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ArrowRight,
  XCircle,
  Calendar,
  DollarSign,
  Info,
  TrendingUp,
  X,
  CreditCard,
  User,
  AlertTriangle,
  Receipt,
  Scale,
  Landmark,
  Wallet,
  FileText,
  Printer,
  Box,
  Barcode,
  Lock,
  Download,
  AlertOctagon,
  Ban,
  Loader2
} from 'lucide-react';
import { Order, OrderItem, Product, Asset } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { OrdersApi } from '../../api/orders.api';

interface AdminOrdersProps {
  orders: Order[];
  products?: Product[];
  assets?: Asset[];
  onUpdateStatus: (orderId: string, newStatus: 'confirmed' | 'shipped' | 'delivered' | 'cancelled', trackingCode?: string) => void;
  locale: Locale;
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, products = [], assets = [], onUpdateStatus, locale }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isGeneratingPLP, setIsGeneratingPLP] = useState(false);
  
  // Local state to simulate "Document Generation" within the session
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, boolean>>({});
  
  const ordersApi = new OrdersApi();

  // --- SLA HELPER ---
  const getSLAStatus = (order: Order) => {
      const daysEst = order.internal_logistics?.estimated_days || 5;
      const created = new Date(order.created_at);
      const deadline = new Date(created);
      deadline.setDate(deadline.getDate() + daysEst);
      
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) return { color: 'bg-red-50 border-red-200 text-red-800', priority: 3, label: 'CRÍTICO' };
      if (diffDays <= 2) return { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', priority: 2, label: 'ATENÇÃO' };
      return { color: 'bg-white border-neutral-100 hover:border-blue-200', priority: 1, label: 'NORMAL' };
  };

  // --- SEPARATION & SORTING ---
  const { incoming, expedition, transit, history } = useMemo(() => {
    // 1. Incoming: Pending Approval
    const inc = orders.filter(o => o.status === 'pending');
    
    // 2. Expedition: Confirmed, waiting for docs/shipping
    const exp = orders.filter(o => o.status === 'confirmed');

    // 3. Transit: Shipped, needs SLA sorting
    const tr = orders.filter(o => o.status === 'shipped').sort((a, b) => {
        const slaA = getSLAStatus(a);
        const slaB = getSLAStatus(b);
        // Sort by Priority (High to Low), then by Date (Oldest first)
        if (slaA.priority !== slaB.priority) return slaB.priority - slaA.priority;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // 4. History
    const hist = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
                       .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { incoming: inc, expedition: exp, transit: tr, history: hist };
  }, [orders]);

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // --- LOGISTICS CALCULATION ---
  const calculateLogisticsMetrics = (order: Order) => {
      let totalWeight = 0;
      let maxLen = 0, maxWid = 0, totalHeight = 0;

      order.items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          const rawId = item.variant_id || item.id;
          const variantId = rawId ? rawId.split('_')[0] : null;
          const variant = product?.variants?.find(v => v.id === variantId) || product?.variants?.[0];

          if (variant) {
              totalWeight += (variant.weight_g || 0) * item.quantity;
              if (variant.correlated_assets) {
                  variant.correlated_assets.forEach(link => {
                      const asset = assets.find(a => a.id === link.asset_id);
                      if (asset) totalWeight += (asset.weight_g || 0) * link.quantity_required * item.quantity;
                  });
              }
              if (variant.dimensions) {
                  maxLen = Math.max(maxLen, variant.dimensions.length);
                  maxWid = Math.max(maxWid, variant.dimensions.width);
                  totalHeight += variant.dimensions.height * item.quantity;
              }
          }
      });

      if (totalWeight === 0) totalWeight = 500; 
      if (maxLen === 0) maxLen = 20;
      if (maxWid === 0) maxWid = 15;
      if (totalHeight === 0) totalHeight = 10;

      return {
          totalWeight,
          dimensions: `${Math.round(maxLen)}x${Math.round(maxWid)}x${Math.round(totalHeight)}`
      };
  };

  // --- FINANCIAL CALCULATION ---
  const calculateOrderEconomics = (order: Order) => {
      const revenue = order.total;
      let cogs = 0;
      order.items.forEach(item => {
          const product = products.find(p => p.id === item.product_id);
          const rawId = item.variant_id || item.id;
          const variantId = rawId ? rawId.split('_')[0] : null;
          const variant = product?.variants?.find(v => v.id === variantId) || product?.variants?.[0]; 
          
          if (variant) {
              const unitCost = variant.cost_price || (item.price * 0.4); 
              let assetCost = 0;
              if (variant.correlated_assets) {
                  variant.correlated_assets.forEach(l => {
                      const ast = assets.find(a => a.id === l.asset_id);
                      if (ast) assetCost += ast.cost_price * l.quantity_required;
                  });
              }
              cogs += (unitCost + assetCost) * item.quantity;
          } else {
              cogs += (item.price * 0.4) * item.quantity;
          }
      });

      const freightReal = order.internal_logistics?.real_cost || 0;
      const gatewayRate = 0.0399;
      const gatewayFixed = 0.50;
      const gatewayFee = (revenue * gatewayRate) + gatewayFixed;
      const taxRate = 0.06; 
      const taxFee = revenue * taxRate;
      const variableCosts = freightReal + gatewayFee + taxFee;
      const netProfit = revenue - cogs - variableCosts;
      const margin = (netProfit / revenue) * 100;

      return { revenue, cogs, freightReal, gatewayFee, taxFee, variableCosts, netProfit, margin, gatewayRate, taxRate };
  };

  const handleGenerateDoc = async () => {
      if (!selectedOrder) return;
      
      setIsGeneratingPLP(true);
      try {
          await ordersApi.downloadPLPPDF(selectedOrder.id);
          setGeneratedDocs(prev => ({ ...prev, [selectedOrder.id]: true }));
      } catch (error: any) {
          console.error('Error generating PLP:', error);
          alert('Erro ao gerar PLP. Tente novamente.');
      } finally {
          setIsGeneratingPLP(false);
      }
  };

  const handleDispatch = () => {
      if (!selectedOrder) return;
      const hasDoc = selectedOrder.logistics_metadata?.doc_url || generatedDocs[selectedOrder.id];
      
      if (!hasDoc) {
          alert("REGRA DE NEGÓCIO: É obrigatório gerar o Documento de Postagem (PLP) antes de enviar.");
          return;
      }
      if (!trackingInput.trim()) {
          alert("REGRA DE NEGÓCIO: Código de rastreio obrigatório para confirmar envio.");
          return;
      }
      onUpdateStatus(selectedOrder.id, 'shipped', trackingInput);
      setSelectedOrder(null);
      setTrackingInput('');
  };

  const handleApproveOrder = () => {
      if (!selectedOrder) return;
      onUpdateStatus(selectedOrder.id, 'confirmed');
      setSelectedOrder(null);
  };

  const handleRejectOrder = () => {
      if (!selectedOrder) return;
      if (confirm("ATENÇÃO: Rejeitar este pedido iniciará o fluxo de reembolso para o cliente. Confirmar rejeição?")) {
          onUpdateStatus(selectedOrder.id, 'cancelled');
          setSelectedOrder(null);
      }
  };

  const economics = selectedOrder ? calculateOrderEconomics(selectedOrder) : null;
  const address = (selectedOrder as any)?.shipping_address_snapshot || (selectedOrder as any)?.shipping_address;
  const logistics = selectedOrder ? calculateLogisticsMetrics(selectedOrder) : { totalWeight: 0, dimensions: '' };
  const isDocGenerated = selectedOrder ? (!!selectedOrder.logistics_metadata?.doc_url || !!generatedDocs[selectedOrder.id]) : false;

  return (
    <div className="h-full flex flex-col space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Logística & Expedição</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Gestão de Pedidos e Etiquetas</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
              <span className="text-xl font-black">{incoming.length}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Novos</span>
           </div>
           <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
              <span className="text-xl font-black">{expedition.length}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Preparar</span>
           </div>
           <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
              <span className="text-xl font-black">{transit.length}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Trânsito</span>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-[1300px]">
          
          {/* COLUNA 1: APROVAÇÃO (NOVOS) */}
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-neutral-100 p-2 shadow-sm">
             <header className="flex items-center justify-between mb-4 p-6 pb-2">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-neutral-100 text-neutral-700 rounded-xl"><AlertOctagon className="w-4 h-4" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Aprovação</h4>
                </div>
                <span className="text-[9px] font-bold text-neutral-300 uppercase">{incoming.length}</span>
             </header>
             
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 pb-2">
                {incoming.map(order => (
                   <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100 hover:border-black transition-all cursor-pointer group hover:shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-sm">
                                {order.items[0]?.name['pt']?.[0] || '#'}
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 block">#{order.id.slice(0,6).toUpperCase()}</span>
                                <span className="text-[8px] font-bold text-neutral-400 uppercase">{formatCurrency(order.total, locale)}</span>
                            </div>
                         </div>
                         <span className="text-[9px] font-bold text-neutral-300">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'confirmed'); }} className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all">Aprovar</button>
                          <button onClick={(e) => { e.stopPropagation(); if(confirm('Rejeitar e Reembolsar?')) onUpdateStatus(order.id, 'cancelled'); }} className="flex-1 py-2 bg-red-100 text-red-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-200 transition-all">Rejeitar</button>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* COLUNA 2: EXPEDIÇÃO (DOCUMENTAÇÃO) */}
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-neutral-100 p-2 shadow-sm">
             <header className="flex items-center justify-between mb-4 p-6 pb-2">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><Package className="w-4 h-4" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Expedição</h4>
                </div>
                <span className="text-[9px] font-bold text-neutral-300 uppercase">{expedition.length}</span>
             </header>
             
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 pb-2">
                {expedition.map(order => {
                   const hasDoc = order.logistics_metadata?.doc_url || generatedDocs[order.id];
                   return (
                   <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer group hover:shadow-lg ${hasDoc ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-100 hover:border-black'}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 block">#{order.id.slice(0,6).toUpperCase()}</span>
                            <span className="text-[8px] font-bold text-neutral-400 uppercase">{order.items.length} Itens</span>
                         </div>
                         {hasDoc && <FileText className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/5">
                         <span className="text-xs font-black">{formatCurrency(order.total, locale)}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full group-hover:scale-105 transition-transform">{hasDoc ? 'Enviar' : 'Gerar Doc'}</span>
                      </div>
                   </div>
                )})}
             </div>
          </div>

          {/* COLUNA 3: EM TRÂNSITO (SLA MONITOR) */}
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-neutral-100 p-2 shadow-sm">
             <header className="flex items-center justify-between mb-4 p-6 pb-2">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-yellow-100 text-yellow-700 rounded-xl"><Truck className="w-4 h-4" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Em Trânsito</h4>
                </div>
                <span className="text-[9px] font-bold text-neutral-300 uppercase">{transit.length}</span>
             </header>

             <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 pb-2">
                {transit.map(order => {
                   const sla = getSLAStatus(order);
                   return (
                   <div key={order.id} onClick={() => setSelectedOrder(order)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer group hover:shadow-lg ${sla.color}`}>
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-900 block mb-1">#{order.id.slice(0,6)}</span>
                            {sla.priority > 1 && (
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${sla.priority === 3 ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                    {sla.label}
                                </span>
                            )}
                         </div>
                         <span className="text-[9px] font-bold text-neutral-400">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="text-[10px] font-mono bg-white/50 p-2 rounded mb-2 border border-black/5 text-center">
                          {order.tracking_code}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'delivered'); }}
                        className="w-full mt-1 bg-white border border-green-200 text-green-600 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                      >
                         <CheckCircle2 className="w-3 h-3" /> Marcar Entregue
                      </button>
                   </div>
                )})}
             </div>
          </div>

          {/* COLUNA 4: HISTÓRICO */}
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-neutral-100 p-2 shadow-sm opacity-80">
             <header className="flex items-center justify-between mb-4 p-6 pb-2">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-green-100 text-green-700 rounded-xl"><CheckCircle2 className="w-4 h-4" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Histórico</h4>
                </div>
             </header>

             <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 pb-2">
                {history.map(order => (
                   <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-neutral-50 p-5 rounded-[2rem] border border-neutral-100 hover:bg-white transition-all cursor-pointer">
                      <div className="flex justify-between items-center mb-2">
                         <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                         </span>
                         <span className="text-[9px] font-bold text-neutral-300">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-mono text-neutral-400">#{order.id.slice(0,6)}</span>
                         <span className="text-xs font-bold text-neutral-900">{formatCurrency(order.total, locale)}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* DETAILED ORDER MODAL */}
      {selectedOrder && economics && (
        <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              
              <header className="h-24 px-8 md:px-12 flex items-center justify-between border-b border-neutral-100 bg-white flex-none">
                 <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-full ${selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                        {selectedOrder.status === 'pending' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                            Pedido #{selectedOrder.id.slice(0, 8).toUpperCase()}
                            <span className="text-[9px] px-3 py-1 bg-neutral-100 rounded-full font-bold text-neutral-500 uppercase tracking-widest">
                                {selectedOrder.status}
                            </span>
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{formatDate(selectedOrder.created_at)} • {selectedOrder.items.length} Itens</p>
                    </div>
                 </div>
                 <button onClick={() => { setSelectedOrder(null); setTrackingInput(''); }} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"><X className="w-5 h-5" /></button>
              </header>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  
                  {/* LEFT COL: Operational */}
                  <div className="w-full md:w-[60%] p-8 md:p-12 overflow-y-auto no-scrollbar space-y-10 bg-neutral-50/30">
                      
                      {/* --- CONFIRMATION STAGE (Pending) --- */}
                      {selectedOrder.status === 'pending' && (
                          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-xl space-y-6">
                              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> Ação Necessária</h5>
                              <p className="text-sm font-medium text-neutral-600">Este pedido aguarda confirmação de estoque e pagamento. Aprovar moverá para expedição.</p>
                              <div className="grid grid-cols-2 gap-4">
                                  <button onClick={handleApproveOrder} className="py-4 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg">Confirmar Pedido</button>
                                  <button onClick={handleRejectOrder} className="py-4 bg-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all">Rejeitar & Reembolsar</button>
                              </div>
                          </div>
                      )}

                      {/* --- EXPEDITION STAGE (Confirmed) --- */}
                      {selectedOrder.status === 'confirmed' && (
                          <div className="space-y-6">
                              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2"><Truck className="w-3 h-3" /> Fluxo de Expedição</h5>
                              
                              {/* STEP 1: Generate Document */}
                              <div className={`p-6 rounded-[2.5rem] border transition-all ${isDocGenerated ? 'bg-green-50 border-green-200' : 'bg-white border-neutral-200 shadow-xl'}`}>
                                  <div className="flex justify-between items-center mb-4">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isDocGenerated ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>1</div>
                                          <span className="text-[10px] font-black uppercase tracking-widest">Documento de Postagem (PLP)</span>
                                      </div>
                                      {isDocGenerated && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                  </div>
                                  
                                  {!isDocGenerated ? (
                                      <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4 text-[10px] bg-neutral-50 p-4 rounded-xl">
                                              <div><span className="text-neutral-400 block">Peso Calc.</span><span className="font-bold">{logistics.totalWeight}g</span></div>
                                              <div><span className="text-neutral-400 block">Dimensões Est.</span><span className="font-bold">{logistics.dimensions} cm</span></div>
                                              <div><span className="text-neutral-400 block">Transportadora</span><span className="font-bold">{selectedOrder.internal_logistics?.selected_carrier}</span></div>
                                              <div><span className="text-neutral-400 block">Prazo Cliente</span><span className="font-bold">{selectedOrder.internal_logistics?.display_days_was} dias</span></div>
                                              <div><span className="text-neutral-400 block">Prazo Real</span><span className="font-bold text-blue-600">{selectedOrder.internal_logistics?.estimated_days} dias</span></div>
                                          </div>
                                          <button 
                                              onClick={handleGenerateDoc} 
                                              disabled={isGeneratingPLP}
                                              className="w-full py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                                          >
                                              <Printer className="w-4 h-4" /> Gerar & Baixar PDF
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex gap-4 items-center">
                                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-dashed border-neutral-300"><Barcode className="w-6 h-6 text-neutral-400" /></div>
                                          <div>
                                              <p className="text-[10px] font-bold text-green-700">Documento Anexado</p>
                                              <button 
                                                  onClick={handleGenerateDoc} 
                                                  disabled={isGeneratingPLP}
                                                  className="text-[9px] underline disabled:opacity-50"
                                              >
                                                  {isGeneratingPLP ? 'Gerando...' : 'Baixar novamente'}
                                              </button>
                                          </div>
                                      </div>
                                  )}
                              </div>

                              {/* STEP 2: Input Tracking & Dispatch */}
                              <div className={`p-6 rounded-[2.5rem] border transition-all ${!isDocGenerated ? 'opacity-50 grayscale pointer-events-none bg-neutral-50 border-neutral-100' : 'bg-white border-neutral-200 shadow-xl'}`}>
                                  <div className="flex justify-between items-center mb-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-500">2</div>
                                          <span className="text-[10px] font-black uppercase tracking-widest">Rastreio & Envio</span>
                                      </div>
                                      {!isDocGenerated && <Lock className="w-4 h-4 text-neutral-300" />}
                                  </div>

                                  <div className="space-y-4">
                                      <div className="flex gap-4">
                                          <input 
                                              className="flex-1 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl font-mono text-sm font-bold uppercase outline-none focus:border-black transition-all"
                                              placeholder="CÓDIGO RASTREIO"
                                              value={trackingInput}
                                              onChange={e => setTrackingInput(e.target.value.toUpperCase())}
                                              disabled={!isDocGenerated}
                                          />
                                          <button 
                                            onClick={handleDispatch}
                                            disabled={!isDocGenerated || !trackingInput} 
                                            className="px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                          >
                                              Marcar Enviado
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* --- SHIPPED/DELIVERED STATE --- */}
                      {(selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered') && (
                          <div className="bg-green-50 border border-green-100 p-8 rounded-[2.5rem] flex items-center justify-center flex-col text-green-800">
                              <Truck className="w-12 h-12 mb-4" />
                              <h3 className="text-xl font-black uppercase tracking-tighter">Pedido em Rota</h3>
                              <p className="text-[10px] font-bold uppercase tracking-widest mt-2 bg-white px-4 py-2 rounded-lg shadow-sm mb-4">{selectedOrder.tracking_code}</p>
                              <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest opacity-60">
                                  <span>Prazo Cliente: {selectedOrder.internal_logistics?.display_days_was}d</span>
                                  <span>Prazo Real: {selectedOrder.internal_logistics?.estimated_days}d</span>
                              </div>
                          </div>
                      )}

                      <div className="space-y-4 pt-6 border-t border-neutral-200/50">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4 flex items-center gap-2"><Package className="w-3 h-3" /> Itens do Pedido</h5>
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex gap-6 p-4 bg-white rounded-3xl border border-neutral-100 shadow-sm">
                                <img src={item.image} className="w-16 h-20 object-cover rounded-xl bg-neutral-100" />
                                <div className="flex-1">
                                    <h6 className="text-[11px] font-black uppercase tracking-tight">{getLoc(item.name)}</h6>
                                    <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest mt-1">{getLoc(item.color_name)} | {item.size}</p>
                                    <div className="mt-2 flex gap-4 text-[10px]">
                                        <span className="font-bold">Qtd: {item.quantity}</span>
                                        <span className="text-neutral-400">Unit: {formatCurrency(item.price, locale)}</span>
                                    </div>
                                </div>
                            </div>
                          ))}
                      </div>
                  </div>

                  {/* RIGHT COL: Financials (DRE) */}
                  <div className="w-full md:w-[40%] bg-white border-l border-neutral-100 flex flex-col">
                      <div className="p-10 border-b border-neutral-100">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
                              <Receipt className="w-4 h-4" /> Extrato Financeiro
                          </h5>

                          <div className="space-y-6">
                              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                                  <span className="text-[11px] font-black uppercase tracking-widest">Valor Pago</span>
                                  <span className="text-xl font-medium tracking-tighter text-neutral-900">{formatCurrency(economics.revenue, locale)}</span>
                              </div>
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center text-red-500">
                                      <div className="flex items-center gap-2">
                                          <CreditCard className="w-3 h-3" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest">Gateway</span>
                                      </div>
                                      <span className="text-xs font-mono font-medium">-{formatCurrency(economics.gatewayFee, locale)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-red-500">
                                      <div className="flex items-center gap-2">
                                          <Landmark className="w-3 h-3" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest">Impostos</span>
                                      </div>
                                      <span className="text-xs font-mono font-medium">-{formatCurrency(economics.taxFee, locale)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-red-500">
                                      <div className="flex items-center gap-2">
                                          <Truck className="w-3 h-3" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest">Frete Real</span>
                                      </div>
                                      <span className="text-xs font-mono font-medium">-{formatCurrency(economics.freightReal, locale)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-red-400 opacity-80">
                                      <div className="flex items-center gap-2">
                                          <Package className="w-3 h-3" />
                                          <span className="text-[10px] font-bold uppercase tracking-widest">CMV</span>
                                      </div>
                                      <span className="text-xs font-mono font-medium">-{formatCurrency(economics.cogs, locale)}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="flex-1 p-10 bg-neutral-50 flex flex-col justify-center">
                          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-lg text-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 block mb-2">Lucro Líquido Real</span>
                              <span className={`text-4xl font-bold tracking-tighter block mb-2 ${economics.netProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {formatCurrency(economics.netProfit, locale)}
                              </span>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${economics.netProfit > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {economics.margin.toFixed(1)}% Margem
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
