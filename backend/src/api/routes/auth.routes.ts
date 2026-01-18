import { Router } from 'express';
import { AuthRepository } from '../../repositories/auth.repository.js';
import { UsersRepository } from '../../repositories/users.repository.js';
import { validate } from '../middleware/validation.middleware.js';
import { SignUpSchema, SignInSchema, ResetPasswordSchema } from '../../validators/auth.validator.js';
import logger from '../../config/logger.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();
const authRepo = new AuthRepository();
const usersRepo = new UsersRepository();

router.use(authRateLimiter);

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Criar nova conta de usuário
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: senha123
 *               metadata:
 *                 type: object
 *                 properties:
 *                   full_name:
 *                     type: string
 *                     example: João Silva
 *     responses:
 *       201:
 *         description: Conta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                     refresh_token:
 *                       type: string
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/auth/signup - Sign up new user
router.post('/signup', validate({ body: SignUpSchema }), async (req, res, next) => {
  try {
    const { email, password, metadata } = req.body;
    const { user, session } = await authRepo.signUp(email, password, metadata);
    
    // Create profile automatically when user signs up
    if (user?.id) {
      try {
        await usersRepo.updateProfile(user.id, {
          full_name: metadata?.full_name || '',
          email: email || ''
        });
      } catch (profileError) {
        logger.error('Error creating profile on signup', {
          userId: user.id,
          error: profileError instanceof Error ? profileError.message : String(profileError),
        });
      }
    }
    
    if (user && session) {
      res.status(201).json({ user, session });
    } else {
      res.status(201).json({ 
        message: 'Signup successful. Please check your email to confirm your account.',
        user 
      });
    }
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Fazer login na aplicação
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                 session:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: "Token JWT para autenticação (use no header Authorization: Bearer {token})"
 *                     refresh_token:
 *                       type: string
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [customer, admin, editor, affiliate, delivery]
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
// POST /api/auth/signin - Sign in user
router.post('/signin', validate({ body: SignInSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, session } = await authRepo.signIn(email, password);
    
    if (user && session) {
      // Fetch full profile
      const profile = await usersRepo.getProfile(user.id);
      res.json({ user, session, profile });
    } else {
      res.status(401).json({ error: { message: 'Invalid credentials' } });
    }
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Fazer logout da aplicação
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Logout realizado com sucesso
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/auth/signout - Sign out user
router.post('/signout', async (req, res, next) => {
  try {
    await authRepo.signOut();
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Solicitar reset de senha
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@example.com
 *     responses:
 *       200:
 *         description: Email de reset enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Email não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/auth/reset-password - Request password reset
router.post('/reset-password', validate({ body: ResetPasswordSchema }), async (req, res, next) => {
  try {
    const { email } = req.body;
    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;
    await authRepo.resetPasswordForEmail(email, { redirectTo });
    res.json({ message: 'Password reset email sent' });
  } catch (error: unknown) {
    next(error);
  }
});

export default router;
