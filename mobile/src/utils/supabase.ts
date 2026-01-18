import { createClient } from "@supabase/supabase-js";
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase client initialization.
 * Using static credentials for reliability in this specific container environment.
 * Configured for React Native compatibility.
 * 
 * NOTE: URL polyfill must be loaded in index.js before this module is imported
 */
const supabaseUrl = 'https://zbrunudbdyuebtpxfnkd.supabase.co';
const supabaseKey = 'sb_publishable_x5fb1BLl1KN851qTDOgjPg_59DeZfwU';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'auricapri-mobile',
    },
  },
});

