-- Add gender column to products table
-- gender: enum for filtering products by target audience (default: female)

ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'female'
  CHECK (gender IN ('female', 'male', 'unisex'));

-- Update existing products to have gender = 'female' (default)
UPDATE products SET gender = 'female' WHERE gender IS NULL;

COMMENT ON COLUMN products.gender IS 'Target audience: female, male, or unisex. Used for filtering in UI.';
