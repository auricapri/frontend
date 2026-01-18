CREATE TABLE IF NOT EXISTS public.freight_quotes_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_cep TEXT NOT NULL,
  destination_cep TEXT NOT NULL,
  weight_g INTEGER NOT NULL,
  provider TEXT NOT NULL,
  service_code TEXT NOT NULL,
  price NUMERIC NOT NULL,
  delivery_days INTEGER NOT NULL,
  quoted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_freight_quotes_cache_key
ON public.freight_quotes_cache (origin_cep, destination_cep, weight_g, provider, service_code);

CREATE INDEX IF NOT EXISTS idx_freight_quotes_cache_expires_at
ON public.freight_quotes_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_created_at
ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order_created_at
ON public.payments (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suppliers_created_at
ON public.suppliers (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suppliers_active_created_at
ON public.suppliers (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_created_at
ON public.supplier_reviews (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_pickups_supplier
ON public.delivery_pickups (supplier_id);

CREATE INDEX IF NOT EXISTS idx_delivery_pickups_supplier_user
ON public.delivery_pickups (supplier_id, picked_up_by);
