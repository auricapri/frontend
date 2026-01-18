import React from 'react';
import { useWeatherRecommendations } from '../hooks/useWeatherRecommendations';

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
        {recommendations.products.slice(0, 4).map((product: any) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              <img
                src={product.default_image_url || 'https://via.placeholder.com/400'}
                alt={product.name?.pt || product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {product.name?.pt || product.name}
            </h4>
            <p className="text-sm text-gray-500">
              {product.category_name || 'Coleção'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeatherProductRecommendations;
