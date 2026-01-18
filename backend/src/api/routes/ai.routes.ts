import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { fetchJsonWithRetry } from '../../utils/http-client.js';
import logger from '../../config/logger.js';
import { getIpGeolocationService } from '../../services/ip-geolocation.service.js';
import { getWeatherService } from '../../services/weather.service.js';
import { getWeatherPersonalizationService } from '../../services/weather-personalization.service.js';
import { validate } from '../middleware/validation.middleware.js';
import { apiRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Aplicar rate limiting para endpoints de IA
router.use(apiRateLimiter);

// SEGURANÇA: URL da API de IA - requer configuração explícita, sem fallback inseguro
const AI_API_BASE = process.env.AI_API_URL;

if (!AI_API_BASE) {
  logger.warn('AI_API_URL não configurado - endpoints de IA desabilitados');
}

// SEGURANÇA: Schema de validação para chat
const ChatRequestSchema = z.object({
  user_id: z.string().uuid('user_id deve ser um UUID válido'),
  message: z.string()
    .min(1, 'message não pode ser vazio')
    .max(4000, 'message não pode exceder 4000 caracteres')
    .transform(msg => sanitizeInput(msg)), // Sanitização
  session_id: z.string().uuid().optional(),
});

// SEGURANÇA: Schema de validação para face swap
const FaceSwapRequestSchema = z.object({
  user_id: z.string().uuid('user_id deve ser um UUID válido'),
  variant_id: z.string().uuid('variant_id deve ser um UUID válido'),
  user_image: z.string()
    .min(1, 'user_image não pode ser vazio')
    .max(10 * 1024 * 1024, 'user_image não pode exceder 10MB'),
});

// SEGURANÇA: Função para sanitizar input de texto
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Interfaces (mantidas para compatibilidade de tipo)
interface ChatRequest {
  user_id: string;
  message: string;
  session_id?: string;
}

interface FaceSwapRequest {
  user_id: string;
  variant_id: string;
  user_image: string;
}

interface WeatherContext {
  temperature: number;
  condition: string;
  city: string;
  suggestedCategories: string[];
  suggestedTags: string[];
}

// Mapear códigos de clima Open-Meteo para condições legíveis
function mapWeatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Cloudy';
  if (code >= 51 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain';
  if (code >= 95) return 'Storm';
  return 'Other';
}

// Extrair IP do request
function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return ips.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
}

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Enviar mensagem para o chat IA
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - message
 *             properties:
 *               user_id:
 *                 type: string
 *               message:
 *                 type: string
 *               session_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resposta do chat com produtos
 *       202:
 *         description: Requisição em fila
 *       500:
 *         description: Erro no serviço de IA
 */
router.post('/chat', validate({ body: ChatRequestSchema }), async (req: Request, res: Response) => {
  try {
    // SEGURANÇA: Verificar se AI está configurada
    if (!AI_API_BASE) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const body = req.body as ChatRequest;

    // Obter contexto de clima baseado no IP do usuário
    let weatherContext: WeatherContext | undefined;

    try {
      const clientIp = extractClientIp(req);
      logger.debug('Extracting weather context for IP', { ip: clientIp });

      const ipGeoService = getIpGeolocationService();
      const location = await ipGeoService.getLocationByIp(clientIp);

      if (location) {
        const weatherService = getWeatherService();
        const weather = await weatherService.getCurrentWeather(location.lat, location.lon);

        if (weather) {
          const personalizationService = getWeatherPersonalizationService();
          const recommendations = await personalizationService.getRecommendations(weather);

          weatherContext = {
            temperature: weather.temperatureC,
            condition: mapWeatherCodeToCondition(weather.weatherCode),
            city: location.city,
            suggestedCategories: recommendations.categories,
            suggestedTags: recommendations.tags
          };

          logger.debug('Weather context resolved', {
            city: location.city,
            temp: weather.temperatureC,
            condition: weatherContext.condition,
            categories: recommendations.categories.length
          });
        }
      }
    } catch (weatherError) {
      // Não falhar o chat se o clima não funcionar
      logger.warn('Failed to get weather context', {
        error: weatherError instanceof Error ? weatherError.message : String(weatherError)
      });
    }

    // Montar payload com contexto de clima
    const payload = {
      ...body,
      context: weatherContext ? { weather: weatherContext } : undefined
    };

    const response = await fetchJsonWithRetry({
      url: `${AI_API_BASE}/chat`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeoutMs: 60000, // 60s timeout para IA
      maxRetries: 2
    });

    res.json(response);
  } catch (error) {
    logger.error('AI chat error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', error: 'AI service unavailable' });
  }
});

/**
 * @swagger
 * /api/ai/queue/{userId}:
 *   get:
 *     summary: Verificar posição na fila
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status da fila
 */
router.get('/queue/:userId', async (req: Request, res: Response) => {
  try {
    if (!AI_API_BASE) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const { userId } = req.params;

    // SEGURANÇA: Validar userId como UUID
    const uuidSchema = z.string().uuid();
    const parseResult = uuidSchema.safeParse(userId);
    if (!parseResult.success) {
      res.status(400).json({ error: 'userId deve ser um UUID válido' });
      return;
    }

    const response = await fetchJsonWithRetry({
      url: `${AI_API_BASE}/queue/${userId}`,
      method: 'GET',
      timeoutMs: 5000,
      maxRetries: 1
    });

    res.json(response);
  } catch (error) {
    logger.error('AI queue status error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ position: 0, total_in_queue: 0, estimated_wait: 0 });
  }
});

/**
 * @swagger
 * /api/ai/session/{userId}:
 *   delete:
 *     summary: Limpar sessão do chat
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sessão limpa
 */
router.delete('/session/:userId', async (req: Request, res: Response) => {
  try {
    if (!AI_API_BASE) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const { userId } = req.params;

    // SEGURANÇA: Validar userId como UUID
    const uuidSchema = z.string().uuid();
    const parseResult = uuidSchema.safeParse(userId);
    if (!parseResult.success) {
      res.status(400).json({ error: 'userId deve ser um UUID válido' });
      return;
    }

    const response = await fetchJsonWithRetry({
      url: `${AI_API_BASE}/session/${userId}`,
      method: 'DELETE',
      timeoutMs: 5000,
      maxRetries: 1
    });

    res.json(response);
  } catch (error) {
    logger.error('AI session clear error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to clear session' });
  }
});

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Verificar status da API de IA
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Status da API
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    if (!AI_API_BASE) {
      res.status(503).json({ status: 'unconfigured', error: 'AI service not configured' });
      return;
    }

    const response = await fetchJsonWithRetry({
      url: `${AI_API_BASE}/health`,
      method: 'GET',
      timeoutMs: 5000,
      maxRetries: 1
    });

    res.json(response);
  } catch (error) {
    logger.error('AI health check error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'unhealthy', error: 'AI service unavailable' });
  }
});

/**
 * @swagger
 * /api/ai/face-swap:
 *   post:
 *     summary: Processar face swap
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - variant_id
 *               - user_image
 *             properties:
 *               user_id:
 *                 type: string
 *               variant_id:
 *                 type: string
 *               user_image:
 *                 type: string
 *                 description: Imagem em base64
 *     responses:
 *       200:
 *         description: Imagem processada
 *       500:
 *         description: Erro no processamento
 */
router.post('/face-swap', validate({ body: FaceSwapRequestSchema }), async (req: Request, res: Response) => {
  try {
    // SEGURANÇA: Verificar se AI está configurada
    if (!AI_API_BASE) {
      res.status(503).json({ error: 'AI service not configured' });
      return;
    }

    const body = req.body as FaceSwapRequest;

    const response = await fetchJsonWithRetry({
      url: `${AI_API_BASE}/face-swap`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: 120000, // 2min timeout para face swap
      maxRetries: 1
    });

    res.json(response);
  } catch (error) {
    logger.error('Face swap error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', error: 'Face swap service unavailable' });
  }
});

/**
 * @swagger
 * /api/ai/face-swap/status:
 *   get:
 *     summary: Verificar disponibilidade do face swap
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Status do serviço
 */
router.get('/face-swap/status', async (_req: Request, res: Response) => {
  try {
    const response = await fetchJsonWithRetry({
      url: `${AI_API_BASE}/face-swap/status`,
      method: 'GET',
      timeoutMs: 5000,
      maxRetries: 1
    });

    res.json(response);
  } catch (error) {
    logger.error('Face swap status error', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ available: false, can_process_immediately: false });
  }
});

export default router;
