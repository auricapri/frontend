import { getWeatherRepository, WeatherRule } from '../repositories/weather.repository.js';
import { WeatherData } from './weather.service.js';
import { getProductsRepository } from '../repositories/products.repository.js';
import logger from '../config/logger.js';

export interface WeatherRecommendation {
  categories: string[];
  products: any[];
  banner_id?: string;
  tags: string[];
}

export class WeatherPersonalizationService {
  private weatherRepo = getWeatherRepository();
  private productsRepo = getProductsRepository();

  async getRecommendations(weather: WeatherData): Promise<WeatherRecommendation> {
    try {
      const activeRules = await this.weatherRepo.getActiveRules();
      const matchingRules = this.findMatchingRules(weather, activeRules);

      const recommendation: WeatherRecommendation = {
        categories: [],
        products: [],
        tags: []
      };

      for (const rule of matchingRules) {
        if (rule.action_metadata.categories) {
          recommendation.categories.push(...rule.action_metadata.categories);
        }
        if (rule.action_metadata.tags) {
          recommendation.tags.push(...rule.action_metadata.tags);
        }
        if (rule.action_metadata.banner_id && !recommendation.banner_id) {
          recommendation.banner_id = rule.action_metadata.banner_id;
        }
      }

      // Remove duplicates
      recommendation.categories = [...new Set(recommendation.categories)];
      recommendation.tags = [...new Set(recommendation.tags)];

      // Fetch some recommended products based on categories
      if (recommendation.categories.length > 0) {
        // This is a simplified fetch, ideally would use a more specific method
        const products = await this.productsRepo.findAll({ 
          limit: 8 
        });
        // Filter products that belong to matching categories if possible
        // For now returning top products
        recommendation.products = products;
      }

      return recommendation;
    } catch (error) {
      logger.error('Error getting weather recommendations', { weather, error });
      return { categories: [], products: [], tags: [] };
    }
  }

  private findMatchingRules(weather: WeatherData, rules: WeatherRule[]): WeatherRule[] {
    return rules.filter(rule => {
      // Check temperature
      if (rule.min_temp !== null && weather.temperatureC < rule.min_temp) return false;
      if (rule.max_temp !== null && weather.temperatureC > rule.max_temp) return false;

      // Check condition (mapping open-meteo codes to strings if needed)
      // For now, rule.condition_trigger is a string like 'Rain', 'Clear', etc.
      if (rule.condition_trigger) {
        const condition = this.mapWeatherCodeToCondition(weather.weatherCode);
        if (condition !== rule.condition_trigger) return false;
      }

      return true;
    });
  }

  private mapWeatherCodeToCondition(code: number): string {
    // Open-Meteo WMO Weather interpretation codes
    if (code === 0) return 'Clear';
    if (code >= 1 && code <= 3) return 'Cloudy';
    if (code >= 51 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain';
    if (code >= 95) return 'Storm';
    return 'Other';
  }
}

let singleton: WeatherPersonalizationService | null = null;
export function getWeatherPersonalizationService(): WeatherPersonalizationService {
  if (!singleton) singleton = new WeatherPersonalizationService();
  return singleton;
}
