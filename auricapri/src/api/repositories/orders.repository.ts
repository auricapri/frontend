import { Order, CartItem, AddressData, InternalLogisticsInfo } from '../../types';
import { OrdersApi } from '../orders.api';
import { PaymentMethod, OrderStatus } from '../../constants/enums';

export class OrdersRepository {
  private api: OrdersApi;

  constructor() {
    this.api = new OrdersApi();
  }

  async getAll(): Promise<Order[]> {
    return this.api.getAll();
  }

  async getById(id: string): Promise<Order | null> {
    return this.api.getById(id);
  }

  async create(order: {
    items: CartItem[];
    addressData: AddressData;
    logisticsInfo: InternalLogisticsInfo;
    paymentMethod: PaymentMethod;
    subtotal: number;
    finalAmount: number;
  }): Promise<Order> {
    return this.api.create(order);
  }

  async getByUserId(userId: string): Promise<Order[]> {
    return this.api.getByUserId(userId);
  }

  async updateStatus(id: string, status: OrderStatus, trackingCode?: string): Promise<Order> {
    return this.api.updateStatus(id, status, trackingCode);
  }
}
