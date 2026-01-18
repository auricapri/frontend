import { Router, Response, NextFunction } from 'express';
import { UsersRepository } from '../../repositories/users.repository.js';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const usersRepo = new UsersRepository();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obter perfil do usuário autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/users/profile - Get current user profile
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const profile = await usersRepo.getProfile(req.userId);
    if (!profile) {
      // For new users without a profile, return a basic profile structure
      // Use full_name from auth user metadata if available
      const fullName = req.user?.user_metadata?.full_name || '';
      const email = req.user?.email || '';
      
      return res.json({
        id: req.userId,
        full_name: fullName,
        email: email,
        phone: '',
        affiliate_code: null,
        loyalty: null,
        default_address: null,
        saved_cards: []
      });
    }
    res.json(profile);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Atualizar perfil do usuário autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/users/profile - Update current user profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const profile = await usersRepo.updateProfile(req.userId, req.body);
    res.json(profile);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lista todos os usuários - Apenas Admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/users - Get all users (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await usersRepo.getAll();
    res.json(users);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obter usuário por ID - Apenas Admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await usersRepo.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    res.json(profile);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/loyalty:
 *   put:
 *     summary: Atualizar dados de fidelidade do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - loyalty
 *             properties:
 *               loyalty:
 *                 type: object
 *                 properties:
 *                   current_xp:
 *                     type: number
 *                   current_level:
 *                     type: integer
 *                   cashback_balance:
 *                     type: number
 *                   last_seen_level:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Dados de fidelidade atualizados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/users/loyalty - Update user loyalty data (dismiss banner, etc.)
router.put('/loyalty', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    
    const { loyalty } = req.body;
    const profile = await usersRepo.updateProfile(req.userId, { loyalty });
    res.json(profile);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/addresses:
 *   post:
 *     summary: Criar novo endereço
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - street_address
 *               - city
 *               - state_province
 *               - postal_code
 *               - country_code
 *             properties:
 *               type:
 *                 type: string
 *               street_address:
 *                 type: string
 *               city:
 *                 type: string
 *               state_province:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country_code:
 *                 type: string
 *                 default: BR
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 user_id:
 *                   type: string
 *                 street_address:
 *                   type: string
 *                 city:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/users/addresses - Create address
router.post('/addresses', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    const address = await usersRepo.createAddress({
      ...req.body,
      user_id: req.userId
    });
    res.status(201).json(address);
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/addresses/{id}/default:
 *   put:
 *     summary: Definir endereço como padrão
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do endereço
 *     responses:
 *       204:
 *         description: Endereço definido como padrão
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Endereço não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PUT /api/users/addresses/:id/default - Set default address
router.put('/addresses/:id/default', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }
    await usersRepo.setDefaultAddress(req.userId, req.params.id);
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/create-delivery:
 *   post:
 *     summary: Criar usuário de entrega - Apenas Admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário de entrega criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                 full_name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [delivery]
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Acesso negado - requer permissão de admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/users/create-delivery - Create delivery user (admin only)
router.post('/create-delivery', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: { message: 'email, password, and fullName are required' } });
    }

    const { user, profile } = await usersRepo.createUserWithRole(email, password, fullName, 'delivery');
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      full_name: profile.full_name,
      role: profile.role
    });
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

