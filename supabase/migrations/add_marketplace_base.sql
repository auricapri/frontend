-- Migration: Base Marketplace Integration Tables
-- This migration creates the foundation tables for marketplace integration

-- ============================================
-- MARKETPLACE PROVIDERS
-- ============================================

-- Marketplace providers (e.g., Mercado Livre, Shopee, etc.)
CREATE TABLE IF NOT EXISTS public.marketplace_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- e.g., 'mercado-livre', 'shopee'
    name TEXT NOT NULL,
    logo_url TEXT,
    base_url TEXT NOT NULL,
    auth_type TEXT NOT NULL DEFAULT 'oauth2', -- oauth2, api_key, bearer
    required_fields JSONB, -- { fields: [...], oauth: { auth_url, token_url, scopes } }
    commission_default NUMERIC(5,2),
    documentation_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE CONFIGS
-- ============================================

-- Configuration for each marketplace connection
CREATE TABLE IF NOT EXISTS public.marketplace_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.marketplace_providers(id) ON DELETE CASCADE,
    environment TEXT DEFAULT 'production', -- sandbox, production
    credentials_encrypted TEXT, -- encrypted app_id, client_secret, etc.
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    ml_user_id TEXT, -- Mercado Livre user ID (for webhook matching)
    commission_override NUMERIC(5,2),
    price_markup_percent NUMERIC(5,2) DEFAULT 0,
    auto_sync_stock BOOLEAN DEFAULT true,
    auto_sync_price BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 30,
    last_sync_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, connected, disconnected, error
    status_message TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, environment)
);

-- ============================================
-- MARKETPLACE PRODUCT MAPPINGS
-- ============================================

-- Mapping between local products and marketplace listings
CREATE TABLE IF NOT EXISTS public.marketplace_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    external_product_id TEXT, -- ID in the marketplace
    external_sku TEXT,
    external_url TEXT,
    marketplace_price NUMERIC(12,2),
    marketplace_stock INTEGER,
    sync_status TEXT DEFAULT 'pending', -- pending, synced, error, paused
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(config_id, product_id, variant_id)
);

-- ============================================
-- MARKETPLACE SYNC LOGS
-- ============================================

-- Log of all sync operations
CREATE TABLE IF NOT EXISTS public.marketplace_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID REFERENCES public.marketplace_configs(id) ON DELETE CASCADE,
    mapping_id UUID REFERENCES public.marketplace_product_mappings(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- create_product, update_product, delete_product, update_stock, update_price, sync_orders, test_connection, refresh_token, answer_question, update_shipment
    status TEXT NOT NULL, -- success, error, partial
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marketplace_configs_provider ON public.marketplace_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_configs_status ON public.marketplace_configs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_configs_ml_user ON public.marketplace_configs(ml_user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_config ON public.marketplace_product_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_product ON public.marketplace_product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_external ON public.marketplace_product_mappings(external_product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_status ON public.marketplace_product_mappings(sync_status);

CREATE INDEX IF NOT EXISTS idx_marketplace_logs_config ON public.marketplace_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_mapping ON public.marketplace_sync_logs(mapping_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_action ON public.marketplace_sync_logs(action);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_created ON public.marketplace_sync_logs(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_marketplace_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_providers_updated_at ON public.marketplace_providers;
CREATE TRIGGER trigger_marketplace_providers_updated_at
    BEFORE UPDATE ON public.marketplace_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_providers_updated_at();

CREATE OR REPLACE FUNCTION update_marketplace_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_configs_updated_at ON public.marketplace_configs;
CREATE TRIGGER trigger_marketplace_configs_updated_at
    BEFORE UPDATE ON public.marketplace_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_configs_updated_at();

CREATE OR REPLACE FUNCTION update_marketplace_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_mappings_updated_at ON public.marketplace_product_mappings;
CREATE TRIGGER trigger_marketplace_mappings_updated_at
    BEFORE UPDATE ON public.marketplace_product_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_mappings_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.marketplace_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sync_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage marketplace providers" ON public.marketplace_providers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can manage marketplace configs" ON public.marketplace_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can manage marketplace mappings" ON public.marketplace_product_mappings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Admins can view sync logs" ON public.marketplace_sync_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

-- Service role bypass policies
CREATE POLICY "Service role can access marketplace providers" ON public.marketplace_providers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access marketplace configs" ON public.marketplace_configs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access marketplace mappings" ON public.marketplace_product_mappings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access sync logs" ON public.marketplace_sync_logs
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED DATA: MERCADO LIVRE PROVIDER
-- ============================================

INSERT INTO public.marketplace_providers (
    code,
    name,
    logo_url,
    base_url,
    auth_type,
    required_fields,
    commission_default,
    documentation_url,
    is_active
) VALUES (
    'mercado-livre',
    'Mercado Livre',
    'https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years@2x.png',
    'https://api.mercadolibre.com',
    'oauth2',
    '{
        "fields": [
            {"key": "app_id", "label": "App ID", "type": "text", "required": true},
            {"key": "client_secret", "label": "Client Secret", "type": "password", "required": true}
        ],
        "oauth": {
            "auth_url": "https://auth.mercadolivre.com.br/authorization",
            "token_url": "https://api.mercadolibre.com/oauth/token",
            "scopes": ["offline_access", "read", "write"]
        }
    }'::jsonb,
    11.0,
    'https://developers.mercadolivre.com.br/',
    true
) ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    base_url = EXCLUDED.base_url,
    auth_type = EXCLUDED.auth_type,
    required_fields = EXCLUDED.required_fields,
    commission_default = EXCLUDED.commission_default,
    documentation_url = EXCLUDED.documentation_url,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Seed other providers as inactive (coming soon)
INSERT INTO public.marketplace_providers (code, name, logo_url, base_url, auth_type, is_active) VALUES
    ('shopee', 'Shopee', 'https://cf.shopee.com.br/file/br-50009109-f6d79dbc4021a3eb57f61ffe2c1bfbda_xhdpi', 'https://partner.shopeemobile.com', 'oauth2', false),
    ('aliexpress', 'AliExpress', 'https://ae01.alicdn.com/kf/S7aca51d4a3d54c1d89e1f50b6c1c1c1cT.png', 'https://api.aliexpress.com', 'oauth2', false),
    ('temu', 'Temu', 'https://aimg.kwcdn.com/upload_aimg/temu/da515ef6-a498-4ef3-9823-e1e53a10be5b.png', 'https://api.temu.com', 'api_key', false),
    ('alibaba', 'Alibaba', 'https://s.alicdn.com/@img/imgextra/i1/O1CN01AKUdEM1bz7VDjldnS_!!6000000003535-2-tps-160-64.png', 'https://api.alibaba.com', 'oauth2', false)
ON CONFLICT (code) DO NOTHING;
