import { OrderStatus, PaymentMethod } from './enums.js';
export { OrderStatus, PaymentMethod };
export const DEFAULT_FINANCIAL_SETTINGS = {
    fixed_monthly: 500,
    infra_tech: 200,
    monthly_sales_vol: 100,
    das_mei: 71.60,
    marketing_fixed: 300,
    packaging_cost: 5,
    avg_freight_cost: 25,
    tax_regime: 'mei',
    origin_state: 'SP',
    origin_cep: '01310100',
    payment_gateway: {
        provider: 'other',
        fee_percentage: 0.0399,
        fee_fixed: 0.50,
        pix_fee_percentage: 0.0099,
        pix_fee_fixed: 0,
        boleto_fee_fixed: 3.49,
        installment_fee_per_installment: 0.0199,
        max_installments: 12
    },
    cost_structure: {
        devolution_rate: 0.03,
        reprocessing_cost: 10,
        loss_rate: 0.05,
        storage_rate: 0.02,
        weight_surcharge_threshold_g: 1000,
        weight_surcharge_amount: 5
    }
};
export var UserMode;
(function (UserMode) {
    UserMode["VAREJO"] = "VAREJO";
    UserMode["ATACADO"] = "ATACADO";
})(UserMode || (UserMode = {}));
//# sourceMappingURL=index.js.map