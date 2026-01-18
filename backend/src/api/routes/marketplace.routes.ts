import { Router, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { marketplaceProvidersRepository } from '../../repositories/marketplace-providers.repository.js';
import { marketplaceConfigsRepository } from '../../repositories/marketplace-configs.repository.js';
import { marketplaceMappingsRepository } from '../../repositories/marketplace-mappings.repository.js';
import { marketplaceLogsRepository } from '../../repositories/marketplace-logs.repository.js';
import { getMarketplaceOrchestrator, MarketplaceCrypto } from '../../services/marketplace/index.js';
import { getMercadoLivreFeesService } from '../../services/marketplace/providers/mercado-livre-fees.service.js';
import logger from '../../config/logger.js';

const router = Router();

// ============================================
// PROVIDERS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/providers:
 *   get:
 *     summary: Lista todos os providers de marketplace disponíveis
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de providers
 */
router.get('/providers', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const providers = await marketplaceProvidersRepository.getAllActive();
    res.json(providers);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/providers/{id}:
 *   get:
 *     summary: Obtém um provider específico
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/providers/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const provider = await marketplaceProvidersRepository.getById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: { message: 'Provider not found' } });
    }
    res.json(provider);
  } catch (error) {
    next(error);
  }
});

// ============================================
// CONFIGS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/configs:
 *   get:
 *     summary: Lista todas as configurações de marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/configs', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configs = await marketplaceConfigsRepository.getAll();

    // Remove sensitive fields before returning
    const safeConfigs = configs.map(config => ({
      ...config,
      credentials_encrypted: undefined,
      access_token_encrypted: undefined,
      refresh_token_encrypted: undefined,
    }));

    res.json(safeConfigs);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/configs/{id}:
 *   get:
 *     summary: Obtém uma configuração específica (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/configs/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = await marketplaceConfigsRepository.getById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: { message: 'Config not found' } });
    }

    // Remove sensitive fields
    res.json({
      ...config,
      credentials_encrypted: undefined,
      access_token_encrypted: undefined,
      refresh_token_encrypted: undefined,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/configs:
 *   post:
 *     summary: Cria uma nova configuração de marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/configs', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      provider_id,
      credentials,
      environment,
      commission_override,
      price_markup_percent,
      auto_sync_stock,
      auto_sync_price,
      sync_interval_minutes,
    } = req.body;

    if (!provider_id || !credentials) {
      return res.status(400).json({ error: { message: 'provider_id and credentials are required' } });
    }

    // Check if provider exists
    const provider = await marketplaceProvidersRepository.getById(provider_id);
    if (!provider) {
      return res.status(400).json({ error: { message: 'Invalid provider_id' } });
    }

    // Check if config already exists for this provider
    const existingConfig = await marketplaceConfigsRepository.getByProviderId(provider_id);

    let config;

    if (existingConfig) {
      // If already connected and not forcing reconnect, just return it
      const forceReconnect = req.body.force_reconnect === true;
      if (existingConfig.status === 'connected' && !forceReconnect) {
        logger.info('Returning existing connected config', {
          configId: existingConfig.id,
          providerId: provider_id,
        });
        return res.json({
          ...existingConfig,
          credentials_encrypted: undefined,
          access_token_encrypted: undefined,
          refresh_token_encrypted: undefined,
        });
      }

      // If not connected or forcing reconnect, update credentials and reset status/tokens
      config = await marketplaceConfigsRepository.update(existingConfig.id, {
        credentials,
        environment,
        commission_override,
        price_markup_percent,
        auto_sync_stock,
        auto_sync_price,
        sync_interval_minutes,
        // Reset tokens and status when credentials change
        status: 'disconnected',
        status_message: null,
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
      });

      logger.info('Marketplace config updated', {
        configId: config.id,
        providerId: provider_id,
        userId: req.userId,
      });
    } else {
      // Create new config
      config = await marketplaceConfigsRepository.create({
        provider_id,
        credentials,
        environment,
        commission_override,
        price_markup_percent,
        auto_sync_stock,
        auto_sync_price,
        sync_interval_minutes,
      });

      logger.info('Marketplace config created', {
        configId: config.id,
        providerId: provider_id,
        userId: req.userId,
      });
    }

    // Remove sensitive fields
    res.status(201).json({
      ...config,
      credentials_encrypted: undefined,
      access_token_encrypted: undefined,
      refresh_token_encrypted: undefined,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/configs/{id}:
 *   put:
 *     summary: Atualiza uma configuração de marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.put('/configs/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configId = req.params.id;
    const {
      credentials,
      environment,
      commission_override,
      price_markup_percent,
      auto_sync_stock,
      auto_sync_price,
      sync_interval_minutes,
      is_active,
    } = req.body;

    const existingConfig = await marketplaceConfigsRepository.getById(configId);
    if (!existingConfig) {
      return res.status(404).json({ error: { message: 'Config not found' } });
    }

    const config = await marketplaceConfigsRepository.update(configId, {
      credentials,
      environment,
      commission_override,
      price_markup_percent,
      auto_sync_stock,
      auto_sync_price,
      sync_interval_minutes,
      is_active,
    });

    // Clear orchestrator cache to reload with new credentials
    const orchestrator = getMarketplaceOrchestrator();
    orchestrator.clearCache(configId);

    logger.info('Marketplace config updated', {
      configId,
      userId: req.userId,
    });

    res.json({
      ...config,
      credentials_encrypted: undefined,
      access_token_encrypted: undefined,
      refresh_token_encrypted: undefined,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/configs/{id}:
 *   delete:
 *     summary: Remove uma configuração de marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/configs/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configId = req.params.id;

    const existingConfig = await marketplaceConfigsRepository.getById(configId);
    if (!existingConfig) {
      return res.status(404).json({ error: { message: 'Config not found' } });
    }

    await marketplaceConfigsRepository.delete(configId);

    // Clear orchestrator cache
    const orchestrator = getMarketplaceOrchestrator();
    orchestrator.clearCache(configId);

    logger.info('Marketplace config deleted', {
      configId,
      providerId: existingConfig.provider_id,
      userId: req.userId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ============================================
// OAUTH ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/oauth/callback:
 *   get:
 *     summary: Callback público para OAuth do Mercado Livre
 *     description: Este endpoint recebe o redirect do Mercado Livre após autorização
 *     tags: [Marketplace]
 */
router.get('/oauth/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    // URL base do frontend para redirect
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const adminMarketplacesUrl = `${frontendUrl}/admin/marketplaces`;

    // Se houve erro na autorização
    if (error) {
      logger.error('OAuth authorization error from ML', {
        error,
        error_description,
      });
      return res.redirect(`${adminMarketplacesUrl}?oauth=error&message=${encodeURIComponent(String(error_description || error))}`);
    }

    // Validar parâmetros obrigatórios
    if (!code || !state) {
      logger.error('OAuth callback missing required params', { code: !!code, state: !!state });
      return res.redirect(`${adminMarketplacesUrl}?oauth=error&message=${encodeURIComponent('Missing code or state parameter')}`);
    }

    // Decodificar state para obter configId, redirectUri e codeVerifier (PKCE)
    let configId: string;
    let redirectUri: string;
    let codeVerifier: string | undefined;
    try {
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('utf8'));
      configId = stateData.configId;
      redirectUri = stateData.redirectUri;
      codeVerifier = stateData.codeVerifier; // PKCE code_verifier
      if (!configId || !redirectUri) {
        throw new Error('configId or redirectUri not found in state');
      }
    } catch (parseError) {
      logger.error('Failed to parse OAuth state', { state, error: parseError });
      return res.redirect(`${adminMarketplacesUrl}?oauth=error&message=${encodeURIComponent('Invalid state parameter')}`);
    }

    // Trocar código por tokens (com PKCE code_verifier se disponível)
    const orchestrator = getMarketplaceOrchestrator();
    await orchestrator.handleOAuthCallback(configId, code as string, redirectUri, codeVerifier);

    logger.info('OAuth callback processed successfully', { configId });

    // Redirect para frontend com sucesso
    return res.redirect(`${adminMarketplacesUrl}?oauth=success&config_id=${configId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('OAuth callback processing failed', { error });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/admin/marketplaces?oauth=error&message=${encodeURIComponent(message)}`);
  }
});

/**
 * @swagger
 * /api/marketplace/configs/{id}/auth-url:
 *   get:
 *     summary: Obtém URL de autorização OAuth (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/configs/:id/auth-url', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configId = req.params.id;
    const redirectUri = req.query.redirect_uri as string;
    const codeChallenge = req.query.code_challenge as string | undefined;
    const codeVerifier = req.query.code_verifier as string | undefined;

    if (!redirectUri) {
      return res.status(400).json({ error: { message: 'redirect_uri is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const url = await orchestrator.getAuthUrl(configId, redirectUri, codeChallenge, codeVerifier);

    res.json({ url });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/configs/{id}/callback:
 *   post:
 *     summary: Processa callback OAuth e troca código por tokens (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/configs/:id/callback', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configId = req.params.id;
    const { code, redirect_uri } = req.body;

    if (!code || !redirect_uri) {
      return res.status(400).json({ error: { message: 'code and redirect_uri are required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    await orchestrator.handleOAuthCallback(configId, code, redirect_uri);

    logger.info('OAuth callback processed successfully', {
      configId,
      userId: req.userId,
    });

    res.json({ status: 'connected', message: 'Authorization successful' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/configs/{id}/test:
 *   post:
 *     summary: Testa conexão com o marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/configs/:id/test', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const configId = req.params.id;

    const orchestrator = getMarketplaceOrchestrator();
    const result = await orchestrator.testConnection(configId);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// MAPPINGS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/mappings:
 *   get:
 *     summary: Lista mapeamentos de produtos (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/mappings', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { product_id, config_id, sync_status, limit, offset } = req.query;

    const mappings = await marketplaceMappingsRepository.findAll({
      product_id: product_id as string,
      config_id: config_id as string,
      sync_status: sync_status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(mappings);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/mappings/{id}:
 *   get:
 *     summary: Obtém um mapeamento específico (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/mappings/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mapping = await marketplaceMappingsRepository.getById(req.params.id);
    if (!mapping) {
      return res.status(404).json({ error: { message: 'Mapping not found' } });
    }
    res.json(mapping);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/mappings:
 *   post:
 *     summary: Cria um mapeamento manualmente (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/mappings', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      config_id,
      product_id,
      variant_id,
      external_product_id,
      external_sku,
      external_url,
    } = req.body;

    if (!config_id || !product_id) {
      return res.status(400).json({ error: { message: 'config_id and product_id are required' } });
    }

    const mapping = await marketplaceMappingsRepository.create({
      config_id,
      product_id,
      variant_id,
      external_product_id,
      external_sku,
      external_url,
    });

    res.status(201).json(mapping);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/mappings/{id}:
 *   put:
 *     summary: Atualiza um mapeamento (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.put('/mappings/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mappingId = req.params.id;
    const updates = req.body;

    const existingMapping = await marketplaceMappingsRepository.getById(mappingId);
    if (!existingMapping) {
      return res.status(404).json({ error: { message: 'Mapping not found' } });
    }

    const mapping = await marketplaceMappingsRepository.update(mappingId, updates);
    res.json(mapping);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/mappings/{id}:
 *   delete:
 *     summary: Remove um mapeamento (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/mappings/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mappingId = req.params.id;

    const existingMapping = await marketplaceMappingsRepository.getById(mappingId);
    if (!existingMapping) {
      return res.status(404).json({ error: { message: 'Mapping not found' } });
    }

    await marketplaceMappingsRepository.delete(mappingId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/mappings/{id}/sync:
 *   post:
 *     summary: Força sincronização de um mapeamento específico (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/mappings/:id/sync', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const mappingId = req.params.id;

    const mapping = await marketplaceMappingsRepository.getById(mappingId);
    if (!mapping) {
      return res.status(404).json({ error: { message: 'Mapping not found' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const results = await orchestrator.syncProduct(mapping.product_id, 'update');

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SYNC ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/sync/products:
 *   post:
 *     summary: Sincroniza produtos para todos os marketplaces (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/sync/products', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { product_ids } = req.body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: { message: 'product_ids array is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const allResults = [];

    for (const productId of product_ids) {
      const results = await orchestrator.syncProduct(productId, 'update');
      allResults.push({ product_id: productId, results });
    }

    res.json({ results: allResults });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/sync/pending:
 *   post:
 *     summary: Sincroniza todos os produtos pendentes (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/sync/pending', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id } = req.body;

    const orchestrator = getMarketplaceOrchestrator();
    const results = await orchestrator.syncPending(config_id);

    res.json({ results });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/sync/stats:
 *   get:
 *     summary: Obtém estatísticas de sincronização (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/sync/stats', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id } = req.query;

    const orchestrator = getMarketplaceOrchestrator();
    const stats = await orchestrator.getSyncStats(config_id as string);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/calculate-price:
 *   post:
 *     summary: Calcula preço de marketplace para um produto (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/calculate-price', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { product_id, variant_id, config_id } = req.body;

    if (!product_id || !config_id) {
      return res.status(400).json({ error: { message: 'product_id and config_id are required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const price = await orchestrator.calculateMarketplacePrice(product_id, variant_id, config_id);

    res.json({ price });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ORDERS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/orders:
 *   get:
 *     summary: Lista pedidos do marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, status, since, until, limit, offset } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getOrders' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support orders' } });
    }

    const orders = await (provider as any).getOrders({
      status: status as string,
      since: since ? new Date(since as string) : undefined,
      until: until ? new Date(until as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/orders/{orderId}:
 *   get:
 *     summary: Obtém detalhes de um pedido (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders/:orderId', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { config_id } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getOrder' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support orders' } });
    }

    const order = await (provider as any).getOrder(orderId);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/orders/sync:
 *   post:
 *     summary: Sincroniza pedidos do marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/orders/sync', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, since } = req.body;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id);

    if (!provider || !('getOrders' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support orders' } });
    }

    // Buscar pedidos recentes
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // últimas 24h
    const orders = await (provider as any).getOrders({ since: sinceDate });

    // TODO: Salvar/atualizar pedidos no banco local
    logger.info('Orders synced from marketplace', {
      configId: config_id,
      count: orders.length,
    });

    res.json({
      synced: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// QUESTIONS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/questions:
 *   get:
 *     summary: Lista perguntas do marketplace (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/questions', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, status, item_id, limit, offset } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getQuestions' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support questions' } });
    }

    const questions = await (provider as any).getQuestions({
      status: status as 'UNANSWERED' | 'ANSWERED' | undefined,
      itemId: item_id as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/questions/{questionId}/answer:
 *   post:
 *     summary: Responde uma pergunta (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.post('/questions/:questionId/answer', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { questionId } = req.params;
    const { config_id, answer } = req.body;

    if (!config_id || !answer) {
      return res.status(400).json({ error: { message: 'config_id and answer are required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id);

    if (!provider || !('answerQuestion' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support questions' } });
    }

    await (provider as any).answerQuestion(questionId, answer);

    logger.info('Question answered', {
      questionId,
      configId: config_id,
      userId: req.userId,
    });

    res.json({ status: 'answered', message: 'Question answered successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SHIPPING ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/shipping/{shipmentId}:
 *   get:
 *     summary: Obtém detalhes de um envio (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/shipping/:shipmentId', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shipmentId } = req.params;
    const { config_id } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getShipmentDetails' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support shipping' } });
    }

    const shipment = await (provider as any).getShipmentDetails(shipmentId);
    res.json(shipment);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/shipping/{shipmentId}/tracking:
 *   put:
 *     summary: Atualiza código de rastreio (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.put('/shipping/:shipmentId/tracking', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shipmentId } = req.params;
    const { config_id, tracking_number, carrier } = req.body;

    if (!config_id || !tracking_number) {
      return res.status(400).json({ error: { message: 'config_id and tracking_number are required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id);

    if (!provider || !('updateShipmentTracking' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support shipping' } });
    }

    await (provider as any).updateShipmentTracking(shipmentId, tracking_number, carrier);

    logger.info('Shipment tracking updated', {
      shipmentId,
      trackingNumber: tracking_number,
      configId: config_id,
      userId: req.userId,
    });

    res.json({ status: 'updated', message: 'Tracking number updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/shipping/{shipmentId}/label:
 *   get:
 *     summary: Baixa etiqueta de envio (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/shipping/:shipmentId/label', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shipmentId } = req.params;
    const { config_id } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getShippingLabel' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support shipping labels' } });
    }

    const { data, contentType } = await (provider as any).getShippingLabel(shipmentId);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
    res.send(data);
  } catch (error) {
    next(error);
  }
});

// ============================================
// METRICS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/metrics/sales:
 *   get:
 *     summary: Obtém métricas de vendas (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/metrics/sales', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, period } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getSalesMetrics' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support metrics' } });
    }

    const metrics = await (provider as any).getSalesMetrics(period || 'month');
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/metrics/visits:
 *   get:
 *     summary: Obtém métricas de visitas (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/metrics/visits', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, product_id, period } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getVisitsMetrics' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support metrics' } });
    }

    const metrics = await (provider as any).getVisitsMetrics(product_id as string, period || 'week');
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/metrics/reputation:
 *   get:
 *     summary: Obtém reputação do vendedor (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/metrics/reputation', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getSellerReputation' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support reputation' } });
    }

    const reputation = await (provider as any).getSellerReputation();
    res.json(reputation);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/metrics/full:
 *   get:
 *     summary: Obtém todas as métricas do vendedor (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/metrics/full', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const orchestrator = getMarketplaceOrchestrator();
    const provider = await orchestrator.getProvider(config_id as string);

    if (!provider || !('getFullMetrics' in provider)) {
      return res.status(400).json({ error: { message: 'Provider does not support full metrics' } });
    }

    const metrics = await (provider as any).getFullMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// ============================================
// LOGS ROUTES
// ============================================

/**
 * @swagger
 * /api/marketplace/logs:
 *   get:
 *     summary: Lista logs de sincronização (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/logs', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, mapping_id, action, status, limit, offset } = req.query;

    const logs = await marketplaceLogsRepository.findAll({
      config_id: config_id as string,
      mapping_id: mapping_id as string,
      action: action as any,
      status: status as any,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/logs/stats:
 *   get:
 *     summary: Obtém estatísticas de logs (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/logs/stats', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id, since } = req.query;

    if (!config_id) {
      return res.status(400).json({ error: { message: 'config_id is required' } });
    }

    const sinceDate = since ? new Date(since as string) : undefined;
    const stats = await marketplaceLogsRepository.getStatsByConfig(config_id as string, sinceDate);

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// ============================================
// FEES ROUTES (Mercado Livre)
// ============================================

/**
 * @swagger
 * /api/marketplace/fees/categories/{categoryId}:
 *   get:
 *     summary: Obtém taxas para uma categoria do ML (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: listing_type
 *         schema:
 *           type: string
 *           default: gold_special
 *       - in: query
 *         name: config_id
 *         schema:
 *           type: string
 */
router.get('/fees/categories/:categoryId', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const { listing_type, config_id } = req.query;

    // If config_id provided, get access token for API calls
    let accessToken: string | undefined;
    if (config_id) {
      const config = await marketplaceConfigsRepository.getById(config_id as string);
      if (config?.access_token_encrypted) {
        accessToken = MarketplaceCrypto.decrypt(config.access_token_encrypted);
      }
    }

    const feesService = getMercadoLivreFeesService(accessToken);
    const fees = await feesService.getCategoryFees(categoryId, listing_type as string || 'gold_special');

    if (!fees) {
      return res.status(404).json({ error: { message: 'Category fees not found' } });
    }

    res.json(fees);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/fees/calculate:
 *   post:
 *     summary: Calcula taxas para um preço específico (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price
 *               - category_id
 *             properties:
 *               price:
 *                 type: number
 *               category_id:
 *                 type: string
 *               listing_type:
 *                 type: string
 *                 default: gold_special
 *               config_id:
 *                 type: string
 */
router.post('/fees/calculate', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { price, category_id, listing_type, config_id } = req.body;

    if (!price || !category_id) {
      return res.status(400).json({ error: { message: 'price and category_id are required' } });
    }

    // Get access token if config_id provided
    let accessToken: string | undefined;
    if (config_id) {
      const config = await marketplaceConfigsRepository.getById(config_id);
      if (config?.access_token_encrypted) {
        accessToken = MarketplaceCrypto.decrypt(config.access_token_encrypted);
      }
    }

    const feesService = getMercadoLivreFeesService(accessToken);
    const categoryFees = await feesService.getCategoryFees(category_id, listing_type || 'gold_special');

    if (!categoryFees) {
      return res.status(404).json({ error: { message: 'Category fees not found' } });
    }

    const calculation = feesService.calculateFees(
      price,
      categoryFees.sales_commission_percent,
      categoryFees.listing_fee
    );

    res.json({
      ...calculation,
      category_id,
      category_name: categoryFees.category_name,
      listing_type: categoryFees.listing_type,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/fees/minimum-price:
 *   post:
 *     summary: Calcula preço mínimo para receita líquida alvo (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_net_revenue
 *               - category_id
 *             properties:
 *               target_net_revenue:
 *                 type: number
 *               category_id:
 *                 type: string
 *               listing_type:
 *                 type: string
 *                 default: gold_special
 *               config_id:
 *                 type: string
 */
router.post('/fees/minimum-price', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { target_net_revenue, category_id, listing_type, config_id } = req.body;

    if (!target_net_revenue || !category_id) {
      return res.status(400).json({ error: { message: 'target_net_revenue and category_id are required' } });
    }

    // Get access token if config_id provided
    let accessToken: string | undefined;
    if (config_id) {
      const config = await marketplaceConfigsRepository.getById(config_id);
      if (config?.access_token_encrypted) {
        accessToken = MarketplaceCrypto.decrypt(config.access_token_encrypted);
      }
    }

    const feesService = getMercadoLivreFeesService(accessToken);
    const categoryFees = await feesService.getCategoryFees(category_id, listing_type || 'gold_special');

    if (!categoryFees) {
      return res.status(404).json({ error: { message: 'Category fees not found' } });
    }

    const minimumPrice = feesService.calculateMinimumPrice(
      target_net_revenue,
      categoryFees.sales_commission_percent,
      categoryFees.listing_fee
    );

    // Also return the fee breakdown at minimum price
    const feeBreakdown = feesService.calculateFees(
      minimumPrice,
      categoryFees.sales_commission_percent,
      categoryFees.listing_fee
    );

    res.json({
      minimum_price: minimumPrice,
      target_net_revenue,
      category_id,
      category_name: categoryFees.category_name,
      listing_type: categoryFees.listing_type,
      sales_commission_percent: categoryFees.sales_commission_percent,
      ...feeBreakdown,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/fees/listing-types:
 *   get:
 *     summary: Lista tipos de anúncio do ML (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 */
router.get('/fees/listing-types', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const feesService = getMercadoLivreFeesService();
    const listingTypes = await feesService.getListingTypes();

    res.json(listingTypes);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/marketplace/fees/refresh:
 *   post:
 *     summary: Atualiza cache de taxas do ML (Admin)
 *     tags: [Marketplace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config_id:
 *                 type: string
 */
router.post('/fees/refresh', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { config_id } = req.body;

    // Get access token if config_id provided
    let accessToken: string | undefined;
    if (config_id) {
      const config = await marketplaceConfigsRepository.getById(config_id);
      if (config?.access_token_encrypted) {
        accessToken = MarketplaceCrypto.decrypt(config.access_token_encrypted);
      }
    }

    const feesService = getMercadoLivreFeesService(accessToken);
    const result = await feesService.refreshAllFees();

    logger.info('ML fees cache refreshed', {
      updated: result.updated,
      errors: result.errors,
    });

    res.json({
      message: 'Fees cache refreshed',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
