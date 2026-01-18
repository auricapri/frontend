import { NotificationsRepository } from '../repositories/notifications.repository.js';

export class NotificationsService {
  private notificationsRepo: NotificationsRepository;

  constructor() {
    this.notificationsRepo = new NotificationsRepository();
  }

  async createOrderNotification(
    userId: string,
    orderId: string,
    type: 'order_confirmed' | 'order_shipped' | 'order_delivered',
    _locale: 'pt' | 'en' = 'pt'
  ): Promise<void> {
    const titles = {
      order_confirmed: { pt: 'Pedido Confirmado', en: 'Order Confirmed' },
      order_shipped: { pt: 'Pedido Enviado', en: 'Order Shipped' },
      order_delivered: { pt: 'Pedido Entregue', en: 'Order Delivered' }
    };

    const contents = {
      order_confirmed: {
        pt: `Seu pedido #${orderId.slice(0, 8)} foi confirmado e está sendo processado.`,
        en: `Your order #${orderId.slice(0, 8)} has been confirmed and is being processed.`
      },
      order_shipped: {
        pt: `Seu pedido #${orderId.slice(0, 8)} foi enviado! Acompanhe o rastreamento.`,
        en: `Your order #${orderId.slice(0, 8)} has been shipped! Track your order.`
      },
      order_delivered: {
        pt: `Seu pedido #${orderId.slice(0, 8)} foi entregue! Esperamos que tenha gostado.`,
        en: `Your order #${orderId.slice(0, 8)} has been delivered! We hope you enjoy it.`
      }
    };

    await this.notificationsRepo.create({
      user_id: userId,
      type,
      title: titles[type],
      content: contents[type],
      link_url: `/receipt?order=${orderId}`
    });
  }
}
