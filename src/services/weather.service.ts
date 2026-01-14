const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export interface WeatherData {
  temperatureC: number;
  weatherCode: number;
  windSpeedKmh: number;
  humidityPercent: number | null;
}

export interface WeatherRecommendation {
  weather: WeatherData;
  categories: string[];
  products: any[];
  banner_id?: string;
  tags: string[];
}

export class WeatherService {
  async getRecommendations(lat: number, lon: number): Promise<WeatherRecommendation | null> {
    try {
      const response = await fetch(`${API_URL}/weather/recommendations?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error('Failed to fetch weather recommendations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather recommendations:', error);
      return null;
    }
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const response = await fetch(`${API_URL}/weather/current?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error('Failed to fetch current weather');
      return await response.json();
    } catch (error) {
      console.error('Error fetching current weather:', error);
      return null;
    }
  }
}

export const weatherService = new WeatherService();
