import { Router, Response, NextFunction } from 'express';
import { PDFService } from '../../services/pdf.service.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { OrdersRepository } from '../../repositories/orders.repository.js';

const router = Router();
const pdfService = new PDFService();
const ordersRepo = new OrdersRepository();

/**
 * Calculate logistics metrics for an order
 */
const calculateLogisticsMetrics = (order: any) => {
  let totalWeight = 0;
  const items = order.items || [];
  
  items.forEach((item: any) => {
    // Estimate weight per item (default 200g if not specified)
    const itemWeight = 200;
    totalWeight += itemWeight * item.quantity;
  });
  
  // Default dimensions
  const dimensions = '30x20x15 cm';
  
  return {
    totalWeight,
    dimensions,
  };
};

// GET /api/pdf/receipt/:orderId - Generate receipt PDF
router.get('/receipt/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    
    // Verify order exists and user has access
    const order = await ordersRepo.getById(orderId);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }
    
    // Check if user owns this order or is admin
    if (order.user_id && order.user_id !== req.userId) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    
    const pdfBuffer = await pdfService.generateReceiptPDF(orderId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comprovante-${orderId.slice(0, 8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    res.send(pdfBuffer);
  } catch (error: unknown) {
    next(error);
  }
});

// GET /api/pdf/plp/:orderId - Generate PLP PDF
router.get('/plp/:orderId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    
    // Verify order exists
    const order = await ordersRepo.getById(orderId);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }
    
    // Calculate logistics metrics
    const metrics = calculateLogisticsMetrics(order);
    
    const pdfBuffer = await pdfService.generatePLPPDF(orderId, metrics);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PLP-${orderId.slice(0, 8)}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    
    res.send(pdfBuffer);
  } catch (error: unknown) {
    next(error);
  }
});

export default router;

