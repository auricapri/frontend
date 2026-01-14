import { supabase } from '../utils/supabase';
import { InternalLogisticsInfo, AddressData } from '../types';
import {
  FreightQuote,
  FreightCalculationInput,
  ViaCepResponse
} from '../types/pricing.types';

export interface ShippingOption {
  provider: string;
  method: string;
  real_cost: number;
  estimated_days: number;
  display_price_was: number;
  display_days_was: number;
}

interface FreightTableEntry {
  regionPrefix: string;
  pacPrice: number;
  pacDays: number;
  sedexPrice: number;
  sedexDays: number;
}

const FREIGHT_TABLE: FreightTableEntry[] = [
  { regionPrefix: '01', pacPrice: 18.90, pacDays: 3, sedexPrice: 32.90, sedexDays: 1 },
  { regionPrefix: '02', pacPrice: 18.90, pacDays: 3, sedexPrice: 32.90, sedexDays: 1 },
  { regionPrefix: '03', pacPrice: 18.90, pacDays: 3, sedexPrice: 32.90, sedexDays: 1 },
  { regionPrefix: '04', pacPrice: 18.90, pacDays: 3, sedexPrice: 32.90, sedexDays: 1 },
  { regionPrefix: '05', pacPrice: 18.90, pacDays: 3, sedexPrice: 32.90, sedexDays: 1 },
  { regionPrefix: '06', pacPrice: 22.90, pacDays: 4, sedexPrice: 38.90, sedexDays: 2 },
  { regionPrefix: '07', pacPrice: 22.90, pacDays: 4, sedexPrice: 38.90, sedexDays: 2 },
  { regionPrefix: '08', pacPrice: 22.90, pacDays: 4, sedexPrice: 38.90, sedexDays: 2 },
  { regionPrefix: '09', pacPrice: 22.90, pacDays: 4, sedexPrice: 38.90, sedexDays: 2 },
  { regionPrefix: '1', pacPrice: 25.90, pacDays: 5, sedexPrice: 42.90, sedexDays: 2 },
  { regionPrefix: '2', pacPrice: 32.90, pacDays: 8, sedexPrice: 55.90, sedexDays: 3 },
  { regionPrefix: '3', pacPrice: 28.90, pacDays: 6, sedexPrice: 48.90, sedexDays: 3 },
  { regionPrefix: '4', pacPrice: 35.90, pacDays: 10, sedexPrice: 62.90, sedexDays: 4 },
  { regionPrefix: '5', pacPrice: 38.90, pacDays: 12, sedexPrice: 68.90, sedexDays: 5 },
  { regionPrefix: '6', pacPrice: 42.90, pacDays: 14, sedexPrice: 75.90, sedexDays: 6 },
  { regionPrefix: '7', pacPrice: 45.90, pacDays: 15, sedexPrice: 82.90, sedexDays: 7 },
  { regionPrefix: '8', pacPrice: 32.90, pacDays: 7, sedexPrice: 52.90, sedexDays: 3 },
  { regionPrefix: '9', pacPrice: 35.90, pacDays: 8, sedexPrice: 58.90, sedexDays: 4 },
];

const ORIGIN_CEP = '01310100';

/**
 * Serviço responsável por cálculos e consultas de logística.
 * 
 * Gerencia:
 * - Consulta de endereços via ViaCEP
 * - Cálculo de frete baseado em tabela ou cache
 * - Cotações de transporte
 * - Cálculo de peso volumétrico
 * 
 * Usa cache com TTL de 1 hora para cotações de frete.
 * 
 * @example
 * ```ts
 * const service = new LogisticsService();
 * const address = await service.fetchAddressByCep('01310100');
 * const shipping = await service.calculateShipping('01310100', address);
 * ```
 */
export class LogisticsService {
  private quoteCache: Map<string, { quotes: FreightQuote[], expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 3600000;

  /**
   * Busca dados de endereço via API ViaCEP.
   * 
   * @param cep - CEP a ser consultado (aceita com ou sem formatação)
   * @returns Dados do endereço ou null se não encontrado
   */
  async fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return null;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        return null;
      }

      const data: ViaCepResponse = await response.json();
      
      if (data.erro) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('ViaCEP API error:', error);
      return null;
    }
  }

  /**
   * Calcula informações de frete para um CEP de destino.
   * 
   * Retorna a opção mais barata disponível. Usa cache e tabela de frete como fallback.
   * 
   * @param cep - CEP de destino
   * @param addressData - Dados do endereço (opcional, pode ser usado para otimizações)
   * @returns Informações de logística com transportadora selecionada
   */
  async calculateShipping(cep: string, _addressData?: AddressData): Promise<InternalLogisticsInfo> {
    const quotes = await this.getFreightQuotes({
      originCep: ORIGIN_CEP,
      destinationCep: cep,
      weightG: 500,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      declaredValue: 100
    });

    const cheapestQuote = quotes.reduce((min, q) => q.price < min.price ? q : min, quotes[0]);

    if (!cheapestQuote) {
      return this.getFallbackShipping(cep);
    }

    return {
      selected_carrier: cheapestQuote.provider,
      method: cheapestQuote.serviceName,
      real_cost: cheapestQuote.price,
      estimated_days: cheapestQuote.deliveryDays,
      display_price_was: cheapestQuote.price,
      display_days_was: cheapestQuote.deliveryDays
    } as InternalLogisticsInfo;
  }

  /**
   * Calcula todas as opções de frete disponíveis para um CEP.
   * 
   * @param cep - CEP de destino
   * @param addressData - Dados do endereço (opcional)
   * @returns Lista de opções de frete disponíveis
   */
  async calculateShippingOptions(cep: string, _addressData?: AddressData): Promise<ShippingOption[]> {
    const quotes = await this.getFreightQuotes({
      originCep: ORIGIN_CEP,
      destinationCep: cep,
      weightG: 500,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      declaredValue: 100
    });

    if (quotes.length === 0) {
      return this.getFallbackOptions(cep);
    }

    return quotes.map(q => ({
      provider: q.provider,
      method: q.serviceName,
      real_cost: q.price,
      estimated_days: q.deliveryDays,
      display_price_was: q.price,
      display_days_was: q.deliveryDays
    }));
  }

  async getFreightQuotes(input: FreightCalculationInput): Promise<FreightQuote[]> {
    const cacheKey = `${input.originCep}-${input.destinationCep}-${input.weightG}`;
    const cached = this.quoteCache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.quotes;
    }

    const dbQuotes = await this.loadQuotesFromDatabase(input);
    if (dbQuotes.length > 0) {
      this.quoteCache.set(cacheKey, { quotes: dbQuotes, expiresAt: Date.now() + this.CACHE_TTL_MS });
      return dbQuotes;
    }

    const tableQuotes = this.calculateFromFreightTable(input.destinationCep, input.weightG);
    
    if (tableQuotes.length > 0) {
      await this.saveQuotesToDatabase(input, tableQuotes);
      this.quoteCache.set(cacheKey, { quotes: tableQuotes, expiresAt: Date.now() + this.CACHE_TTL_MS });
    }

    return tableQuotes;
  }

  private async loadQuotesFromDatabase(input: FreightCalculationInput): Promise<FreightQuote[]> {
    try {
      const { data, error } = await supabase
        .from('freight_quotes_cache')
        .select('*')
        .eq('origin_cep', input.originCep.replace(/\D/g, ''))
        .eq('destination_cep', input.destinationCep.replace(/\D/g, ''))
        .eq('weight_g', input.weightG)
        .gt('expires_at', new Date().toISOString());

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map(row => ({
        provider: row.provider,
        serviceCode: row.service_code,
        serviceName: row.service_code,
        price: Number(row.price),
        deliveryDays: row.delivery_days,
        quotedAt: new Date(row.quoted_at),
        expiresAt: new Date(row.expires_at)
      }));
    } catch {
      return [];
    }
  }

  private async saveQuotesToDatabase(input: FreightCalculationInput, quotes: FreightQuote[]): Promise<void> {
    try {
      const rows = quotes.map(q => ({
        origin_cep: input.originCep.replace(/\D/g, ''),
        destination_cep: input.destinationCep.replace(/\D/g, ''),
        weight_g: input.weightG,
        provider: q.provider,
        service_code: q.serviceCode,
        price: q.price,
        delivery_days: q.deliveryDays,
        quoted_at: q.quotedAt.toISOString(),
        expires_at: q.expiresAt.toISOString()
      }));

      await supabase
        .from('freight_quotes_cache')
        .upsert(rows, { 
          onConflict: 'origin_cep,destination_cep,weight_g,provider,service_code' 
        });
    } catch (error) {
      console.error('Error saving freight quotes to cache:', error);
    }
  }

  private calculateFromFreightTable(destinationCep: string, weightG: number): FreightQuote[] {
    const cleanCep = destinationCep.replace(/\D/g, '');
    
    let entry = FREIGHT_TABLE.find(e => cleanCep.startsWith(e.regionPrefix));
    
    if (!entry) {
      entry = FREIGHT_TABLE.find(e => cleanCep.charAt(0) === e.regionPrefix);
    }

    if (!entry) {
      entry = { regionPrefix: '0', pacPrice: 45.90, pacDays: 12, sedexPrice: 75.90, sedexDays: 5 };
    }

    const weightMultiplier = weightG > 1000 ? 1 + ((weightG - 1000) / 1000) * 0.15 : 1;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return [
      {
        provider: 'correios',
        serviceCode: 'PAC',
        serviceName: 'PAC',
        price: Math.round(entry.pacPrice * weightMultiplier * 100) / 100,
        deliveryDays: entry.pacDays,
        quotedAt: now,
        expiresAt
      },
      {
        provider: 'correios',
        serviceCode: 'SEDEX',
        serviceName: 'SEDEX',
        price: Math.round(entry.sedexPrice * weightMultiplier * 100) / 100,
        deliveryDays: entry.sedexDays,
        quotedAt: now,
        expiresAt
      }
    ];
  }

  private getFallbackShipping(cep: string): InternalLogisticsInfo {
    const quotes = this.calculateFromFreightTable(cep, 500);
    const cheapest = quotes[0];

    return {
      selected_carrier: cheapest.provider,
      method: cheapest.serviceName,
      real_cost: cheapest.price,
      estimated_days: cheapest.deliveryDays,
      display_price_was: cheapest.price,
      display_days_was: cheapest.deliveryDays
    } as InternalLogisticsInfo;
  }

  private getFallbackOptions(cep: string): ShippingOption[] {
    const quotes = this.calculateFromFreightTable(cep, 500);
    
    return quotes.map(q => ({
      provider: q.provider,
      method: q.serviceName,
      real_cost: q.price,
      estimated_days: q.deliveryDays,
      display_price_was: q.price,
      display_days_was: q.deliveryDays
    }));
  }

  async fetchCoordinates(_address: string): Promise<[number, number] | null> {
    return null;
  }

  /**
   * Determina o estado brasileiro baseado no prefixo do CEP.
   * 
   * @param cep - CEP a ser analisado
   * @returns Sigla do estado (ex: 'SP', 'RJ')
   */
  getStateFromCep(cep: string): string {
    const cleanCep = cep.replace(/\D/g, '');
    const prefix = parseInt(cleanCep.substring(0, 2), 10);

    if (prefix >= 1 && prefix <= 19) return 'SP';
    if (prefix >= 20 && prefix <= 28) return 'RJ';
    if (prefix === 29) return 'ES';
    if (prefix >= 30 && prefix <= 39) return 'MG';
    if (prefix >= 40 && prefix <= 48) return 'BA';
    if (prefix === 49) return 'SE';
    if (prefix >= 50 && prefix <= 56) return 'PE';
    if (prefix >= 57 && prefix <= 57) return 'AL';
    if (prefix >= 58 && prefix <= 58) return 'PB';
    if (prefix >= 59 && prefix <= 59) return 'RN';
    if (prefix >= 60 && prefix <= 63) return 'CE';
    if (prefix === 64) return 'PI';
    if (prefix >= 65 && prefix <= 65) return 'MA';
    if (prefix >= 66 && prefix <= 68) return 'PA';
    if (prefix === 69) return 'AM';
    if (prefix >= 70 && prefix <= 73) return 'DF';
    if (prefix >= 74 && prefix <= 76) return 'GO';
    if (prefix === 77) return 'TO';
    if (prefix >= 78 && prefix <= 78) return 'MT';
    if (prefix === 79) return 'MS';
    if (prefix >= 80 && prefix <= 87) return 'PR';
    if (prefix >= 88 && prefix <= 89) return 'SC';
    if (prefix >= 90 && prefix <= 99) return 'RS';

    return 'SP';
  }

  /**
   * Calcula o peso volumétrico de uma encomenda.
   * 
   * Fórmula: (comprimento × largura × altura) / 6000
   * 
   * @param lengthCm - Comprimento em centímetros
   * @param widthCm - Largura em centímetros
   * @param heightCm - Altura em centímetros
   * @returns Peso volumétrico em kg
   */
  calculateVolumetricWeight(lengthCm: number, widthCm: number, heightCm: number): number {
    return (lengthCm * widthCm * heightCm) / 6000;
  }

  /**
   * Calcula o peso cobrável (maior entre peso real e volumétrico).
   * 
   * Transportadoras cobram pelo maior entre peso real e volumétrico.
   * 
   * @param realWeightKg - Peso real em kg
   * @param lengthCm - Comprimento em centímetros
   * @param widthCm - Largura em centímetros
   * @param heightCm - Altura em centímetros
   * @returns Peso cobrável em kg
   */
  getBillableWeight(realWeightKg: number, lengthCm: number, widthCm: number, heightCm: number): number {
    const volumetricWeight = this.calculateVolumetricWeight(lengthCm, widthCm, heightCm);
    return Math.max(realWeightKg, volumetricWeight);
  }
}

export const logisticsService = new LogisticsService();
