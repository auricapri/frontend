-- Migration: Add Marketplace Variations Support
-- This migration adds support for:
-- 1. ML variations (external_variation_id)
-- 2. Custom marketplace descriptions per product
-- 3. Category fees cache for dynamic pricing

-- ============================================
-- 1. ADD EXTERNAL VARIATION ID TO MAPPINGS
-- ============================================

-- Add external_variation_id for tracking ML variation IDs
ALTER TABLE public.marketplace_product_mappings
ADD COLUMN IF NOT EXISTS external_variation_id TEXT;

-- Index for faster lookup by variation
CREATE INDEX IF NOT EXISTS idx_marketplace_mappings_variation
ON public.marketplace_product_mappings(external_variation_id);

-- ============================================
-- 2. ADD MARKETPLACE DESCRIPTIONS TO PRODUCTS
-- ============================================

-- Add marketplace-specific descriptions to products
-- Structure: { "mercado_livre": "Description for ML...", "tiktok_shop": "..." }
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS marketplace_descriptions JSONB DEFAULT '{}';

-- ============================================
-- 3. ADD ML CATEGORY TO CONFIGS
-- ============================================

-- Add category ID for fee calculations
ALTER TABLE public.marketplace_configs
ADD COLUMN IF NOT EXISTS ml_category_id TEXT;

-- ============================================
-- 4. MARKETPLACE CATEGORY FEES TABLE
-- ============================================

-- Cache table for marketplace category fees (updated daily)
CREATE TABLE IF NOT EXISTS public.marketplace_category_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT,
    listing_type TEXT DEFAULT 'gold_special', -- free, classic, gold_special
    listing_fee NUMERIC(10,2) DEFAULT 0,
    sales_commission_percent NUMERIC(5,2) NOT NULL,
    variation_commission_percent NUMERIC(5,2), -- Some categories have different rates for variations
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_code, category_id, listing_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_category_fees_provider
ON public.marketplace_category_fees(provider_code);

CREATE INDEX IF NOT EXISTS idx_category_fees_category
ON public.marketplace_category_fees(category_id);

-- RLS for category fees
ALTER TABLE public.marketplace_category_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage category fees" ON public.marketplace_category_fees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "Service role can access category fees" ON public.marketplace_category_fees
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 5. UPDATE MERCADO LIVRE PROVIDER CODE
-- ============================================

-- Fix provider code from 'mercado-livre' to 'mercado_livre' if needed
UPDATE public.marketplace_providers
SET code = 'mercado_livre'
WHERE code = 'mercado-livre';

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON public.marketplace_category_fees TO authenticated;
GRANT ALL ON public.marketplace_category_fees TO service_role;
