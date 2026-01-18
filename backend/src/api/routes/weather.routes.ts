import { Router, Request, Response } from 'express';
import { getWeatherService } from '../../services/weather.service.js';
import { getWeatherPersonalizationService } from '../../services/weather-personalization.service.js';

const router = Router();
const weather = getWeatherService();
const personalization = getWeatherPersonalizationService();

/**
 * @swagger
 * /api/weather/current:
 *   get:
 *     summary: Obter clima atual por coordenadas
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Dados meteorológicos
 *       404:
 *         description: Clima não disponível
 */
router.get('/current', async (req: Request, res: Response) => {
  const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
  const lon = typeof req.query.lon === 'string' ? Number(req.query.lon) : NaN;

  const data = await weather.getCurrentWeather(lat, lon);
  if (!data) {
    res.status(404).json({ error: 'Weather not available' });
    return;
  }

  res.json(data);
});

/**
 * @swagger
 * /api/weather/recommendations:
 *   get:
 *     summary: Obter recomendações baseadas no clima
 *     tags: [Weather]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Recomendações baseadas no clima
 *       400:
 *         description: Latitude e longitude são obrigatórias
 *       404:
 *         description: Clima não disponível
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  const lat = typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
  const lon = typeof req.query.lon === 'string' ? Number(req.query.lon) : NaN;

  if (isNaN(lat) || isNaN(lon)) {
    res.status(400).json({ error: 'Latitude and longitude are required' });
    return;
  }

  const weatherData = await weather.getCurrentWeather(lat, lon);
  if (!weatherData) {
    res.status(404).json({ error: 'Weather not available' });
    return;
  }

  const recommendations = await personalization.getRecommendations(weatherData);
  res.json({
    weather: weatherData,
    ...recommendations
  });
});

export default router;

