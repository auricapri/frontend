-- ============================================
-- AURICAPRI - TODAS AS MIGRAÇÕES CONSOLIDADAS
-- ============================================
-- Data: 16 de Janeiro de 2026
-- Projeto: zbrunudbdyuebtpxfnkd
--
-- INSTRUÇÕES:
-- 1. Acesse https://supabase.com/dashboard/project/zbrunudbdyuebtpxfnkd/sql
-- 2. Cole este script no SQL Editor
-- 3. Execute (Run)
-- ============================================

-- ============================================
-- 1. CART SESSIONS (Carrinho persistente)
-- ============================================
CREATE TABLE IF NOT EXISTS cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_session_key ON cart_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at ON cart_sessions(expires_at) WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION update_cart_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cart_sessions_updated_at ON cart_sessions;
CREATE TRIGGER trigger_update_cart_sessions_updated_at
  BEFORE UPDATE ON cart_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_sessions_updated_at();

-- ============================================
-- 2. ORDER REVIEWS (Avaliações de pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  cashback_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

CREATE TABLE IF NOT EXISTS order_review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES order_reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_size INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES order_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_order_reviews_order_id ON order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_user_id ON order_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_order_review_media_review_id ON order_review_media(review_id);
CREATE INDEX IF NOT EXISTS idx_order_review_helpful_review_id ON order_review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_order_review_helpful_user_id ON order_review_helpful(user_id);

CREATE OR REPLACE FUNCTION update_order_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_reviews_updated_at ON order_reviews;
CREATE TRIGGER order_reviews_updated_at
  BEFORE UPDATE ON order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_order_reviews_updated_at();

ALTER TABLE order_reviews ADD COLUMN IF NOT EXISTS cashback_awarded BOOLEAN DEFAULT FALSE;

-- ============================================
-- 3. PRODUCT REVIEWS (Avaliações de produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  cashback_awarded BOOLEAN DEFAULT FALSE,
  variant_size TEXT,
  variant_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, product_id, variant_id, user_id)
);

CREATE TABLE IF NOT EXISTS product_review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  file_size INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_variant_id ON product_reviews(variant_id);
CREATE INDEX IF NOT EXISTS idx_product_review_media_review_id ON product_review_media(review_id);
CREATE INDEX IF NOT EXISTS idx_product_review_helpful_review_id ON product_review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_product_review_helpful_user_id ON product_review_helpful(user_id);

CREATE OR REPLACE FUNCTION update_product_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_reviews_updated_at ON product_reviews;
CREATE TRIGGER product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_reviews_updated_at();

-- ============================================
-- 4. SUPPLIERS (Fornecedores)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL,
  image_url TEXT,
  facade_image_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  guarantees_stock BOOLEAN DEFAULT FALSE,
  address JSONB,
  phone TEXT,
  email TEXT,
  comments TEXT,
  cnpj TEXT,
  contact_person TEXT,
  payment_terms TEXT,
  delivery_time TEXT,
  minimum_order_quantity INTEGER,
  minimum_wholesale_value DECIMAL(10, 2),
  website TEXT,
  notes TEXT,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(supplier_id, user_id)
);

CREATE TABLE IF NOT EXISTS supplier_review_helpful (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES supplier_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier_id ON supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_user_id ON supplier_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_review_helpful_review_id ON supplier_review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_supplier_review_helpful_user_id ON supplier_review_helpful(user_id);

CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS suppliers_updated_at ON suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

CREATE OR REPLACE FUNCTION update_supplier_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supplier_reviews_updated_at ON supplier_reviews;
CREATE TRIGGER supplier_reviews_updated_at
  BEFORE UPDATE ON supplier_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_reviews_updated_at();

CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating::DECIMAL), 0)
      FROM supplier_reviews
      WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM supplier_reviews
      WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
    )
  WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supplier_reviews_rating_update ON supplier_reviews;
CREATE TRIGGER supplier_reviews_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON supplier_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rating();

ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- ============================================
-- 5. DELIVERY TABLES (Coletas e Entregas)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id TEXT NOT NULL,
  product_id UUID NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  picked_up_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'problem_reported')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, order_item_id, picked_up_by)
);

CREATE TABLE IF NOT EXISTS delivery_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_pickups_order_id ON delivery_pickups(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_pickups_supplier_id ON delivery_pickups(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_pickups_picked_up_by ON delivery_pickups(picked_up_by);
CREATE INDEX IF NOT EXISTS idx_delivery_pickups_status ON delivery_pickups(status);
CREATE INDEX IF NOT EXISTS idx_delivery_reports_order_id ON delivery_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reports_supplier_id ON delivery_reports(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reports_reported_by ON delivery_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_delivery_reports_status ON delivery_reports(status);

CREATE OR REPLACE FUNCTION update_delivery_pickups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_pickups_updated_at ON delivery_pickups;
CREATE TRIGGER delivery_pickups_updated_at
  BEFORE UPDATE ON delivery_pickups
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_pickups_updated_at();

CREATE OR REPLACE FUNCTION update_delivery_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS delivery_reports_updated_at ON delivery_reports;
CREATE TRIGGER delivery_reports_updated_at
  BEFORE UPDATE ON delivery_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_reports_updated_at();

-- ============================================
-- 6. FREIGHT QUOTES CACHE E ÍNDICES DE PERFORMANCE
-- ============================================
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

-- ============================================
-- 7. TAX DATA TABLES (Sistema de Impostos)
-- ============================================
CREATE TABLE IF NOT EXISTS tax_data_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  source_version TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_data_cache_expires_at_idx ON tax_data_cache (expires_at);

CREATE TABLE IF NOT EXISTS tax_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_sync_queue_status_run_after_idx ON tax_sync_queue (status, run_after);

CREATE TABLE IF NOT EXISTS tax_data_versions (
  name TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. TAX RULE TABLES (Regras de Impostos)
-- ============================================
CREATE TABLE IF NOT EXISTS tax_ipi_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ncm TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATE,
  valid_to DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_ipi_rates_ncm_active_idx ON tax_ipi_rates (ncm, is_active);

CREATE TABLE IF NOT EXISTS tax_iss_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_ibge TEXT NOT NULL,
  service_code TEXT,
  rate NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_iss_rates_city_active_idx ON tax_iss_rates (city_ibge, is_active);

CREATE TABLE IF NOT EXISTS tax_st_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_state TEXT,
  destination_state TEXT NOT NULL,
  ncm TEXT NOT NULL,
  cest TEXT,
  mva NUMERIC NOT NULL,
  internal_rate NUMERIC NOT NULL,
  interstate_rate NUMERIC,
  fcp_rate NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATE,
  valid_to DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_st_rules_lookup_idx ON tax_st_rules (destination_state, ncm, cest, is_active);

-- ============================================
-- 9. TAX CALCULATION HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS tax_calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_hash TEXT NOT NULL,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  data_versions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tax_calculation_history_created_at_idx ON tax_calculation_history (created_at);
CREATE INDEX IF NOT EXISTS tax_calculation_history_request_hash_idx ON tax_calculation_history (request_hash);

-- ============================================
-- 10. TRACKING EVENTS (Rastreamento de eventos)
-- ============================================
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  session_id TEXT NOT NULL,
  ip_address INET,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  device_type TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tracking_events_event_type_idx ON tracking_events (event_type);
CREATE INDEX IF NOT EXISTS tracking_events_user_id_idx ON tracking_events (user_id);
CREATE INDEX IF NOT EXISTS tracking_events_session_id_idx ON tracking_events (session_id);
CREATE INDEX IF NOT EXISTS tracking_events_created_at_idx ON tracking_events (created_at);
CREATE INDEX IF NOT EXISTS tracking_events_is_bot_idx ON tracking_events (is_bot);

-- ============================================
-- 11. TRACKING AGGREGATES (Views de agregação)
-- ============================================
CREATE OR REPLACE VIEW tracking_events_daily_aggregate AS
SELECT
  date_trunc('day', created_at) AS date,
  event_type,
  user_id,
  device_type,
  count(*)::BIGINT AS total
FROM tracking_events
WHERE is_bot = FALSE
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW tracking_events_hourly_aggregate AS
SELECT
  date_trunc('hour', created_at) AS date,
  event_type,
  device_type,
  count(*)::BIGINT AS total
FROM tracking_events
WHERE is_bot = FALSE
GROUP BY 1, 2, 3;

-- ============================================
-- 12. WEATHER MARKETING TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS weather_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  condition TEXT,
  humidity DOUBLE PRECISION,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_location ON weather_snapshots(location);
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_snapshot_date ON weather_snapshots(snapshot_date);

CREATE TABLE IF NOT EXISTS weather_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  min_temp FLOAT,
  max_temp FLOAT,
  condition_trigger TEXT,
  action_metadata JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_rules_active ON weather_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_weather_rules_priority ON weather_rules(priority);

-- Insert default weather rules
INSERT INTO weather_rules (rule_name, min_temp, max_temp, condition_trigger, action_metadata, priority) VALUES
  ('Heavy Winter', NULL, 15, NULL, '{"tags": ["heavy_winter"], "categories": ["Casacos", "Blusas de Lã"]}', 10),
  ('Light Winter', 15, 20, NULL, '{"tags": ["light_winter"], "categories": ["Cardigans", "Jaquetas"]}', 8),
  ('Rainy Day', NULL, NULL, 'Rain', '{"tags": ["rainy_day"], "categories": ["Botas", "Impermeáveis"]}', 9),
  ('Summer Vibe', 28, NULL, NULL, '{"tags": ["summer_vibe"], "categories": ["Vestidos", "Biquínis"]}', 10),
  ('Warm Weather', 25, 28, NULL, '{"tags": ["warm_weather"], "categories": ["Camisetas", "Shorts"]}', 7),
  ('Sunny Day', NULL, NULL, 'Clear', '{"tags": ["sunny_day"], "categories": ["Óculos", "Chapéus"]}', 6)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  target_segments JSONB DEFAULT '{}',
  weather_conditions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_tags ON campaigns USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);

CREATE TABLE IF NOT EXISTS user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
  source TEXT NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag ON user_tags(tag);
CREATE INDEX IF NOT EXISTS idx_user_tags_score ON user_tags(score);
CREATE INDEX IF NOT EXISTS idx_user_tags_last_seen ON user_tags(last_seen_at);

CREATE TABLE IF NOT EXISTS campaign_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  interaction_type TEXT NOT NULL,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_interactions_campaign_id ON campaign_interactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_user_id ON campaign_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_type ON campaign_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_campaign_interactions_source ON campaign_interactions(source);

-- Function to apply tag decay automatically
CREATE OR REPLACE FUNCTION apply_tag_decay()
RETURNS VOID AS $$
BEGIN
  UPDATE user_tags
  SET
    score = score * POWER(0.8, EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / (7 * 24 * 3600)),
    updated_at = NOW()
  WHERE
    last_seen_at < NOW() - INTERVAL '90 days'
    AND score > 0.1;

  DELETE FROM user_tags WHERE score < 0.1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. AFFILIATE CODE TO PROFILES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON public.profiles(affiliate_code) WHERE affiliate_code IS NOT NULL;

COMMENT ON COLUMN public.profiles.affiliate_code IS 'Unique affiliate code for referral program';

-- ============================================
-- 14. MISSING PERFORMANCE INDEXES
-- ============================================
-- PRODUCT VARIANTS
CREATE INDEX IF NOT EXISTS idx_product_variants_sku
ON public.product_variants (sku);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
ON public.product_variants (product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_active
ON public.product_variants (is_active);

-- COUPONS
CREATE INDEX IF NOT EXISTS idx_coupons_code
ON public.coupons (code);

CREATE INDEX IF NOT EXISTS idx_coupons_active_valid
ON public.coupons (is_active, valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_user
ON public.coupon_usage (coupon_id, user_id);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user
ON public.coupon_usage (user_id);

-- WISHLIST
CREATE INDEX IF NOT EXISTS idx_wishlist_user_product
ON public.wishlist (user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_share_slug
ON public.wishlist (share_slug);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id
ON public.wishlist (user_id);

-- PRODUCT REVIEWS
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created
ON public.product_reviews (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_user_created
ON public.product_reviews (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_reviews_order
ON public.product_reviews (order_id);

CREATE INDEX IF NOT EXISTS idx_product_review_helpful_review_user
ON public.product_review_helpful (review_id, user_id);

-- CART SESSIONS
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id
ON public.cart_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires_at
ON public.cart_sessions (expires_at);

-- ADDRESSES
CREATE INDEX IF NOT EXISTS idx_addresses_user_id
ON public.addresses (user_id);

CREATE INDEX IF NOT EXISTS idx_addresses_user_default
ON public.addresses (user_id, is_default);

-- ORDERS
CREATE INDEX IF NOT EXISTS idx_orders_status
ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON public.orders (status, created_at DESC);

-- COLLECTION PRODUCTS
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id
ON public.collection_products (product_id);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id
ON public.collection_products (collection_id);

-- PRODUCTS
CREATE INDEX IF NOT EXISTS idx_products_is_active
ON public.products (is_active);

CREATE INDEX IF NOT EXISTS idx_products_category
ON public.products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_supplier
ON public.products (supplier_id);

-- USER PAYMENT METHODS
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id
ON public.user_payment_methods (user_id);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_default
ON public.user_payment_methods (user_id, is_default);

-- ORDER STATUS HISTORY
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created
ON public.order_status_history (order_id, created_at DESC);

-- NOTIFICATIONS
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON public.notifications (user_id, is_read);

-- ============================================
-- FIM DAS MIGRAÇÕES
-- ============================================
-- Total: 14 migrações consolidadas
-- Tabelas criadas: ~25
-- Índices criados: ~80+
-- Functions/Triggers: ~15
-- ============================================
