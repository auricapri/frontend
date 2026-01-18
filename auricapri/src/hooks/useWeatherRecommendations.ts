import { useState, useEffect } from 'react';
import { weatherService, WeatherRecommendation } from '../services/weather.service';

export function useWeatherRecommendations() {
  const [recommendations, setRecommendations] = useState<WeatherRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRecommendations() {
      setIsLoading(true);
      setError(null);

      try {
        // First try to get geolocation
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            if (!mounted) return;
            const { latitude, longitude } = position.coords;
            const data = await weatherService.getRecommendations(latitude, longitude);
            if (mounted) {
              setRecommendations(data);
              setIsLoading(false);
            }
          },
          (err) => {
            if (mounted) {
              console.warn('Geolocation access denied or failed', err);
              setError('Could not access your location for personalized weather content');
              setIsLoading(false);
            }
          }
        );
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      mounted = false;
    };
  }, []);

  return { recommendations, isLoading, error };
}
