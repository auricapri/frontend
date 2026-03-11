import React from 'react';
import { useWeatherRecommendations } from '../hooks/useWeatherRecommendations';

const WeatherPersonalizedBanner: React.FC = () => {
  const { recommendations, isLoading, error } = useWeatherRecommendations();

  if (isLoading || error || !recommendations) {
    return null;
  }

  const { weather, categories } = recommendations;
  const temp = Math.round(weather.temperatureC);
  
  // Choose message based on temperature/categories
  let title = `Está fazendo ${temp}°C por aqui!`;
  let subtitle = 'Confira nossas sugestões para o clima de hoje.';
  
  if (temp < 15) {
    title = `Clima gelado (${temp}°C)!`;
    subtitle = 'Aqueça-se com nossa coleção de inverno selecionada para você.';
  } else if (temp > 28) {
    title = `Dia de sol e calor (${temp}°C)!`;
    subtitle = 'Frescor e leveza: veja o que separamos para o seu dia.';
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 py-6 px-4 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {temp < 15 ? '❄️' : temp > 28 ? '☀️' : '⛅'}
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif text-gray-900">{title}</h3>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className="bg-paper hover:bg-gray-50 text-gray-800 text-sm font-medium py-2 px-4 border border-gray-200 rounded-full transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherPersonalizedBanner;
