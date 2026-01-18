import { Router } from 'express';
import { StoreRepository } from '../../repositories/store.repository.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();
const storeRepo = new StoreRepository();

// GET /api/banners - Get all active banners (public)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const banners = await storeRepo.getAllBanners();
    res.json(banners);
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/banners - Create banner (admin only)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { supabase } = await import('../../config/supabase.js');
    const { data, error } = await supabase
      .from('banners')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/banners/:id - Update banner (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { supabase } = await import('../../config/supabase.js');
    const { data, error } = await supabase
      .from('banners')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error: unknown) {
    next(error);
  }
});

// DELETE /api/banners/:id - Delete banner (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { supabase } = await import('../../config/supabase.js');
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

