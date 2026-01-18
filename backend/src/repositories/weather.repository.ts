import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

export interface WeatherSnapshot {
  id?: string;
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  condition: string;
  humidity: number | null;
  snapshot_date?: string;
}

export interface WeatherRule {
  id: string;
  rule_name: string;
  min_temp: number | null;
  max_temp: number | null;
  condition_trigger: string | null;
  action_metadata: {
    tags?: string[];
    categories?: string[];
    banner_id?: string;
  };
  priority: number;
  is_active: boolean;
}

export class WeatherRepository {
  async saveSnapshot(snapshot: WeatherSnapshot): Promise<void> {
    try {
      const { error } = await supabase
        .from('weather_snapshots')
        .insert([snapshot]);

      if (error) throw error;
    } catch (error) {
      logger.error('Error saving weather snapshot', { error });
    }
  }

  async getLatestByLocation(location: string): Promise<WeatherSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('weather_snapshots')
        .select('*')
        .eq('location', location)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      logger.error('Error getting latest weather snapshot', { location, error });
      return null;
    }
  }

  async getHistoricalData(location: string, days: number): Promise<WeatherSnapshot[]> {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - days);

      const { data, error } = await supabase
        .from('weather_snapshots')
        .select('*')
        .eq('location', location)
        .gte('snapshot_date', dateLimit.toISOString())
        .order('snapshot_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting historical weather data', { location, days, error });
      return [];
    }
  }

  async getActiveRules(): Promise<WeatherRule[]> {
    try {
      const { data, error } = await supabase
        .from('weather_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting active weather rules', { error });
      return [];
    }
  }
}

let singleton: WeatherRepository | null = null;
export function getWeatherRepository(): WeatherRepository {
  if (!singleton) singleton = new WeatherRepository();
  return singleton;
}
