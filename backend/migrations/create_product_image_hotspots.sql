-- Migration: Create product_image_hotspots table
-- Description: Stores interactive hotspots on product images that link to other product variants

CREATE TABLE IF NOT EXISTS product_image_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  x_percent NUMERIC(5,2) NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
  y_percent NUMERIC(5,2) NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
  linked_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  label JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_hotspots_product_id ON product_image_hotspots(product_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_image_url ON product_image_hotspots(image_url);
CREATE INDEX IF NOT EXISTS idx_hotspots_active ON product_image_hotspots(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hotspots_linked_variant ON product_image_hotspots(linked_variant_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_product_image_hotspots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_image_hotspots_updated_at ON product_image_hotspots;
CREATE TRIGGER product_image_hotspots_updated_at
  BEFORE UPDATE ON product_image_hotspots
  FOR EACH ROW
  EXECUTE FUNCTION update_product_image_hotspots_updated_at();

-- Enable RLS
ALTER TABLE product_image_hotspots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read active hotspots (for frontend display)
CREATE POLICY "Anyone can read active hotspots"
  ON product_image_hotspots FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage hotspots"
  ON product_image_hotspots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
