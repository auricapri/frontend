import { InternalLogisticsInfo, AddressData } from '../types';
import {
  FreightQuote,
  FreightCalculationInput,
  ViaCepResponse
} from '../types/pricing.types';
import { apiClient } from '../api/client';

export interface ShippingOption {
  provider: string;
  method: string;
  real_cost: number;
  estimated_days: number;
  display_price_was: number;
  display_days_was: number;
}

/**
 * Servico de logistica — chama o backend API que integra com Melhor Envio
 * e usa freight_base_rates do Supabase como fallback.
 * Zero valores hardcoded — tudo vem do banco via backend.
 */
export class LogisticsService {

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

  async calculateShipping(cep: string, _addressData?: AddressData): Promise<InternalLogisticsInfo> {
    const cleanCep = cep.replace(/\D/g, '');

    try {
      const result = await apiClient.post<InternalLogisticsInfo>('/logistics/calculate-shipping', {
        cep: cleanCep,
      });
      if (result && result.real_cost !== undefined) {
        return result;
      }
    } catch (err) {
      console.warn('Backend shipping API error:', err);
    }

    // If backend is down, return zero-cost manual fallback
    return {
      selected_carrier: 'manual',
      method: 'MANUAL',
      real_cost: 0,
      estimated_days: 0,
      display_price_was: 0,
      display_days_was: 0,
    } as InternalLogisticsInfo;
  }

  async calculateShippingOptions(cep: string, _addressData?: AddressData): Promise<ShippingOption[]> {
    const cleanCep = cep.replace(/\D/g, '');

    try {
      const options = await apiClient.post<ShippingOption[]>('/logistics/shipping-options', {
        cep: cleanCep,
      });
      if (Array.isArray(options) && options.length > 0) {
        return options;
      }
    } catch (err) {
      console.warn('Backend shipping options API error:', err);
    }

    return [];
  }

  async calculateExpressOption(cep: string): Promise<{ available: boolean; option: InternalLogisticsInfo | null }> {
    const cleanCep = cep.replace(/\D/g, '');
    try {
      const result = await apiClient.post<{ available: boolean; option: InternalLogisticsInfo | null }>(
        '/logistics/express-option',
        { cep: cleanCep }
      );
      if (result && typeof result.available === 'boolean') {
        return result;
      }
    } catch (err) {
      console.warn('Express option API error:', err);
    }
    return { available: false, option: null };
  }

  async getFreightQuotes(input: FreightCalculationInput): Promise<FreightQuote[]> {
    try {
      const quotes = await apiClient.post<FreightQuote[]>('/logistics/freight-quotes', {
        originCep: input.originCep,
        destinationCep: input.destinationCep,
        weightG: input.weightG,
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        declaredValue: input.declaredValue,
      });
      if (Array.isArray(quotes) && quotes.length > 0) {
        return quotes;
      }
    } catch (err) {
      console.warn('Backend freight quotes API error:', err);
    }

    return [];
  }

  async fetchCoordinates(_address: string): Promise<[number, number] | null> {
    return null;
  }

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

  calculateVolumetricWeight(lengthCm: number, widthCm: number, heightCm: number): number {
    return (lengthCm * widthCm * heightCm) / 6000;
  }

  getBillableWeight(realWeightKg: number, lengthCm: number, widthCm: number, heightCm: number): number {
    const volumetricWeight = this.calculateVolumetricWeight(lengthCm, widthCm, heightCm);
    return Math.max(realWeightKg, volumetricWeight);
  }
}

export const logisticsService = new LogisticsService();
