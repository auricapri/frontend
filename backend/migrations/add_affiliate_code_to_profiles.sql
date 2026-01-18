-- Migration: Add affiliate_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_affiliate_code ON public.profiles(affiliate_code) WHERE affiliate_code IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.affiliate_code IS 'Unique affiliate code for referral program';
