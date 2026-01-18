-- Migration: Create product_image_hotspots table for shoppable images
-- This table stores interactive hotspots on product images that link to other product variants

-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS public.product_image_hotspots CASCADE;

-- Create the table with correct types
CREATE TABLE public.product_image_hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    x_percent DECIMAL(5,2) NOT NULL CHECK (x_percent >= 0 AND x_percent <= 100),
    y_percent DECIMAL(5,2) NOT NULL CHECK (y_percent >= 0 AND y_percent <= 100),
    linked_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    label JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hotspots_product_id ON public.product_image_hotspots(product_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_image_url ON public.product_image_hotspots(product_id, image_url);
CREATE INDEX IF NOT EXISTS idx_hotspots_linked_variant ON public.product_image_hotspots(linked_variant_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_active ON public.product_image_hotspots(product_id, is_active);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_hotspots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hotspots_updated_at ON public.product_image_hotspots;
CREATE TRIGGER trigger_hotspots_updated_at
    BEFORE UPDATE ON public.product_image_hotspots
    FOR EACH ROW
    EXECUTE FUNCTION update_hotspots_updated_at();

-- Enable RLS
ALTER TABLE public.product_image_hotspots ENABLE ROW LEVEL SECURITY;

-- Policy for public read (active hotspots only)
DROP POLICY IF EXISTS "Public can view active hotspots" ON public.product_image_hotspots;
CREATE POLICY "Public can view active hotspots"
    ON public.product_image_hotspots
    FOR SELECT
    USING (is_active = true);

-- Policy for authenticated admin users to manage hotspots
DROP POLICY IF EXISTS "Admins can manage hotspots" ON public.product_image_hotspots;
CREATE POLICY "Admins can manage hotspots"
    ON public.product_image_hotspots
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Grant permissions
GRANT SELECT ON public.product_image_hotspots TO anon;
GRANT ALL ON public.product_image_hotspots TO authenticated;

-- Add comment
COMMENT ON TABLE public.product_image_hotspots IS 'Stores interactive hotspots on product images that link to other product variants (shoppable images)';
