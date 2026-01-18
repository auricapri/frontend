import { Request, Response, NextFunction } from 'express';
import { CouponsRepository } from '../../repositories/coupons.repository.js';
import { CouponValidationService } from '../../services/coupon-validation.service.js';
import { authenticate, optionalAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createCrudRouter } from './base-crud.router.js';
import { cacheJson } from '../middleware/cache.middleware.js';
import { supabase } from '../../config/supabase.js';
import { AuditLogsRepository } from '../../repositories/audit_logs.repository.js';
import { NotificationsRepository } from '../../repositories/notifications.repository.js';

const couponsRepo = new CouponsRepository();
const couponValidationService = new CouponValidationService();
const auditLogsRepo = new AuditLogsRepository();
const notificationsRepo = new NotificationsRepository();

const router = createCrudRouter({
  repository: couponsRepo,
  basePath: '/coupons',
  cache: {
    prefix: 'crud:coupons',
    listTtlSeconds: 30,
    getTtlSeconds: 60,
    cacheControl: 'public, max-age=30, stale-while-revalidate=60'
  },
  customRoutes: [
    {
      method: 'delete',
      path: '/:id',
      middleware: [authenticate, requireAdmin],
      handler: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
          const r = req as AuthenticatedRequest;
          const couponId = req.params.id;

          const { data: existing, error: existingError } = await supabase
            .from('coupons')
            .select('id, code, is_active, expires_at, used_count, deleted_at')
            .eq('id', couponId)
            .maybeSingle();

          if (existingError) throw existingError;
          if (!existing) {
            res.status(404).json({ error: { message: 'Resource not found' } });
            return;
          }

          if ((existing as any).deleted_at) {
            res.status(204).send();
            return;
          }

          const activeStatuses = ['pending', 'confirmed', 'processing', 'shipped'];
          const { count: activeUseCount, error: activeUseError } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('coupon_id', couponId)
            .in('status', activeStatuses);

          if (activeUseError) throw activeUseError;

          if ((activeUseCount || 0) > 0) {
            const err = new Error(`Não é possível excluir: cupom em uso em ${activeUseCount} pedido(s) ativo(s).`) as any;
            err.statusCode = 409;
            err.code = 'COUPON_IN_ACTIVE_USE';
            throw err;
          }

          const { error: updateError } = await supabase
            .from('coupons')
            .update({ deleted_at: new Date().toISOString(), deleted_by: r.userId || null, is_active: false })
            .eq('id', couponId);

          if (updateError) throw updateError;

          await auditLogsRepo.create({
            user_id: r.userId || null,
            action: 'delete_coupon',
            table_name: 'coupons',
            record_id: couponId,
            ip_address: req.ip,
            metadata: {
              coupon_id: couponId,
              code: (existing as any).code,
              used_count: (existing as any).used_count,
              expires_at: (existing as any).expires_at,
              was_active: (existing as any).is_active,
            },
          });

          const isImportant = Boolean((existing as any).is_active) || Number((existing as any).used_count || 0) > 0;
          if (isImportant) {
            const { data: admins, error: adminsError } = await supabase
              .from('profiles')
              .select('id')
              .eq('role', 'admin');

            if (adminsError) throw adminsError;

            const adminIds = (admins || [])
              .map((a: any) => String(a.id))
              .filter((id: string) => id && id !== (r.userId || ''));

            await Promise.all(
              adminIds.map((adminId) =>
                notificationsRepo.create({
                  user_id: adminId,
                  type: 'admin_coupon_deleted',
                  title: { pt: 'Cupom excluído', en: 'Coupon deleted' },
                  content: {
                    pt: `O cupom ${(existing as any).code} foi excluído por um administrador.`,
                    en: `Coupon ${(existing as any).code} was deleted by an administrator.`,
                  },
                  link_url: '/admin',
                })
              )
            );
          }

          res.status(204).send();
        } catch (error: unknown) {
          next(error);
        }
      },
    },
    {
      method: 'get',
      path: '/code/:code',
      middleware: [
        cacheJson({ prefix: 'coupons:code', ttlSeconds: 60, cacheControl: 'public, max-age=60, stale-while-revalidate=120' }),
        optionalAuth
      ],
      handler: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
          const coupon = await couponsRepo.getByCode(req.params.code);
          if (!coupon) {
            res.status(404).json({ error: { message: 'Coupon not found' } });
            return;
          }
          res.json(coupon);
        } catch (error: unknown) {
          next(error);
        }
      }
    },
    {
      method: 'post',
      path: '/validate',
      middleware: [optionalAuth],
      handler: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
          const r = req as AuthenticatedRequest;
          const { code, cart_items, subtotal } = req.body;

          if (!code || typeof code !== 'string') {
            res.status(400).json({ error: { message: 'Código do cupom é obrigatório' } });
            return;
          }

          if (!Array.isArray(cart_items) || cart_items.length === 0) {
            res.status(400).json({ error: { message: 'Carrinho não pode estar vazio' } });
            return;
          }

          if (typeof subtotal !== 'number' || subtotal <= 0) {
            res.status(400).json({ error: { message: 'Subtotal inválido' } });
            return;
          }

          const result = await couponValidationService.validateCoupon(
            code,
            r.userId || null,
            cart_items,
            subtotal
          );

          if (!result.valid) {
            res.status(400).json({
              error: {
                message: result.error,
                code: result.errorCode
              }
            });
            return;
          }

          res.json({
            valid: true,
            coupon: {
              id: result.coupon?.id,
              code: result.coupon?.code,
              discount_type: result.coupon?.discount_type,
              discount_value: result.coupon?.discount_value
            },
            discount: result.discount
          });
        } catch (error: unknown) {
          next(error);
        }
      }
    }
  ]
});

export default router;
