-- ============================================
-- PATCH: Tabelas faltantes do Marketplace
-- Execute apenas se marketplace_providers e marketplace_configs já existem
-- ============================================

-- Tabela de mapeamento de produtos locais para produtos externos
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

-- Índices para as novas tabelas
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_config ON marketplace_product_mappings(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_product ON marketplace_product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_variant ON marketplace_product_mappings(variant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_sync_status ON marketplace_product_mappings(sync_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_config ON marketplace_sync_logs(config_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_mapping ON marketplace_sync_logs(mapping_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_action ON marketplace_sync_logs(action);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_status ON marketplace_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_logs_created ON marketplace_sync_logs(created_at DESC);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_mappings_updated ON marketplace_product_mappings;
CREATE TRIGGER trigger_marketplace_mappings_updated
  BEFORE UPDATE ON marketplace_product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

-- RLS
ALTER TABLE marketplace_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para mappings
DROP POLICY IF EXISTS marketplace_mappings_admin ON marketplace_product_mappings;
CREATE POLICY marketplace_mappings_admin ON marketplace_product_mappings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS marketplace_mappings_service ON marketplace_product_mappings;
CREATE POLICY marketplace_mappings_service ON marketplace_product_mappings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Políticas para logs
DROP POLICY IF EXISTS marketplace_logs_admin ON marketplace_sync_logs;
CREATE POLICY marketplace_logs_admin ON marketplace_sync_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS marketplace_logs_service ON marketplace_sync_logs;
CREATE POLICY marketplace_logs_service ON marketplace_sync_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verificação
SELECT 'marketplace_product_mappings' as tabela, COUNT(*) as registros FROM marketplace_product_mappings
UNION ALL
SELECT 'marketplace_sync_logs' as tabela, COUNT(*) as registros FROM marketplace_sync_logs;
