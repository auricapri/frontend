import { useCallback, useState } from 'react';
import { LogisticsService, type ShippingOption } from '../../../services/logistics.service';
import { UserMode, type AddressData, type InternalLogisticsInfo, type UserMode as UserModeType } from '../../../types';

export type ShippingDisplay = { price: number; days: number } | null;

export type ShippingCalculationState = {
  calculatingShipping: boolean;
  shippingDisplay: ShippingDisplay;
  bestInternalShipping: InternalLogisticsInfo | null;
  shippingOptions: ShippingOption[];
  selectedShippingOption: ShippingOption | null;
  setSelectedShippingOption: (opt: ShippingOption | null) => void;
  resetShipping: () => void;
  calculateLogistics: (destCep: string) => Promise<void>;
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

  const calculateLogistics = useCallback(
    async (destCep: string) => {
      setCalculatingShipping(true);
      setShippingDisplay(null);
      setBestInternalShipping(null);
      setShippingOptions([]);
      setSelectedShippingOption(null);

      const cleanedCep = destCep.replace(/\D/g, '');
      if (cleanedCep.length !== 8) {
        setBestInternalShipping({
          selected_carrier: 'manual',
          method: 'MANUAL',
          real_cost: 0,
          estimated_days: 0,
          display_price_was: 0,
          display_days_was: 0,
        });
        setCalculatingShipping(false);
        return;
      }

      try {
        if (userMode === UserMode.ATACADO) {
          const options = await logisticsService.calculateShippingOptions(cleanedCep, address || undefined);
          if (!Array.isArray(options) || options.length === 0) {
            setCalculatingShipping(false);
            return;
          }
          setShippingOptions(options);

          const cheapest = options.reduce((prev, curr) =>
            (curr?.real_cost || Infinity) < (prev?.real_cost || Infinity) ? curr : prev
          );
          setSelectedShippingOption(cheapest);

          setShippingDisplay({
            price: cheapest.display_price_was,
            days: cheapest.display_days_was,
          });

          setBestInternalShipping({
            selected_carrier: cheapest.provider,
            method: cheapest.method,
            real_cost: cheapest.real_cost,
            estimated_days: cheapest.estimated_days,
            display_price_was: cheapest.display_price_was,
            display_days_was: cheapest.display_days_was,
          });
        } else {
          const logisticsInfo = await logisticsService.calculateShipping(cleanedCep, address || undefined);
          setShippingDisplay({
            price: logisticsInfo.display_price_was,
            days: logisticsInfo.display_days_was,
          });
          setBestInternalShipping(logisticsInfo);
        }
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
    [address, logisticsService, userMode]
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
  };
}
