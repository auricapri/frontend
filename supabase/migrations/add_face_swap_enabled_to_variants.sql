-- Add face_swap_enabled column to product_variants table
-- This enables the virtual try-on feature for specific product variants

ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS face_swap_enabled BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN product_variants.face_swap_enabled IS 'Enable virtual try-on (face swap) feature for this variant';
