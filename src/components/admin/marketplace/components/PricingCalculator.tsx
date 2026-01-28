/**
 * PricingCalculator - Marketplace pricing calculator with fee estimation
 */

import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Loader2,
  Info,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from 'lucide-react';
import { marketplaceApi, type FeeCalculation } from '../../../../api/marketplace.api';
import type { MarketplaceBrand } from '../types';
import { logger } from '../../../../utils/logger';

// ============================================================================
// Component Props
// ============================================================================

export interface PricingCalculatorProps {
  brand: MarketplaceBrand;
  costPrice: number;
  categoryId?: string;
  configId?: string;
  initialPrice?: number;
  onPriceChange: (price: number, feeData?: FeeCalculation) => void;
}

// ============================================================================
// Component
// ============================================================================

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  brand,
  costPrice,
  categoryId = 'MLB1430', // Default to clothing category
  configId,
  initialPrice,
  onPriceChange,
}) => {
  const [price, setPrice] = useState(initialPrice || costPrice * 2); // Default 100% markup
  const [targetMargin, setTargetMargin] = useState(30);
  const [feeData, setFeeData] = useState<FeeCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'price' | 'margin'>('price');

  // Calculate fees when price changes
  useEffect(() => {
    const calculateFees = async () => {
      if (!price || price <= 0) return;
      setIsLoading(true);
      try {
        const result = await marketplaceApi.calculateFees(price, categoryId, 'gold_special', configId);
        setFeeData(result);
        onPriceChange(price, result);
      } catch (err) {
        logger.error('Failed to calculate fees', err);
        // Use default 11% if API fails
        const defaultCommission = 11;
        const estimatedFees = price * (defaultCommission / 100);
        const defaultFeeData: FeeCalculation = {
          category_id: categoryId,
          listing_type: 'gold_special',
          listing_fee: 0,
          sales_commission_percent: defaultCommission,
          estimated_fees: estimatedFees,
          net_revenue: price - estimatedFees,
        };
        setFeeData(defaultFeeData);
        onPriceChange(price, defaultFeeData);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(calculateFees, 500);
    return () => clearTimeout(debounce);
  }, [price, categoryId, configId]);

  // Calculate price from target margin
  const calculateFromMargin = async () => {
    const targetNetRevenue = costPrice * (1 + targetMargin / 100);
    setIsLoading(true);
    try {
      const result = await marketplaceApi.calculateMinimumPrice(targetNetRevenue, categoryId, 'gold_special', configId);
      setPrice(result.minimum_price);
    } catch (err) {
      logger.error('Failed to calculate minimum price', err);
      // Fallback calculation with default 11% commission
      const defaultCommission = 11;
      const minPrice = targetNetRevenue / (1 - defaultCommission / 100);
      setPrice(Math.ceil(minPrice * 100) / 100);
    } finally {
      setIsLoading(false);
    }
  };

  const profit = feeData ? feeData.net_revenue - costPrice : price - costPrice - (price * 0.11);
  const profitMargin = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : '0';
  const isPositiveMargin = profit > 0;

  return (
    <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5" style={{ color: brand.accentColor }} />
          <h4 className="font-bold text-sm">Calculadora de Preço</h4>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('price')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            mode === 'price'
              ? `${brand.bgColor} ${brand.textColor}`
              : 'bg-white border hover:bg-neutral-50'
          }`}
        >
          Definir Preço
        </button>
        <button
          onClick={() => setMode('margin')}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            mode === 'margin'
              ? `${brand.bgColor} ${brand.textColor}`
              : 'bg-white border hover:bg-neutral-50'
          }`}
        >
          Definir Margem
        </button>
      </div>

      {mode === 'price' ? (
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Preço de Venda
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">R$</span>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-lg font-bold"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Margem Desejada (%)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="1"
                value={targetMargin}
                onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 border rounded-lg text-lg font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">%</span>
            </div>
            <button
              onClick={calculateFromMargin}
              disabled={isLoading}
              className={`px-4 py-2.5 rounded-lg font-medium ${brand.bgColor} ${brand.textColor}`}
            >
              Calcular
            </button>
          </div>
        </div>
      )}

      {/* Fee Breakdown */}
      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Custo do Produto</span>
          <span className="font-medium">R$ {costPrice.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-neutral-600">
          <span className="flex items-center gap-1">
            Preço de Venda
            <Info className="w-3 h-3 text-neutral-400" />
          </span>
          <span className="font-bold text-lg">R$ {price.toFixed(2)}</span>
        </div>

        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-neutral-500">
            <span className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Comissão ML ({feeData?.sales_commission_percent || 11}%)
            </span>
            <span className="text-red-500">- R$ {feeData?.estimated_fees.toFixed(2) || (price * 0.11).toFixed(2)}</span>
          </div>

          {feeData?.listing_fee && feeData.listing_fee > 0 && (
            <div className="flex justify-between text-neutral-500">
              <span>Taxa de anúncio</span>
              <span className="text-red-500">- R$ {feeData.listing_fee.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between">
            <span className="text-neutral-600">Receita Líquida</span>
            <span className="font-medium">R$ {feeData?.net_revenue.toFixed(2) || (price * 0.89).toFixed(2)}</span>
          </div>

          <div className={`flex justify-between mt-1 font-bold ${isPositiveMargin ? 'text-green-600' : 'text-red-600'}`}>
            <span className="flex items-center gap-1">
              {isPositiveMargin ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              Lucro
            </span>
            <span>
              R$ {profit.toFixed(2)} ({profitMargin}%)
            </span>
          </div>
        </div>
      </div>

      {/* Warning for low margin */}
      {profit < costPrice * 0.1 && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">
            Margem baixa! Considere aumentar o preço para garantir lucro após taxas.
          </p>
        </div>
      )}
    </div>
  );
};
