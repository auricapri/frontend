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

CREATE TRIGGER delivery_reports_updated_at
  BEFORE UPDATE ON delivery_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_reports_updated_at();
