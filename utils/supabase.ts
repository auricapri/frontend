
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client initialization.
 * Using static credentials for reliability in this specific container environment.
 */
const supabaseUrl = 'https://zbrunudbdyuebtpxfnkd.supabase.co';
const supabaseKey = 'sb_publishable_x5fb1BLl1KN851qTDOgjPg_59DeZfwU';

export const supabase = createClient(supabaseUrl, supabaseKey);
