-- ============================================
-- Migration: Sistema de Integração Multi-Marketplace
-- Data: 16 de Janeiro de 2026
-- Descrição: Cria tabelas para integração com marketplaces externos
--
-- IMPORTANTE: Execute este script completo no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/zbrunudbdyuebtpxfnkd/sql/new
-- ============================================

-- =============================================
-- PARTE 1: CRIAR TABELAS
-- =============================================

-- Tabela de providers disponíveis (seed data)
CREATE TABLE IF NOT EXISTS marketplace_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  logo_url VARCHAR(500),
  base_url VARCHAR(500) NOT NULL,
  auth_type VARCHAR(50) NOT NULL,
  required_fields JSONB NOT NULL,
  commission_default DECIMAL(5,2),
  documentation_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações por marketplace (credenciais criptografadas)
CREATE TABLE IF NOT EXISTS marketplace_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  environment VARCHAR(20) DEFAULT 'sandbox',
  credentials_encrypted TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  commission_override DECIMAL(5,2),
  price_markup_percent DECIMAL(5,2) DEFAULT 0,
  auto_sync_stock BOOLEAN DEFAULT true,
  auto_sync_price BOOLEAN DEFAULT true,
  sync_interval_minutes INT DEFAULT 30,
  last_sync_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'disconnected',
  status_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id)
);

-- Tabela de mapeamento de produtos locais para produtos externos
-- NOTA: product_id é TEXT (não UUID) porque products.id é TEXT
--       variant_id é UUID porque product_variants.id é UUID
CREATE TABLE IF NOT EXISTS marketplace_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES marketplace_configs(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  external_product_id VARCHAR(100),
  external_sku VARCHAR(100),
  external_url VARCHAR(500),
  marketplace_price DECIMAL(10,2),
  marketplace_stock INT,
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(config_id, product_id, variant_id)
);

-- Tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES marketplace_configs(id) ON DELETE CASCADE,
  mapping_id UUID REFERENCES marketplace_product_mappings(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PARTE 2: ÍNDICES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_marketplace_configs_provider ON marketplace_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_configs_status ON marketplace_configs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_config ON marketplace_product_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_product ON marketplace_product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_variant ON marketplace_product_mappings(variant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_sync_status ON marketplace_product_mappings(sync_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_config ON marketplace_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_mapping ON marketplace_sync_logs(mapping_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_action ON marketplace_sync_logs(action);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_status ON marketplace_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_created ON marketplace_sync_logs(created_at DESC);

-- =============================================
-- PARTE 3: TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_configs_updated ON marketplace_configs;
CREATE TRIGGER trigger_marketplace_configs_updated
  BEFORE UPDATE ON marketplace_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

DROP TRIGGER IF EXISTS trigger_marketplace_mappings_updated ON marketplace_product_mappings;
CREATE TRIGGER trigger_marketplace_mappings_updated
  BEFORE UPDATE ON marketplace_product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

-- =============================================
-- PARTE 4: ROW LEVEL SECURITY
-- =============================================

ALTER TABLE marketplace_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;

-- Providers: qualquer usuário autenticado pode ler
DROP POLICY IF EXISTS marketplace_providers_select ON marketplace_providers;
CREATE POLICY marketplace_providers_select ON marketplace_providers
  FOR SELECT TO authenticated USING (true);

-- Configs: apenas admin
DROP POLICY IF EXISTS marketplace_configs_admin ON marketplace_configs;
CREATE POLICY marketplace_configs_admin ON marketplace_configs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Mappings: apenas admin
DROP POLICY IF EXISTS marketplace_mappings_admin ON marketplace_product_mappings;
CREATE POLICY marketplace_mappings_admin ON marketplace_product_mappings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Logs: apenas admin
DROP POLICY IF EXISTS marketplace_logs_admin ON marketplace_sync_logs;
CREATE POLICY marketplace_logs_admin ON marketplace_sync_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Service role bypass (para o backend)
DROP POLICY IF EXISTS marketplace_configs_service ON marketplace_configs;
CREATE POLICY marketplace_configs_service ON marketplace_configs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS marketplace_mappings_service ON marketplace_product_mappings;
CREATE POLICY marketplace_mappings_service ON marketplace_product_mappings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS marketplace_logs_service ON marketplace_sync_logs;
CREATE POLICY marketplace_logs_service ON marketplace_sync_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- PARTE 5: SEED DATA - PROVIDERS
-- =============================================

DELETE FROM marketplace_providers WHERE code IN (
  'mercado_livre', 'shopee', 'aliexpress', 'temu', 'amazon', 'magalu', 'americanas', 'shein'
);

INSERT INTO marketplace_providers (code, name, logo_url, base_url, auth_type, required_fields, commission_default, documentation_url, is_active) VALUES
('mercado_livre', 'Mercado Livre', 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.5/mercadolibre/logo__large_plus.png', 'https://api.mercadolibre.com', 'oauth2', '{"fields": [{"key": "client_id", "label": "App ID", "type": "text", "required": true, "help": "ID da aplicação no Portal de Desenvolvedores"}, {"key": "client_secret", "label": "Secret Key", "type": "password", "required": true, "help": "Chave secreta da aplicação"}, {"key": "redirect_uri", "label": "Redirect URI", "type": "text", "required": true, "help": "URL de callback OAuth"}], "oauth": {"auth_url": "https://auth.mercadolivre.com.br/authorization", "token_url": "https://api.mercadolibre.com/oauth/token", "scopes": ["read", "write", "offline_access"]}}', 11.00, 'https://developers.mercadolivre.com.br', true),
('shopee', 'Shopee', 'https://cf.shopee.com.br/file/br-50009109-7f13e0e6e0e0e0e0e0e0e0e0e0e0e0e0', 'https://partner.shopeemobile.com', 'oauth2', '{"fields": [{"key": "partner_id", "label": "Partner ID", "type": "text", "required": true, "help": "ID do parceiro fornecido pela Shopee"}, {"key": "partner_key", "label": "Partner Key", "type": "password", "required": true, "help": "Chave secreta do parceiro"}, {"key": "shop_id", "label": "Shop ID", "type": "text", "required": true, "help": "ID da loja na Shopee"}], "oauth": {"auth_url": "https://partner.shopeemobile.com/api/v2/shop/auth_partner", "token_url": "https://partner.shopeemobile.com/api/v2/auth/token/get", "scopes": []}}', 12.00, 'https://open.shopee.com/documents', true),
('aliexpress', 'AliExpress', 'https://ae01.alicdn.com/kf/S4c50e0e0e0e0e0e0e0e0e0e0e0e0e0e0.png', 'https://api-sg.aliexpress.com', 'api_key', '{"fields": [{"key": "app_key", "label": "App Key", "type": "text", "required": true, "help": "App Key da aplicação"}, {"key": "app_secret", "label": "App Secret", "type": "password", "required": true, "help": "Secret da aplicação"}, {"key": "access_token", "label": "Access Token", "type": "password", "required": true, "help": "Token de acesso"}], "oauth": null}', 8.00, 'https://developers.aliexpress.com', true),
('temu', 'Temu', 'https://aimg.kwcdn.com/upload_aimg/web/logo.png', 'https://openapi.temu.com', 'api_key', '{"fields": [{"key": "api_key", "label": "API Key", "type": "password", "required": true, "help": "Chave de API fornecida pela Temu"}, {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do vendedor na plataforma"}], "oauth": null}', 15.00, 'https://seller.temu.com', true),
('amazon', 'Amazon', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'https://sellingpartnerapi-sa-east-1.amazon.com', 'oauth2', '{"fields": [{"key": "client_id", "label": "LWA Client ID", "type": "text", "required": true, "help": "Client ID do Login with Amazon"}, {"key": "client_secret", "label": "LWA Client Secret", "type": "password", "required": true, "help": "Client Secret do LWA"}, {"key": "refresh_token", "label": "Refresh Token", "type": "password", "required": true, "help": "Token de atualização da SP-API"}, {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do vendedor na Amazon"}], "oauth": {"auth_url": "https://sellercentral.amazon.com.br/apps/authorize/consent", "token_url": "https://api.amazon.com/auth/o2/token", "scopes": []}}', 15.00, 'https://developer-docs.amazon.com/sp-api/', true),
('magalu', 'Magazine Luiza', 'https://logodownload.org/wp-content/uploads/2014/06/magalu-logo.png', 'https://api.magalu.com', 'api_key', '{"fields": [{"key": "api_key", "label": "API Key", "type": "password", "required": true, "help": "Chave de API do Magalu Marketplace"}, {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do seller na plataforma"}], "oauth": null}', 16.00, 'https://dev.magalu.com/', true),
('americanas', 'Americanas', 'https://logodownload.org/wp-content/uploads/2019/08/americanas-logo.png', 'https://api-marketplace.americanas.com', 'api_key', '{"fields": [{"key": "app_token", "label": "App Token", "type": "password", "required": true, "help": "Token da aplicação B2W"}, {"key": "seller_id", "label": "Seller ID", "type": "text", "required": true, "help": "ID do vendedor no marketplace"}], "oauth": null}', 16.00, 'https://developers.americanas.io/', true),
('shein', 'SHEIN', 'https://img.ltwebstatic.com/images3_pi/2021/06/23/16244097066e0e0e0e0e0e0e0e0e0e0e.png', 'https://openapi.shein.com', 'api_key', '{"fields": [{"key": "app_key", "label": "App Key", "type": "text", "required": true, "help": "App Key do Seller Center"}, {"key": "app_secret", "label": "App Secret", "type": "password", "required": true, "help": "Secret do Seller Center"}, {"key": "access_token", "label": "Access Token", "type": "password", "required": true, "help": "Token de acesso"}], "oauth": null}', 20.00, 'https://sellercenter.shein.com/', true);

-- =============================================
-- VERIFICAÇÃO
-- =============================================

SELECT code, name, commission_default FROM marketplace_providers ORDER BY name;
