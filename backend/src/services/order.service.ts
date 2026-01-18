import { OrdersRepository } from '../repositories/orders.repository.js';
import type { Order, AddressData, InternalLogisticsInfo } from '../repositories/orders.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { StockService } from './stock.service.js';
import { LoyaltyService } from './loyalty.service.js';
import { ProductsRepository } from '../repositories/products.repository.js';
import { AssetsRepository } from '../repositories/assets.repository.js';
import { StoreRepository } from '../repositories/store.repository.js';
import { OrderStatusHistoryRepository } from '../repositories/order_status_history.repository.js';
import { ShipmentsRepository } from '../repositories/shipments.repository.js';
import { PaymentsRepository } from '../repositories/payments.repository.js';
import { NotificationsService } from './notifications.service.js';
import { supabase } from '../config/supabase.js';
import type { CartItem } from '../../shared/types/index.js';
import { OrderStatus, PaymentMethod } from '../../shared/types/enums.js';
import logger from '../config/logger.js';

export class OrderService {
  private ordersRepo: OrdersRepository;
  private usersRepo: UsersRepository;
  private stockService: StockService;
  private loyaltyService: LoyaltyService;
  private productsRepo: ProductsRepository;
  private assetsRepo: AssetsRepository;
  private storeRepo: StoreRepository;
  private statusHistoryRepo: OrderStatusHistoryRepository;
  private shipmentsRepo: ShipmentsRepository;
  private paymentsRepo: PaymentsRepository;
  private notificationsService: NotificationsService;

  constructor() {
    this.ordersRepo = new OrdersRepository();
    this.usersRepo = new UsersRepository();
    this.stockService = new StockService();
    this.loyaltyService = new LoyaltyService();
    this.productsRepo = new ProductsRepository();
    this.assetsRepo = new AssetsRepository();
    this.storeRepo = new StoreRepository();
    this.statusHistoryRepo = new OrderStatusHistoryRepository();
    this.shipmentsRepo = new ShipmentsRepository();
    this.paymentsRepo = new PaymentsRepository();
    this.notificationsService = new NotificationsService();
  }

  /**
   * Build address payload from AddressData
   */
  private buildAddressPayload(addressData: AddressData, userId: string, isDefault: boolean) {
    const streetParts = [addressData.logradouro];
    if (addressData.numero) streetParts.push(`, ${addressData.numero}`);
    if (addressData.bairro) streetParts.push(` - ${addressData.bairro}`);
    if (addressData.complemento) streetParts.push(` - ${addressData.complemento}`);

    return {
      user_id: userId,
      type: 'shipping' as const,
      street_address: streetParts.join(''),
      city: addressData.localidade,
      state_province: addressData.uf,
      postal_code: addressData.cep || '',
      country_code: 'BR',
      is_default: isDefault
    };
  }

  async createOrder(
    items: CartItem[],
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    subtotal: number,
    finalAmount: number,
    userId?: string,
    giftForUserId?: string,
    _wishlistSlug?: string,
    clientIp?: string,
    couponId?: string
  ): Promise<Order> {
    // Extrair custo de frete do logisticsInfo
    const shippingCost = logisticsInfo?.real_cost ?? 0;
    // Cálculo correto do desconto: subtotal + frete - total final
    // Se subtotal=100, frete=30, finalAmount=120 → desconto=10
    const discountAmount = Math.max(0, subtotal + shippingCost - finalAmount);

    // Save address if user is logged in
    if (userId) {
      const user = await this.usersRepo.getProfile(userId);
      const isFirstAddress = !user?.default_address;
      const newAddrPayload = this.buildAddressPayload(addressData, userId, isFirstAddress);

      const addrData = await this.usersRepo.createAddress(newAddrPayload);
      if (addrData && isFirstAddress) {
        await this.usersRepo.setDefaultAddress(userId, addrData.id);
      }
    }

    // Determine the order owner: if it's a gift, the gift recipient owns the order
    const orderOwnerId = giftForUserId || userId;

    // Create order
    const order = await this.ordersRepo.create({
      user_id: orderOwnerId,
      gift_from_user_id: giftForUserId ? userId : null,
      items,
      subtotal,
      total_amount: finalAmount,
      discount_amount: discountAmount,
      shipping_cost: 0,
      tax_amount: 0,
      status: OrderStatus.CONFIRMED,
      payment_method: paymentMethod as 'credit_card' | 'pix' | 'boleto',
      shipping_address_snapshot: addressData,
      internal_logistics: logisticsInfo,
      client_ip: clientIp || null,
      coupon_id: couponId || null
    });

    // Create payment record
    try {
      await this.paymentsRepo.create({
        order_id: order.id,
        provider_code: paymentMethod === PaymentMethod.CREDIT_CARD ? 'stripe' : 'pix',
        status: 'succeeded',
        amount: finalAmount,
        currency: 'BRL',
        metadata: { payment_method: paymentMethod }
      });
    } catch (paymentError) {
      logger.error('Error creating payment record', {
        orderId: order.id,
        error: paymentError instanceof Error ? paymentError.message : String(paymentError),
        stack: paymentError instanceof Error ? paymentError.stack : undefined,
      });
    }

    // Create status history
    try {
      await this.statusHistoryRepo.create({
        order_id: order.id,
        old_status: null,
        new_status: OrderStatus.CONFIRMED,
        changed_by: userId || null
      });
    } catch (historyError) {
      logger.error('Error creating status history', {
        orderId: order.id,
        error: historyError instanceof Error ? historyError.message : String(historyError),
      });
    }

    // Send notification to gift recipient if it's a gift
    if (giftForUserId && userId) {
      try {
        await this.notificationsService.createOrderNotification(giftForUserId, order.id, 'order_confirmed', 'pt');
      } catch (notifError) {
        logger.error('Error sending gift notification', {
          orderId: order.id,
          giftForUserId,
          error: notifError instanceof Error ? notifError.message : String(notifError),
        });
      }
    } else if (userId) {
      // Send notification to buyer if not a gift
      try {
        await this.notificationsService.createOrderNotification(userId, order.id, 'order_confirmed', 'pt');
      } catch (notifError) {
        logger.error('Error sending notification', {
          orderId: order.id,
          userId,
          error: notifError instanceof Error ? notifError.message : String(notifError),
        });
      }
    }

    // Update stock after order creation
    try {
      const products = await this.productsRepo.getAllActive();
      const assets = await this.assetsRepo.getAll();
      await this.stockService.updateStockAfterOrder(items, products, assets);
    } catch (stockError) {
      logger.error('Error updating stock', {
        orderId: order.id,
        error: stockError instanceof Error ? stockError.message : String(stockError),
      });
    }

    // Process loyalty if user is logged in (only for the buyer, not gift recipient)
    if (userId && !giftForUserId) {
      try {
        const user = await this.usersRepo.getProfile(userId);
        const storeConfig = await this.storeRepo.getConfig();
        
        if (user && storeConfig?.loyalty_program?.enabled) {
          const config = storeConfig.loyalty_program;
          const userLoyalty = user.loyalty || { current_xp: 0, current_level: 1, cashback_balance: 0 };
          
          // Calculate earnings
          const { xp: xpEarned, cashback: cashbackEarned } = this.loyaltyService.calculateEarnings(finalAmount, config);
          
          let newXP = userLoyalty.current_xp + xpEarned;
          let newCashback = userLoyalty.cashback_balance + cashbackEarned;
          let newLevel = this.loyaltyService.checkLevelUp(newXP, userLoyalty.current_level, config);
          let rewardPending = userLoyalty.pending_reward_coupon;

          // Check for level up
          if (newLevel > userLoyalty.current_level) {
            const reward = await this.loyaltyService.generateLevelUpCoupon(newLevel, config);
            if (reward) {
              rewardPending = {
                ...reward,
                level_reached: newLevel
              };
            }
          }

          // Update user loyalty
          const updatedLoyalty = {
            current_xp: newXP,
            current_level: newLevel,
            cashback_balance: newCashback,
            pending_reward_coupon: rewardPending
          };

          await this.usersRepo.updateProfile(userId, { loyalty: updatedLoyalty });
        }
        } catch (loyaltyError) {
          logger.error('Error processing loyalty', {
            orderId: order.id,
            userId,
            error: loyaltyError instanceof Error ? loyaltyError.message : String(loyaltyError),
          });
        }
    }

    return order;
  }

  async createPendingPaymentOrder(
    items: CartItem[],
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    subtotal: number,
    finalAmount: number,
    userId?: string,
    giftForUserId?: string,
    _wishlistSlug?: string,
    clientIp?: string,
    couponId?: string
  ): Promise<Order> {
    // Extrair custo de frete do logisticsInfo
    const shippingCost = logisticsInfo?.real_cost ?? 0;
    // Cálculo correto do desconto: subtotal + frete - total final
    const discountAmount = Math.max(0, subtotal + shippingCost - finalAmount);

    if (userId) {
      const user = await this.usersRepo.getProfile(userId);
      const isFirstAddress = !user?.default_address;
      const newAddrPayload = this.buildAddressPayload(addressData, userId, isFirstAddress);

      const addrData = await this.usersRepo.createAddress(newAddrPayload);
      if (addrData && isFirstAddress) {
        await this.usersRepo.setDefaultAddress(userId, addrData.id);
      }
    }

    const orderOwnerId = giftForUserId || userId;

    const orderData: {
      user_id?: string;
      gift_from_user_id?: string | null;
      items: CartItem[];
      subtotal: number;
      total_amount: number;
      discount_amount: number;
      shipping_cost: number;
      tax_amount: number;
      status: string;
      payment_method: 'credit_card' | 'pix' | 'boleto';
      shipping_address_snapshot: AddressData;
      internal_logistics: InternalLogisticsInfo;
      client_ip?: string | null;
      coupon_id?: string | null;
    } = {
      user_id: orderOwnerId,
      gift_from_user_id: giftForUserId ? userId : null,
      items,
      subtotal,
      total_amount: finalAmount,
      discount_amount: discountAmount,
      shipping_cost: 0,
      tax_amount: 0,
      status: OrderStatus.PENDING,
      payment_method: 'credit_card',
      shipping_address_snapshot: addressData,
      internal_logistics: logisticsInfo,
      client_ip: clientIp || null,
      coupon_id: couponId || null
    };

    const order = await this.ordersRepo.create(orderData);

    try {
      await this.statusHistoryRepo.create({
        order_id: order.id,
        old_status: null,
        new_status: OrderStatus.PENDING,
        changed_by: userId || null
      });
    } catch (historyError) {
      logger.error('Error creating status history', {
        orderId: order.id,
        error: historyError instanceof Error ? historyError.message : String(historyError),
      });
    }

    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.ordersRepo.getById(id);
  }

  async getUserOrders(userId: string, options?: { limit?: number; offset?: number }): Promise<Order[]> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }

      const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
      const offset = Math.max(options?.offset || 0, 0);

      const ORDER_FIELDS = 'id, user_id, created_at, status, total_amount, subtotal, discount_amount, shipping_cost, tax_amount, payment_method, items, tracking_code, internal_logistics, shipping_address_snapshot, gift_from_user_id, client_ip, coupon_id';

      const { data: ordersAsOwner, error: error1 } = await supabase
        .from('orders')
        .select(ORDER_FIELDS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: ordersAsGift, error: error2 } = await supabase
        .from('orders')
        .select(ORDER_FIELDS)
        .eq('gift_from_user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error1) {
        logger.error('Error fetching user orders as owner from Supabase', { 
          error: error1.message || error1, 
          code: error1.code,
          details: error1.details,
          hint: error1.hint,
          userId 
        });
        throw error1;
      }

      if (error2) {
        logger.error('Error fetching user orders as gift from Supabase', { 
          error: error2.message || error2, 
          code: error2.code,
          details: error2.details,
          hint: error2.hint,
          userId 
        });
        throw error2;
      }

      const allOrders = [...(ordersAsOwner || []), ...(ordersAsGift || [])];
      const uniqueOrders = Array.from(
        new Map(allOrders.map(order => [order.id, order])).values()
      );

      interface OrderRow {
        id: string;
        user_id?: string | null;
        created_at: string;
        status: string;
        total_amount?: number;
        total?: number;
        items?: CartItem[];
        [key: string]: unknown;
      }

      const sortedOrders = uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      
      return sortedOrders.map((o: OrderRow) => ({
        ...o,
        total: o.total_amount || o.total || 0,
        items: o.items || []
      })) as Order[];
    } catch (error: unknown) {
      logger.error('Error in getUserOrders', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string, trackingCode?: string, changedBy?: string): Promise<Order> {
    // Get current order to get old status
    const currentOrder = await this.ordersRepo.getById(id);
    if (!currentOrder) {
      throw new Error('Order not found');
    }

    const oldStatus = currentOrder.status;

    // Update order status
    const order = await this.ordersRepo.updateStatus(id, status, trackingCode, oldStatus);

    // Create status history
    try {
      await this.statusHistoryRepo.create({
        order_id: id,
        old_status: oldStatus,
        new_status: status,
        changed_by: changedBy || null
      });
    } catch (historyError) {
      logger.error('Error creating status history', {
        orderId: id,
        error: historyError instanceof Error ? historyError.message : String(historyError),
      });
    }

    // Create shipment if status is 'shipped'
    if (status === OrderStatus.SHIPPED && trackingCode) {
      try {
        await this.shipmentsRepo.create({
          order_id: id,
          tracking_code: trackingCode,
          status: 'in_transit',
          shipped_at: new Date().toISOString()
        });
      } catch (shipmentError) {
        logger.error('Error creating shipment', {
          orderId: id,
          error: shipmentError instanceof Error ? shipmentError.message : String(shipmentError),
        });
      }
    }

    // Send notification if user is logged in
    if (order.user_id) {
      try {
        if (status === OrderStatus.SHIPPED) {
          await this.notificationsService.createOrderNotification(order.user_id, id, 'order_shipped', 'pt');
        } else if (status === OrderStatus.DELIVERED) {
          await this.notificationsService.createOrderNotification(order.user_id, id, 'order_delivered', 'pt');
        }
      } catch (notifError) {
        logger.error('Error sending notification', {
          orderId: id,
          userId: order.user_id,
          error: notifError instanceof Error ? notifError.message : String(notifError),
        });
      }
    }

    return order;
  }
}
