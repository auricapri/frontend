/**
 * InstallmentFeeService - Serviço de cálculo de taxas de parcelamento
 *
 * Este serviço é responsável por calcular as taxas de parcelamento para pagamentos
 * com cartão de crédito. As taxas são calculadas exclusivamente no backend por segurança.
 *
 * Taxas por faixa de parcelas:
 * - 1x (à vista): 0% + R$ 0,00
 * - 2-6x: 3,49% + R$ 0,49
 * - 7-12x: 3,99% + R$ 0,49
 */

export interface InstallmentFeeConfig {
  code: string;
  minInstallments: number;
  maxInstallments: number;
  percentageFee: number;
  fixedFee: number;
}

export interface InstallmentOption {
  code: string;
  installments: number;
  installmentValue: number;
  totalValue: number;
  feeAmount: number;
  label: string;
}

export interface SplitCardInstallments {
  card1: {
    amount: number;
    installments: number;
    code: string;
    totalWithFee: number;
    installmentValue: number;
    feeAmount: number;
  };
  card2: {
    amount: number;
    installments: number;
    code: string;
    totalWithFee: number;
    installmentValue: number;
    feeAmount: number;
  };
  grandTotal: number;
  totalFees: number;
}

const FEE_TIERS: InstallmentFeeConfig[] = [
  { code: 'INST_1', minInstallments: 1, maxInstallments: 1, percentageFee: 0, fixedFee: 0 },
  { code: 'INST_2_6', minInstallments: 2, maxInstallments: 6, percentageFee: 0.0349, fixedFee: 0.49 },
  { code: 'INST_7_12', minInstallments: 7, maxInstallments: 12, percentageFee: 0.0399, fixedFee: 0.49 },
];

const MAX_INSTALLMENTS = 12;
const MIN_INSTALLMENT_VALUE = 10.00; // Valor mínimo por parcela em R$

export class InstallmentFeeService {
  /**
   * Encontra a configuração de taxa para um número de parcelas
   */
  private getTierForInstallments(installments: number): InstallmentFeeConfig | null {
    return FEE_TIERS.find(
      tier => installments >= tier.minInstallments && installments <= tier.maxInstallments
    ) || null;
  }

  /**
   * Encontra a configuração de taxa pelo código
   */
  private getTierByCode(code: string): InstallmentFeeConfig | null {
    return FEE_TIERS.find(tier => tier.code === code) || null;
  }

  /**
   * Calcula o valor total com taxa para um valor base e número de parcelas
   */
  calculateFinalAmount(baseAmount: number, installments: number): number {
    const tier = this.getTierForInstallments(installments);
    if (!tier) {
      throw new Error(`Número de parcelas inválido: ${installments}. Máximo permitido: ${MAX_INSTALLMENTS}`);
    }

    const fee = (baseAmount * tier.percentageFee) + tier.fixedFee;
    return Math.ceil((baseAmount + fee) * 100) / 100; // Arredonda para cima
  }

  /**
   * Calcula a taxa aplicada para um valor base e número de parcelas
   */
  calculateFee(baseAmount: number, installments: number): number {
    const tier = this.getTierForInstallments(installments);
    if (!tier) {
      throw new Error(`Número de parcelas inválido: ${installments}`);
    }

    return Math.ceil((baseAmount * tier.percentageFee + tier.fixedFee) * 100) / 100;
  }

  /**
   * Valida se um código de taxa é válido para o número de parcelas informado
   */
  validateInstallmentCode(code: string, installments: number): boolean {
    const tier = this.getTierByCode(code);
    if (!tier) return false;
    return installments >= tier.minInstallments && installments <= tier.maxInstallments;
  }

  /**
   * Retorna o máximo de parcelas disponíveis para um valor
   */
  getMaxInstallmentsForAmount(amount: number): number {
    const maxByValue = Math.floor(amount / MIN_INSTALLMENT_VALUE);
    return Math.min(maxByValue, MAX_INSTALLMENTS);
  }

  /**
   * Gera todas as opções de parcelamento para um valor
   */
  getInstallmentOptions(baseAmount: number): InstallmentOption[] {
    const options: InstallmentOption[] = [];
    const maxInstallments = this.getMaxInstallmentsForAmount(baseAmount);

    for (let i = 1; i <= maxInstallments; i++) {
      const tier = this.getTierForInstallments(i)!;
      const totalWithFee = this.calculateFinalAmount(baseAmount, i);
      const installmentValue = Math.ceil((totalWithFee / i) * 100) / 100;
      const feeAmount = Math.ceil((totalWithFee - baseAmount) * 100) / 100;

      let label: string;
      if (i === 1) {
        label = `À vista R$ ${this.formatCurrency(baseAmount)}`;
      } else if (feeAmount > 0) {
        label = `${i}x de R$ ${this.formatCurrency(installmentValue)} (Total: R$ ${this.formatCurrency(totalWithFee)})`;
      } else {
        label = `${i}x de R$ ${this.formatCurrency(installmentValue)} sem juros`;
      }

      options.push({
        code: tier.code,
        installments: i,
        installmentValue,
        totalValue: totalWithFee,
        feeAmount,
        label
      });
    }

    return options;
  }

  /**
   * Calcula opções de parcelamento para split de cartões
   */
  calculateSplitCardOptions(
    totalAmount: number,
    card1Amount: number,
    card1Installments: number,
    card2Installments: number
  ): SplitCardInstallments {
    // Validações
    if (card1Amount <= 0 || card1Amount >= totalAmount) {
      throw new Error('Valor do cartão 1 deve ser maior que 0 e menor que o total');
    }

    const card2Amount = totalAmount - card1Amount;

    if (card2Amount < MIN_INSTALLMENT_VALUE) {
      throw new Error(`Valor mínimo por cartão é R$ ${MIN_INSTALLMENT_VALUE.toFixed(2)}`);
    }

    if (card1Amount < MIN_INSTALLMENT_VALUE) {
      throw new Error(`Valor mínimo por cartão é R$ ${MIN_INSTALLMENT_VALUE.toFixed(2)}`);
    }

    // Validar parcelas
    const maxInstallmentsCard1 = this.getMaxInstallmentsForAmount(card1Amount);
    const maxInstallmentsCard2 = this.getMaxInstallmentsForAmount(card2Amount);

    if (card1Installments > maxInstallmentsCard1) {
      throw new Error(`Máximo de ${maxInstallmentsCard1} parcelas para o valor do cartão 1`);
    }

    if (card2Installments > maxInstallmentsCard2) {
      throw new Error(`Máximo de ${maxInstallmentsCard2} parcelas para o valor do cartão 2`);
    }

    // Calcular valores para cada cartão
    const tier1 = this.getTierForInstallments(card1Installments)!;
    const tier2 = this.getTierForInstallments(card2Installments)!;

    const card1TotalWithFee = this.calculateFinalAmount(card1Amount, card1Installments);
    const card2TotalWithFee = this.calculateFinalAmount(card2Amount, card2Installments);

    const card1InstallmentValue = Math.ceil((card1TotalWithFee / card1Installments) * 100) / 100;
    const card2InstallmentValue = Math.ceil((card2TotalWithFee / card2Installments) * 100) / 100;

    const card1Fee = this.calculateFee(card1Amount, card1Installments);
    const card2Fee = this.calculateFee(card2Amount, card2Installments);

    return {
      card1: {
        amount: card1Amount,
        installments: card1Installments,
        code: tier1.code,
        totalWithFee: card1TotalWithFee,
        installmentValue: card1InstallmentValue,
        feeAmount: card1Fee
      },
      card2: {
        amount: card2Amount,
        installments: card2Installments,
        code: tier2.code,
        totalWithFee: card2TotalWithFee,
        installmentValue: card2InstallmentValue,
        feeAmount: card2Fee
      },
      grandTotal: card1TotalWithFee + card2TotalWithFee,
      totalFees: card1Fee + card2Fee
    };
  }

  /**
   * Valida e recalcula o valor final baseado no código de taxa
   * Usado para garantir que o frontend não manipulou os valores
   */
  validateAndCalculate(
    baseAmount: number,
    installments: number,
    providedCode: string,
    providedTotal?: number
  ): { valid: boolean; calculatedTotal: number; error?: string } {
    // Validar código
    if (!this.validateInstallmentCode(providedCode, installments)) {
      return {
        valid: false,
        calculatedTotal: 0,
        error: `Código de taxa '${providedCode}' inválido para ${installments} parcelas`
      };
    }

    // Calcular valor correto
    const calculatedTotal = this.calculateFinalAmount(baseAmount, installments);

    // Se um total foi fornecido, verificar se está correto (com tolerância de 1 centavo)
    if (providedTotal !== undefined) {
      const diff = Math.abs(providedTotal - calculatedTotal);
      if (diff > 0.01) {
        return {
          valid: false,
          calculatedTotal,
          error: `Valor total fornecido (${providedTotal}) não corresponde ao calculado (${calculatedTotal})`
        };
      }
    }

    return {
      valid: true,
      calculatedTotal
    };
  }

  /**
   * Retorna informações da configuração de taxa
   */
  getFeeTierInfo(): InstallmentFeeConfig[] {
    return [...FEE_TIERS];
  }

  /**
   * Formata valor como moeda
   */
  private formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }
}
