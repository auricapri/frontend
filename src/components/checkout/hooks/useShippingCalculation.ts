import { useCallback, useState, useRef } from 'react';
import { LogisticsService, type ShippingOption } from '../../../services/logistics.service';
import { UserMode, type AddressData, type InternalLogisticsInfo, type UserMode as UserModeType } from '../../../types';

export type ShippingDisplay = { price: number; days: number } | null;

// Cache de CEPs calculados (TTL de 5 minutos)
type CachedShipping = {
  shippingDisplay: ShippingDisplay;
  bestInternalShipping: InternalLogisticsInfo | null;
  shippingOptions: ShippingOption[];
  selectedShippingOption: ShippingOption | null;
  timestamp: number;
};
const shippingCache = new Map<string, CachedShipping>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(cep: string, userMode: UserModeType): string {
  return `${cep}-${userMode}`;
}

function getCachedResult(cep: string, userMode: UserModeType): CachedShipping | null {
  const key = getCacheKey(cep, userMode);
  const cached = shippingCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  if (cached) {
    shippingCache.delete(key); // Remove cache expirado
  }
  return null;
}

function setCachedResult(cep: string, userMode: UserModeType, result: Omit<CachedShipping, 'timestamp'>) {
  const key = getCacheKey(cep, userMode);
  shippingCache.set(key, { ...result, timestamp: Date.now() });
}

export type ShippingCalculationState = {
  calculatingShipping: boolean;
  shippingDisplay: ShippingDisplay;
  bestInternalShipping: InternalLogisticsInfo | null;
  shippingOptions: ShippingOption[];
  selectedShippingOption: ShippingOption | null;
  setSelectedShippingOption: (opt: ShippingOption | null) => void;
  resetShipping: () => void;
  calculateLogistics: (destCep: string) => void;
  calculateLogisticsImmediate: (destCep: string) => Promise<void>;
};

export function useShippingCalculation(params: {
  logisticsService: LogisticsService;
  userMode: UserModeType;
  address: AddressData | null;
}): ShippingCalculationState {
  const { logisticsService, userMode, address } = params;

  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingDisplay, setShippingDisplay] = useState<ShippingDisplay>(null);
  const [bestInternalShipping, setBestInternalShipping] = useState<InternalLogisticsInfo | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);

  // Refs para debounce
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCepRef = useRef<string>('');

  // Função que faz o cálculo real (sem debounce)
  const calculateLogisticsImmediate = useCallback(
    async (destCep: string) => {
      const cleanedCep = destCep.replace(/\D/g, '');

      // Evita recálculo se o CEP não mudou
      if (cleanedCep === lastCepRef.current && shippingDisplay !== null) {
        return;
      }
      lastCepRef.current = cleanedCep;

      if (cleanedCep.length !== 8) {
        setBestInternalShipping({
          selected_carrier: 'manual',
          method: 'MANUAL',
          real_cost: 0,
          estimated_days: 0,
          display_price_was: 0,
          display_days_was: 0,
        });
        setShippingDisplay(null);
        setShippingOptions([]);
        setSelectedShippingOption(null);
        setCalculatingShipping(false);
        return;
      }

      // Verifica cache
      const cached = getCachedResult(cleanedCep, userMode);
      if (cached) {
        setShippingDisplay(cached.shippingDisplay);
        setBestInternalShipping(cached.bestInternalShipping);
        setShippingOptions(cached.shippingOptions);
        setSelectedShippingOption(cached.selectedShippingOption);
        setCalculatingShipping(false);
        return;
      }

      setCalculatingShipping(true);
      setShippingDisplay(null);
      setBestInternalShipping(null);
      setShippingOptions([]);
      setSelectedShippingOption(null);

      try {
        let resultShippingDisplay: ShippingDisplay = null;
        let resultBestInternalShipping: InternalLogisticsInfo | null = null;
        let resultShippingOptions: ShippingOption[] = [];
        let resultSelectedShippingOption: ShippingOption | null = null;

        if (userMode === UserMode.ATACADO) {
          const options = await logisticsService.calculateShippingOptions(cleanedCep, address || undefined);
          if (!Array.isArray(options) || options.length === 0) {
            setCalculatingShipping(false);
            return;
          }
          resultShippingOptions = options;

          const cheapest = options.reduce((prev, curr) =>
            (curr?.real_cost || Infinity) < (prev?.real_cost || Infinity) ? curr : prev
          );
          resultSelectedShippingOption = cheapest;

          resultShippingDisplay = {
            price: cheapest.display_price_was,
            days: cheapest.display_days_was,
          };

          resultBestInternalShipping = {
            selected_carrier: cheapest.provider,
            method: cheapest.method,
            real_cost: cheapest.real_cost,
            estimated_days: cheapest.estimated_days,
            display_price_was: cheapest.display_price_was,
            display_days_was: cheapest.display_days_was,
          };
        } else {
          const logisticsInfo = await logisticsService.calculateShipping(cleanedCep, address || undefined);
          resultShippingDisplay = {
            price: logisticsInfo.display_price_was,
            days: logisticsInfo.display_days_was,
          };
          resultBestInternalShipping = logisticsInfo;
        }

        // Atualiza estados
        setShippingDisplay(resultShippingDisplay);
        setBestInternalShipping(resultBestInternalShipping);
        setShippingOptions(resultShippingOptions);
        setSelectedShippingOption(resultSelectedShippingOption);

        // Salva no cache
        setCachedResult(cleanedCep, userMode, {
          shippingDisplay: resultShippingDisplay,
          bestInternalShipping: resultBestInternalShipping,
          shippingOptions: resultShippingOptions,
          selectedShippingOption: resultSelectedShippingOption,
        });
      } catch {
        setBestInternalShipping({
          selected_carrier: 'correios',
          method: 'PAC',
          real_cost: 0,
          estimated_days: 0,
          display_price_was: 0,
          display_days_was: 0,
        });
      } finally {
        setCalculatingShipping(false);
      }
    },
    [address, logisticsService, userMode, shippingDisplay]
  );

  // Função com debounce de 500ms
  const calculateLogistics = useCallback(
    (destCep: string) => {
      // Cancela timeout anterior
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      const cleanedCep = destCep.replace(/\D/g, '');

      // Se CEP incompleto, não mostra loading nem faz debounce
      if (cleanedCep.length < 8) {
        return;
      }

      // Se já tem cache, retorna imediatamente
      const cached = getCachedResult(cleanedCep, userMode);
      if (cached) {
        setShippingDisplay(cached.shippingDisplay);
        setBestInternalShipping(cached.bestInternalShipping);
        setShippingOptions(cached.shippingOptions);
        setSelectedShippingOption(cached.selectedShippingOption);
        return;
      }

      // Debounce de 500ms
      debounceTimeoutRef.current = setTimeout(() => {
        calculateLogisticsImmediate(destCep);
      }, 500);
    },
    [calculateLogisticsImmediate, userMode]
  );

  const resetShipping = useCallback(() => {
    setShippingDisplay(null);
    setBestInternalShipping(null);
    setShippingOptions([]);
    setSelectedShippingOption(null);
  }, []);

  return {
    calculatingShipping,
    shippingDisplay,
    bestInternalShipping,
    shippingOptions,
    selectedShippingOption,
    setSelectedShippingOption,
    resetShipping,
    calculateLogistics,
    calculateLogisticsImmediate,
  };
}
