import React from 'react';
import { useWeatherRecommendations } from '../hooks/useWeatherRecommendations';
import { getOptimizedImageUrl } from '../utils/image';

const WeatherProductRecommendations: React.FC = () => {
  const { recommendations, isLoading } = useWeatherRecommendations();

  if (isLoading || !recommendations || recommendations.products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Recomendado para o clima atual
        </h2>
        <span className="text-sm text-gray-500 flex items-center gap-1">
          Baseado em {recommendations.weather.temperatureC}°C em sua região
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recommendations.products.slice(0, 4).map((product) => {
          const productAsRecord = product as unknown as Record<string, unknown>;
          const categoryName = typeof productAsRecord.category_name === 'string' ? productAsRecord.category_name : 'Coleção';
          const nameRecord = product.name as unknown as { pt?: string } | string | undefined;
          const displayName = typeof nameRecord === 'string' ? nameRecord : (nameRecord?.pt ?? '');
          return (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                <img
                  src={getOptimizedImageUrl(product.default_image_url, 'medium')}
                  alt={displayName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {displayName}
              </h4>
              <p className="text-sm text-gray-500">
                {categoryName}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WeatherProductRecommendations;
