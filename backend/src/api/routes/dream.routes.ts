import { Router, Request, Response } from 'express';
import { DreamService } from '../../services/dream.service.js';
import { CleanupRepository } from '../../repositories/cleanup.repository.js';
import { ProductsRepository } from '../../repositories/products.repository.js';
import { CollectionsRepository } from '../../repositories/collections.repository.js';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

const router = Router();
const dreamService = new DreamService();
const cleanupRepository = new CleanupRepository();
const productsRepository = new ProductsRepository();
const collectionsRepository = new CollectionsRepository();

router.get('/boards', async (req: Request, res: Response) => {
  try {
    const boards = await dreamService.getAllBoards();
    res.json(boards);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error fetching boards:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.get('/boards/:id', async (req: Request, res: Response) => {
  try {
    const board = await dreamService.getBoardById(req.params.id);
    if (!board) {
      return res.status(404).json({ error: { message: 'Board not found' } });
    }
    res.json(board);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error fetching board ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.post('/boards', async (req: Request, res: Response) => {
  try {
    const { name, description, created_by } = req.body;
    if (!name) {
      return res.status(400).json({ error: { message: 'Name is required' } });
    }
    const board = await dreamService.createBoard({ name, description, created_by });
    res.status(201).json(board);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error creating board:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.put('/boards/:id', async (req: Request, res: Response) => {
  try {
    const board = await dreamService.updateBoard(req.params.id, req.body);
    res.json(board);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error updating board ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.put('/boards/:id/columns', async (req: Request, res: Response) => {
  try {
    const { columns } = req.body;
    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: { message: 'Columns array is required' } });
    }
    const board = await dreamService.updateBoardColumns(req.params.id, columns);
    res.json(board);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error updating columns for board ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.delete('/boards/:id', async (req: Request, res: Response) => {
  try {
    await dreamService.deleteBoard(req.params.id);
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error deleting board ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.get('/boards/:id/cards', async (req: Request, res: Response) => {
  try {
    const cards = await dreamService.getCardsByBoardId(req.params.id);
    res.json(cards);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error fetching cards for board ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.post('/cards', async (req: Request, res: Response) => {
  try {
    const { board_id, column_id, title } = req.body;
    if (!board_id || !column_id || !title) {
      return res.status(400).json({ error: { message: 'board_id, column_id, and title are required' } });
    }
    const card = await dreamService.createCard(req.body);
    res.status(201).json(card);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error creating card:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.get('/cards/:id', async (req: Request, res: Response) => {
  try {
    const card = await dreamService.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: { message: 'Card not found' } });
    }
    res.json(card);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error fetching card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.put('/cards/:id', async (req: Request, res: Response) => {
  try {
    const card = await dreamService.updateCard(req.params.id, req.body);
    res.json(card);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error updating card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.patch('/cards/:id/move', async (req: Request, res: Response) => {
  try {
    const { column_id, position } = req.body;
    if (!column_id || position === undefined) {
      return res.status(400).json({ error: { message: 'column_id and position are required' } });
    }
    const card = await dreamService.moveCard(req.params.id, column_id, position);
    res.json(card);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error moving card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.post('/cards/reorder', async (req: Request, res: Response) => {
  try {
    const { cards } = req.body;
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: { message: 'cards array is required' } });
    }
    await dreamService.reorderCards(cards);
    res.status(200).json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error reordering cards:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.delete('/cards/:id', async (req: Request, res: Response) => {
  try {
    await dreamService.deleteCard(req.params.id);
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error deleting card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.get('/cards/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await dreamService.getCommentsByCardId(req.params.id);
    res.json(comments);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error fetching comments for card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.post('/cards/:id/comments', async (req: Request, res: Response) => {
  try {
    const { content, user_id, user_name } = req.body;
    if (!content) {
      return res.status(400).json({ error: { message: 'Content is required' } });
    }
    const comment = await dreamService.createComment({
      card_id: req.params.id,
      content,
      user_id,
      user_name,
    });
    res.status(201).json(comment);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error creating comment:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.delete('/comments/:id', async (req: Request, res: Response) => {
  try {
    await dreamService.deleteComment(req.params.id);
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error deleting comment ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

router.post('/cards/:id/generate-draft', async (req: Request, res: Response) => {
  try {
    const result = await dreamService.generateDraft(req.params.id);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error generating draft for card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// PUT /api/dream/cards/:id/complete - Marcar card como concluído
router.put('/cards/:id/complete', async (req: Request, res: Response) => {
  try {
    await cleanupRepository.markCardAsCompleted(req.params.id);
    
    // Calcular data de exclusão usando config centralizada
    const cleanupDays = env.cleanup.days;
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + cleanupDays);
    
    res.json({ 
      success: true, 
      message: `Card marcado como concluído. Será removido em ${cleanupDays} dias.`,
      deletion_date: deletionDate.toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error marking card ${req.params.id} as complete:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// PUT /api/dream/cards/:id/reopen - Remover marca de conclusão
router.put('/cards/:id/reopen', async (req: Request, res: Response) => {
  try {
    await cleanupRepository.unmarkCardAsCompleted(req.params.id);
    res.json({ 
      success: true, 
      message: 'Card reaberto. Não será mais removido automaticamente.'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error reopening card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// GET /api/dream/cards/:id/deletion-info - Obter informações de exclusão
router.get('/cards/:id/deletion-info', async (req: Request, res: Response) => {
  try {
    const cleanupDays = env.cleanup.days;
    const isCompleted = await cleanupRepository.isCardCompleted(req.params.id);
    const deletionDate = await cleanupRepository.getCardDeletionDate(req.params.id, cleanupDays);
    
    res.json({
      is_completed: isCompleted,
      deletion_date: deletionDate?.toISOString() || null,
      days_until_deletion: deletionDate 
        ? Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error fetching deletion info for card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// GET /api/dream/products - Listar produtos para o diagrama
router.get('/products', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    let products = await productsRepository.getAll();
    
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(p => {
        const name = typeof p.name === 'string' ? p.name : (p.name?.pt || p.name?.en || '');
        return name.toLowerCase().includes(searchLower);
      });
    }
    
    res.json(products);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error fetching products for diagram:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// GET /api/dream/collections - Listar coleções para o diagrama
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const collections = await collectionsRepository.getAll();
    res.json(collections);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error('Error fetching collections for diagram:', { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// GET /api/dream/collections/:id/products - Listar produtos de uma coleção
router.get('/collections/:id/products', async (req: Request, res: Response) => {
  try {
    const collectionId = req.params.id;
    const allProducts = await productsRepository.getAll();
    
    const collectionProducts = allProducts.filter(p => 
      p.collection_ids?.includes(collectionId)
    );
    
    res.json(collectionProducts);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error fetching products for collection ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

// POST /api/dream/cards/:id/export - Exportar diagrama para criação de produtos
router.post('/cards/:id/export', async (req: Request, res: Response) => {
  try {
    const cardId = req.params.id;
    const { diagram } = req.body;
    
    if (!diagram) {
      return res.status(400).json({ error: { message: 'Diagram data is required' } });
    }
    
    const result = await dreamService.exportDiagram(cardId, diagram);
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error exporting diagram for card ${req.params.id}:`, { error: errorMessage });
    res.status(500).json({ error: { message: errorMessage } });
  }
});

export default router;

