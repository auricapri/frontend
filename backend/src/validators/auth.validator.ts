import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  metadata: z.object({
    full_name: z.string().optional(),
  }).optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
});
