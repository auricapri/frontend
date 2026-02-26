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
  expressOption: ShippingOption | null;
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
  // Express delivery (Mon–Thu)
  expressOption: ShippingOption | null;
  selectedVarejoShipping: 'free' | 'express';
  setSelectedVarejoShipping: (choice: 'free' | 'express') => void;
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
  const [expressOption, setExpressOption] = useState<ShippingOption | null>(null);
  const [selectedVarejoShipping, setSelectedVarejoShippingState] = useState<'free' | 'express'>('free');

  // Holds the free shipping InternalLogisticsInfo so we can restore it when switching back
  const freeShippingInfoRef = useRef<InternalLogisticsInfo | null>(null);

  // Refs para debounce
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCepRef = useRef<string>('');

  const setSelectedVarejoShipping = useCallback((choice: 'free' | 'express') => {
    setSelectedVarejoShippingState(choice);
    if (choice === 'express' && expressOption) {
      setBestInternalShipping({
        selected_carrier: expressOption.provider,
        method: expressOption.method,
        real_cost: expressOption.real_cost,
        estimated_days: expressOption.estimated_days,
        display_price_was: expressOption.display_price_was,
        display_days_was: expressOption.display_days_was,
      } as InternalLogisticsInfo);
    } else if (freeShippingInfoRef.current) {
      setBestInternalShipping(freeShippingInfoRef.current);
    }
  }, [expressOption]);

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
        setExpressOption(null);
        setSelectedVarejoShippingState('free');
        freeShippingInfoRef.current = null;
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
        setExpressOption(cached.expressOption);
        setSelectedVarejoShippingState('free');
        freeShippingInfoRef.current = cached.bestInternalShipping;
        setCalculatingShipping(false);
        return;
      }

      setCalculatingShipping(true);
      setShippingDisplay(null);
      setBestInternalShipping(null);
      setShippingOptions([]);
      setSelectedShippingOption(null);
      setExpressOption(null);
      setSelectedVarejoShippingState('free');
      freeShippingInfoRef.current = null;

      try {
        let resultShippingDisplay: ShippingDisplay = null;
        let resultBestInternalShipping: InternalLogisticsInfo | null = null;
        let resultShippingOptions: ShippingOption[] = [];
        let resultSelectedShippingOption: ShippingOption | null = null;
        let resultExpressOption: ShippingOption | null = null;

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
          // Varejo — fetch free shipping and express option in parallel
          const [logisticsInfo, expressResult] = await Promise.all([
            logisticsService.calculateShipping(cleanedCep, address || undefined),
            logisticsService.calculateExpressOption(cleanedCep),
          ]);

          resultShippingDisplay = {
            price: logisticsInfo.display_price_was,
            days: logisticsInfo.display_days_was,
          };
          // For varejo (retail) users, shipping is always free (displayed as GRÁTIS)
          resultBestInternalShipping = {
            ...logisticsInfo,
            real_cost: 0,
          };

          resultExpressOption = expressResult.available && expressResult.option
            ? expressResult.option
            : null;
        }

        // Store free shipping info so user can switch back from express
        freeShippingInfoRef.current = resultBestInternalShipping;

        // Atualiza estados
        setShippingDisplay(resultShippingDisplay);
        setBestInternalShipping(resultBestInternalShipping);
        setShippingOptions(resultShippingOptions);
        setSelectedShippingOption(resultSelectedShippingOption);
        setExpressOption(resultExpressOption);

        // Salva no cache
        setCachedResult(cleanedCep, userMode, {
          shippingDisplay: resultShippingDisplay,
          bestInternalShipping: resultBestInternalShipping,
          shippingOptions: resultShippingOptions,
          selectedShippingOption: resultSelectedShippingOption,
          expressOption: resultExpressOption,
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
        setExpressOption(cached.expressOption);
        setSelectedVarejoShippingState('free');
        freeShippingInfoRef.current = cached.bestInternalShipping;
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
    setExpressOption(null);
    setSelectedVarejoShippingState('free');
    freeShippingInfoRef.current = null;
  }, []);

  return {
    calculatingShipping,
    shippingDisplay,
    bestInternalShipping,
    shippingOptions,
    selectedShippingOption,
    setSelectedShippingOption,
    expressOption,
    selectedVarejoShipping,
    setSelectedVarejoShipping,
    resetShipping,
    calculateLogistics,
    calculateLogisticsImmediate,
  };
}
