import { Router, Request, Response } from 'express';
import { getCampaignsRepository } from '../../repositories/campaigns.repository.js';
import { getCampaignRecommendationService } from '../../services/campaign-recommendation.service.js';
import { getUserProfileService } from '../../services/user-profile.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
const campaignsRepo = getCampaignsRepository();
const recommendationService = getCampaignRecommendationService();
const userProfileService = getUserProfileService();

/**
 * @swagger
 * /api/marketing/my-campaigns:
 *   get:
 *     summary: Obter campanhas recomendadas para o usuário
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de campanhas recomendadas
 */
// Public / Authenticated Customer Endpoints
router.get('/my-campaigns', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const recommendations = await recommendationService.getRecommendedCampaignsForUser(userId);
  res.json(recommendations);
});

/**
 * @swagger
 * /api/marketing/my-tags:
 *   get:
 *     summary: Obter tags do usuário
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tags do usuário
 */
router.get('/my-tags', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const tags = await campaignsRepo.getUserTags(userId);
  res.json(tags);
});

/**
 * @swagger
 * /api/marketing/campaigns:
 *   get:
 *     summary: Lista todas as campanhas ativas - Apenas Admin
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de campanhas
 *       403:
 *         description: Acesso negado
 */
// Admin Endpoints
router.get('/campaigns', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const campaigns = await campaignsRepo.getActiveCampaigns();
  res.json(campaigns);
});

/**
 * @swagger
 * /api/marketing/campaigns:
 *   post:
 *     summary: Criar nova campanha - Apenas Admin
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Campanha criada
 */
router.post('/campaigns', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const campaign = await campaignsRepo.createCampaign(req.body);
  res.status(201).json(campaign);
});

/**
 * @swagger
 * /api/marketing/campaigns/{id}:
 *   put:
 *     summary: Atualizar campanha - Apenas Admin
 *     tags: [Marketing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Campanha atualizada
 */
router.put('/campaigns/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const campaign = await campaignsRepo.updateCampaign(req.params.id, req.body);
  res.json(campaign);
});

router.get('/users/:userId/profile', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const tags = await campaignsRepo.getUserTags(userId);
  const recommendations = await recommendationService.getRecommendedCampaignsForUser(userId);
  
  res.json({
    userId,
    tags,
    recommendations
  });
});

router.post('/users/:userId/recalculate-tags', authenticate, requireAdmin, async (req: Request, res: Response) => {
  await userProfileService.calculateUserTags(req.params.userId);
  res.status(204).send();
});

export default router;
