-- Migration: Adicionar campos de restrição em cupons e IP em pedidos
-- Data: 2024

-- =============================================
-- 1. Novos campos na tabela COUPONS
-- =============================================

-- is_public: Se false, cupom não aparece na listagem pública (só funciona digitando o código)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- first_purchase_only: Se true, cupom válido apenas para primeira compra do usuário
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS first_purchase_only BOOLEAN DEFAULT false;

-- usage_limit: Limite total de usos do cupom (null = ilimitado)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL;

-- per_user_limit: Limite de uso por usuário (default 1)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1;

-- Garantir que used_count existe (para contar usos)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;

-- =============================================
-- 2. Novos campos na tabela ORDERS
-- =============================================

-- client_ip: IP do cliente que fez o pedido (para detecção de fraudes)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);

-- coupon_id: Cupom aplicado no pedido (para rastreamento)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;

-- =============================================
-- 3. Tabela para rastrear uso de cupons por usuário
-- =============================================

CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para consultas rápidas
  CONSTRAINT unique_coupon_user_order UNIQUE (coupon_id, user_id, order_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);

-- Índice para filtrar cupons públicos
CREATE INDEX IF NOT EXISTS idx_coupons_is_public ON coupons(is_public) WHERE deleted_at IS NULL;

-- Índice para IP dos pedidos
CREATE INDEX IF NOT EXISTS idx_orders_client_ip ON orders(client_ip) WHERE client_ip IS NOT NULL;

-- Índice para cupom nos pedidos
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id) WHERE coupon_id IS NOT NULL;

-- =============================================
-- 4. Comentários para documentação
-- =============================================

COMMENT ON COLUMN coupons.is_public IS 'Se false, cupom não aparece na listagem pública';
COMMENT ON COLUMN coupons.first_purchase_only IS 'Se true, válido apenas para primeira compra do usuário';
COMMENT ON COLUMN coupons.usage_limit IS 'Limite total de usos (null = ilimitado)';
COMMENT ON COLUMN coupons.per_user_limit IS 'Limite de uso por usuário';
COMMENT ON COLUMN orders.client_ip IS 'IP do cliente para detecção de fraudes';
COMMENT ON COLUMN orders.coupon_id IS 'Cupom aplicado no pedido';
COMMENT ON TABLE coupon_usage IS 'Histórico de uso de cupons por usuário';
