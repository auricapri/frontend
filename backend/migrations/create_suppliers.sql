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

CREATE TRIGGER supplier_reviews_rating_update
  AFTER INSERT OR UPDATE OR DELETE ON supplier_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rating();

ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
