-- Migration: Adicionar índices de performance faltantes
-- Data: 2026-01-16
-- Descrição: Índices identificados na análise de performance

-- ===========================================
-- PRODUCT VARIANTS - Crítico para operações de cart
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_product_variants_sku
ON public.product_variants (sku);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
ON public.product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_active
ON public.product_variants (is_active);

-- ===========================================
-- COUPONS - Crítico para validação de cupons
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_coupons_code
ON public.coupons (code);

-- Nota: valid_from/valid_until podem nao existir na tabela coupons
-- CREATE INDEX IF NOT EXISTS idx_coupons_active_valid
-- ON public.coupons (is_active, valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_coupons_is_active
ON public.coupons (is_active);

-- Índice para verificar uso do cupom por usuário
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_user
ON public.coupon_usage (coupon_id, user_id);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user
ON public.coupon_usage (user_id);

-- ===========================================
-- WISHLIST - Crítico para gift links e lookups
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product
ON public.wishlist (user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_share_slug
ON public.wishlist (share_slug);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
ON public.wishlist (user_id);

-- ===========================================
-- PRODUCT REVIEWS - Para páginas de produto
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created
ON public.product_reviews (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_user_created
ON public.product_reviews (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_order
ON public.product_reviews (order_id);

-- Índice para toggle helpful check
CREATE INDEX IF NOT EXISTS idx_product_review_helpful_review_user
ON public.product_review_helpful (review_id, user_id);

-- ===========================================
-- CART SESSIONS - Para performance do carrinho
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id
ON public.cart_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at
ON public.cart_sessions (expires_at);

-- ===========================================
-- ADDRESSES - Para lookup de endereços de usuário
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_addresses_user_id
ON public.addresses (user_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user_default
ON public.addresses (user_id, is_default);

-- ===========================================
-- ORDERS - Filtros comuns adicionais
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_orders_status
ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON public.orders (status, created_at DESC);

-- ===========================================
-- COLLECTION PRODUCTS - Para relações N:M
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id
ON public.collection_products (product_id);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id
ON public.collection_products (collection_id);

-- ===========================================
-- PRODUCTS - Filtros comuns
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_products_is_active
ON public.products (is_active);

CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_supplier
ON public.products (supplier_id);

-- ===========================================
-- USER PAYMENT METHODS - Para checkout
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id
ON public.user_payment_methods (user_id);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_default
ON public.user_payment_methods (user_id, is_default);

-- ===========================================
-- ORDER STATUS HISTORY - Para timeline de pedidos
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created
ON public.order_status_history (order_id, created_at DESC);

-- ===========================================
-- NOTIFICATIONS - Para feed de notificações
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON public.notifications (user_id, is_read);
