import { Router } from 'express';
import { StoreRepository } from '../../repositories/store.repository.js';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();
const storeRepo = new StoreRepository();

// GET /api/guides - Get all size guides (public)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const guides = await storeRepo.getAllSizeGuides();
    res.json(guides);
  } catch (error: unknown) {
    next(error);
  }
});

// POST /api/guides - Create size guide (admin only)
router.post('/', authenticate, async (req, res, next) => {
  try {
    // This will need to be added to StoreRepository
    // For now, we'll use a direct Supabase call in the route
    const { supabase } = await import('../../config/supabase.js');
    const { data, error } = await supabase
      .from('size_guides')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: unknown) {
    next(error);
  }
});

// PUT /api/guides/:id - Update size guide (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { supabase } = await import('../../config/supabase.js');
    const { data, error } = await supabase
      .from('size_guides')
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

// DELETE /api/guides/:id - Delete size guide (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { supabase } = await import('../../config/supabase.js');
    const { error } = await supabase
      .from('size_guides')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.status(204).send();
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

