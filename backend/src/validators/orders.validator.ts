import { z } from 'zod';
import { PaymentMethod, OrderStatus } from '../../shared/types/enums.js';

export const AddressDataSchema = z.object({
  logradouro: z.string().min(1),
  bairro: z.string().min(1),
  localidade: z.string().min(1),
  uf: z.string().length(2),
  cep: z.string().min(8).max(9).optional(),
  numero: z.string().min(1).optional(),
  complemento: z.string().optional(),
  erro: z.boolean().optional(),
}).passthrough();

export const InternalLogisticsInfoSchema = z.object({
  selected_carrier: z.string().min(1),
  method: z.string().optional(),
  real_cost: z.number().min(0),
  estimated_days: z.number().min(0),
  display_price_was: z.number().min(0),
  display_days_was: z.number().min(0),
}).passthrough();

export const CartItemSchema = z
  .object({
    variant_id: z.string().min(1),
    product_id: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })
  .passthrough();

export const CreateOrderSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  addressData: AddressDataSchema,
  logisticsInfo: InternalLogisticsInfoSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  subtotal: z.number().positive(),
  finalAmount: z.number().positive(),
  giftForUserId: z.string().uuid().optional().nullable(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().optional().nullable(),
});

export const OrderParamsSchema = z.object({
  id: z.string().uuid(),
});
