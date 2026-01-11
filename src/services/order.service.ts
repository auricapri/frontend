import { Order, CartItem, AddressData, InternalLogisticsInfo } from '../types';
import { OrdersRepository } from '../api/repositories/orders.repository';
import { UsersRepository } from '../api/repositories/users.repository';

export class OrderService {
  private ordersRepo: OrdersRepository;
  private usersRepo: UsersRepository;

  constructor() {
    this.ordersRepo = new OrdersRepository();
    this.usersRepo = new UsersRepository();
  }

  async createOrder(
    items: CartItem[],
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    paymentMethod: 'credit_card' | 'pix',
    subtotal: number,
    finalAmount: number,
    userId?: string
  ): Promise<Order> {
    const discountAmount = subtotal - finalAmount;

    // Save address if user is logged in
    if (userId) {
      const isFirstAddress = true; // Check if user has addresses
      const newAddrPayload = {
        user_id: userId,
        line1: addressData.logradouro + (addressData.numero ? `, ${addressData.numero}` : ''),
        line2: addressData.bairro + (addressData.complemento ? ` - ${addressData.complemento}` : ''),
        city: addressData.localidade,
        state: addressData.uf,
        postal_code: addressData.cep || '',
        country: 'BR',
        is_default: isFirstAddress 
      };
      
      const addrData = await this.usersRepo.createAddress(newAddrPayload);
      if (addrData && addrData.id && isFirstAddress) {
        await this.usersRepo.setDefaultAddress(addrData.id);
      }
    }

    const order = await this.ordersRepo.create({
      items,
      addressData,
      logisticsInfo,
      paymentMethod,
      subtotal,
      finalAmount
    });

    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.ordersRepo.getById(id);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await this.ordersRepo.getByUserId(userId);
  }

  async updateOrderStatus(id: string, status: string, trackingCode?: string): Promise<Order> {
    return await this.ordersRepo.updateStatus(id, status, trackingCode);
  }
}

