-- Add icon and gender columns to categories table
-- icon: optional lucide icon name (e.g., "Shirt", "Watch", "Gem")
-- gender: enum for filtering products by target audience (default: female)

ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'female'
  CHECK (gender IN ('female', 'male', 'unisex'));

-- Update existing categories to have gender = 'female' (default)
UPDATE categories SET gender = 'female' WHERE gender IS NULL;

COMMENT ON COLUMN categories.icon IS 'Lucide icon name for sidebar display (e.g., Shirt, Watch, Gem)';
COMMENT ON COLUMN categories.gender IS 'Target audience: female, male, or unisex. Used for filtering in UI.';
