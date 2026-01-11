
import React, { useState } from 'react';
import { Settings, Globe, Save, DollarSign, BarChart3, TrendingUp, Building2, MapPin, Mail, Phone, Trophy, AlertTriangle, Terminal, Star } from 'lucide-react';
import { StoreConfig, GlobalFinancialSettings, LoyaltyLevel } from '../../types';
import { Locale } from '../../i18n';

interface AdminSystemProps {
  config: StoreConfig;
  onChange: (config: StoreConfig) => void;
  onSave: () => void;
  isLoading: boolean;
  editLocale: Locale;
  onLocaleChange: (l: Locale) => void;
}

const AdminSystem: React.FC<AdminSystemProps> = ({ config, onChange, onSave, isLoading, editLocale, onLocaleChange }) => {
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const defaultFinancials: GlobalFinancialSettings = {
      fixed_monthly: 0,
      infra_tech: 0,
      monthly_sales_vol: 0,
      das_mei: 0,
      marketing_fixed: 0,
      packaging_cost: 0,
      avg_freight_cost: 0,
      tax_regime: 'mei',
      origin_state: 'SP',
      origin_cep: '01310100'
  };

  const updateFinancial = (field: string, value: number) => {
      const currentFin = config.financial_settings || defaultFinancials;
      onChange({
          ...config,
          financial_settings: { ...currentFin, [field]: value }
      });
  };

  const fin = config.financial_settings || defaultFinancials;
  const loyalty = config.loyalty_program || { enabled: true, cashback_percentage: 1, xp_per_currency_unit: 10, review_cashback_amount: 0, levels: [] };

  const updateLoyalty = (field: string, value: any) => {
      onChange({
          ...config,
          loyalty_program: { ...loyalty, [field]: value }
      });
  };

  const updateLevel = (index: number, field: keyof LoyaltyLevel, value: any) => {
      const newLevels = [...loyalty.levels];
      newLevels[index] = { ...newLevels[index], [field]: value };
      updateLoyalty('levels', newLevels);
  };

  const addLevel = () => {
      updateLoyalty('levels', [...loyalty.levels, { level: loyalty.levels.length + 1, xp_required: 0, reward_coupon_value: 0, reward_description: '' }]);
  };

  const handleSafeSave = async () => {
      try {
          setSchemaError(null);
          await onSave();
      } catch (e: any) {
          if (e.message && e.message.includes('loyalty_program')) {
              setSchemaError("Erro de Schema: Coluna 'loyalty_program' não encontrada.");
          } else {
              // Passa outros erros para frente ou alerta
              alert(e.message);
          }
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Settings className="w-8 h-8" /> Configurações do Sistema
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Definições globais de marca, jurídico e parâmetros financeiros para o Health Dashboard
          </p>
        </div>
        <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 gap-1">
            {(['pt', 'en', 'es', 'fr'] as Locale[]).map(l => (
              <button 
                key={l} 
                onClick={() => onLocaleChange(l)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editLocale === l ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >
                {l}
              </button>
            ))}
        </div>
      </div>

      {/* SCHEMA ERROR ALERT */}
      {schemaError && (
          <div className="bg-red-50 border border-red-200 p-8 rounded-[2rem] animate-in fade-in slide-in-from-top-4">
              <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl text-red-600"><AlertTriangle className="w-6 h-6" /></div>
                  <div className="flex-1">
                      <h4 className="text-lg font-black text-red-700 mb-2">Atualização de Banco de Dados Necessária</h4>
                      <p className="text-sm text-red-600 mb-4">O sistema detectou que a tabela <code>store_config</code> não possui a coluna <code>loyalty_program</code>. Isso impede o salvamento das configurações de fidelidade.</p>
                      
                        <div className="bg-white p-4 rounded-xl border border-red-100 font-mono text-xs text-neutral-600 overflow-x-auto mb-4">
                            <code>{`alter table public.store_config add column if not exists loyalty_program jsonb default '{"enabled": true, "levels": [], "cashback_percentage": 1, "xp_per_currency_unit": 10}'::jsonb;`}</code>
                        </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Execute o comando acima no Editor SQL do Supabase.</p>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* COLUMN 1: BRAND, ABOUT US & LEGAL */}
          <div className="space-y-12">
              <section className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Identidade & Jurídico
                  </h4>
                  <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome da Marca</label>
                        <input 
                          className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-xl font-black outline-none focus:bg-white focus:border-black transition-all"
                          value={config.brand_name}
                          onChange={e => onChange({...config, brand_name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Termos de Serviço ({editLocale})</label>
                          <textarea 
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-medium min-h-[150px] outline-none focus:bg-white focus:border-black transition-all"
                            value={config.terms_of_service[editLocale] || ''}
                            onChange={e => onChange({...config, terms_of_service: { ...config.terms_of_service, [editLocale]: e.target.value }})}
                          />
                      </div>
                      <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Privacidade ({editLocale})</label>
                          <textarea 
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-xs font-medium min-h-[150px] outline-none focus:bg-white focus:border-black transition-all"
                            value={config.privacy_policy[editLocale] || ''}
                            onChange={e => onChange({...config, privacy_policy: { ...config.privacy_policy, [editLocale]: e.target.value }})}
                          />
                      </div>
                  </div>
              </section>

              {/* LOYALTY SETTINGS */}
              <section className="bg-neutral-900 text-white p-10 rounded-[3rem] border border-neutral-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10">
                      <Trophy className="w-64 h-64" />
                  </div>
                  <div className="relative z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-8 flex items-center gap-2">
                          <Trophy className="w-4 h-4" /> Programa de Fidelidade
                      </h4>
                      <div className="grid grid-cols-2 gap-6 mb-8">
                          <div className="space-y-2">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Cashback (%)</label>
                              <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none" value={loyalty.cashback_percentage} onChange={e => updateLoyalty('cashback_percentage', Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">XP por $1</label>
                              <input type="number" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none" value={loyalty.xp_per_currency_unit} onChange={e => updateLoyalty('xp_per_currency_unit', Number(e.target.value))} />
                          </div>
                      </div>
                      <div className="mb-8">
                          <div className="space-y-2">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                                  <Star className="w-3 h-3" /> Cashback por Avaliação ($)
                              </label>
                              <input 
                                  type="number" 
                                  step="0.01"
                                  className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none" 
                                  value={loyalty.review_cashback_amount || 0} 
                                  onChange={e => updateLoyalty('review_cashback_amount', Number(e.target.value))} 
                                  placeholder="0.00"
                              />
                              <p className="text-[7px] text-white/30 mt-1">Valor fixo de cashback concedido por cada avaliação de pedido</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-2 block">Níveis & Recompensas</label>
                          {loyalty.levels.map((lvl, idx) => (
                              <div key={idx} className="flex gap-4 items-center">
                                  <div className="w-10 text-center font-black text-xl text-yellow-500">{lvl.level}</div>
                                  <input placeholder="XP Req." type="number" className="w-20 p-3 bg-white/5 border border-white/10 rounded-xl text-xs" value={lvl.xp_required} onChange={e => updateLevel(idx, 'xp_required', Number(e.target.value))} />
                                  <input placeholder="Reward Value $" type="number" className="w-24 p-3 bg-white/5 border border-white/10 rounded-xl text-xs" value={lvl.reward_coupon_value} onChange={e => updateLevel(idx, 'reward_coupon_value', Number(e.target.value))} />
                                  <input placeholder="Label (ex: Gold)" className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-xs" value={lvl.reward_description} onChange={e => updateLevel(idx, 'reward_description', e.target.value)} />
                              </div>
                          ))}
                          <button onClick={addLevel} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white mt-2">+ Adicionar Nível</button>
                      </div>
                  </div>
              </section>
          </div>

          {/* COLUMN 2: CORPORATE DATA & FINANCIAL PARAMETERS */}
          <div className="space-y-12">
              {/* Corporate Data Section */}
              <section className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Dados da Empresa
                  </h4>
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">CNPJ (Tax ID)</label>
                          <input 
                            className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-bold font-mono outline-none focus:bg-white focus:border-black transition-all"
                            value={config.tax_id || ''}
                            onChange={e => onChange({...config, tax_id: e.target.value})}
                            placeholder="00.000.000/0000-00"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                              <MapPin className="w-3 h-3" /> Endereço Comercial
                          </label>
                          <input 
                            className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-black transition-all"
                            value={config.address || ''}
                            onChange={e => onChange({...config, address: e.target.value})}
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                  <Mail className="w-3 h-3" /> Email de Contato
                              </label>
                              <input 
                                className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-black transition-all"
                                value={config.contact_email || ''}
                                onChange={e => onChange({...config, contact_email: e.target.value})}
                                placeholder="contato@empresa.com"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                  <Phone className="w-3 h-3" /> Telefone / SAC
                              </label>
                              <input 
                                className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-black transition-all"
                                value={config.support_phone || ''}
                                onChange={e => onChange({...config, support_phone: e.target.value})}
                                placeholder="+55 11 99999-9999"
                              />
                          </div>
                      </div>
                  </div>
              </section>

              <section className="bg-neutral-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden h-full border border-neutral-800">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                      <BarChart3 className="w-64 h-64" />
                  </div>
                  
                  <div className="relative z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-8 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" /> Parâmetros Financeiros (Base de Cálculo)
                      </h4>
                      
                      <div className="space-y-10">
                          {/* TARGET */}
                          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                              <div className="flex items-center gap-3 mb-4">
                                  <TrendingUp className="w-5 h-5 text-green-400" />
                                  <label className="text-[9px] font-black uppercase tracking-widest text-white">Meta de Vendas (Mensal)</label>
                              </div>
                              <div className="relative">
                                <input 
                                    type="number"
                                    className="w-full bg-transparent text-5xl font-light outline-none border-b border-white/20 pb-2 focus:border-white transition-all placeholder:text-white/20 font-mono"
                                    value={fin.monthly_sales_vol || ''}
                                    onChange={e => updateFinancial('monthly_sales_vol', Number(e.target.value))}
                                    placeholder="0"
                                />
                                <span className="absolute right-0 bottom-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Unidades</span>
                              </div>
                              <p className="text-[8px] text-white/40 mt-4 uppercase tracking-widest font-medium leading-relaxed">
                                  Volume alvo utilizado para rateio de custos fixos no cálculo de margem por produto.
                              </p>
                          </div>

                          <div>
                              <h5 className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-6 border-b border-white/10 pb-2">Custos Fixos Mensais</h5>
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Operacional (Aluguel/Pessoal)</label>
                                      <input 
                                        type="number"
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/10 transition-all font-mono"
                                        value={fin.fixed_monthly || ''}
                                        onChange={e => updateFinancial('fixed_monthly', Number(e.target.value))}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Infraestrutura Tech</label>
                                      <input 
                                        type="number"
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/10 transition-all font-mono"
                                        value={fin.infra_tech || ''}
                                        onChange={e => updateFinancial('infra_tech', Number(e.target.value))}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Marketing Fixo</label>
                                      <input 
                                        type="number"
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/10 transition-all font-mono"
                                        value={fin.marketing_fixed || ''}
                                        onChange={e => updateFinancial('marketing_fixed', Number(e.target.value))}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Imposto Fixo (DAS/MEI)</label>
                                      <input 
                                        type="number"
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/10 transition-all font-mono"
                                        value={fin.das_mei || ''}
                                        onChange={e => updateFinancial('das_mei', Number(e.target.value))}
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="pt-6 border-t border-white/10">
                              <h5 className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-6">Variáveis Médias (Estimativa Unitária)</h5>
                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Frete Médio (Subsídio)</label>
                                      <input 
                                        type="number"
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/10 transition-all text-yellow-200 font-mono"
                                        value={fin.avg_freight_cost || ''}
                                        onChange={e => updateFinancial('avg_freight_cost', Number(e.target.value))}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-white/40">Embalagem/Un.</label>
                                      <input 
                                        type="number"
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:bg-white/10 transition-all text-yellow-200 font-mono"
                                        value={fin.packaging_cost || ''}
                                        onChange={e => updateFinancial('packaging_cost', Number(e.target.value))}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>
          </div>
      </div>

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-neutral-200 p-6 md:px-12 flex justify-end z-50 shadow-2xl md:ml-64 md:w-[calc(100%-16rem)]">
          <button 
            onClick={handleSafeSave}
            disabled={isLoading}
            className="px-12 py-6 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
          >
            {isLoading ? 'Sincronizando...' : <><Save className="w-4 h-4" /> Salvar Configurações</>}
          </button>
      </footer>
    </div>
  );
};

export default AdminSystem;
