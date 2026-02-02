import { Order, CartItem, AddressData, InternalLogisticsInfo } from '../types';
import { OrdersRepository } from '../api/repositories/orders.repository';
import { UsersRepository } from '../api/repositories/users.repository';
import { PaymentMethod, OrderStatus } from '../constants/enums';

/**
 * Serviço responsável pela criação e gestão de pedidos.
 * 
 * Gerencia a criação de pedidos, salvamento de endereços, atualização de status
 * e consulta de pedidos do usuário.
 * 
 * @example
 * ```ts
 * const service = new OrderService();
 * const order = await service.createOrder(
 *   cartItems,
 *   addressData,
 *   logisticsInfo,
 *   'credit_card',
 *   1000,
 *   950,
 *   userId
 * );
 * ```
 */
export class OrderService {
  private ordersRepo: OrdersRepository;
  private usersRepo: UsersRepository;

  constructor() {
    this.ordersRepo = new OrdersRepository();
    this.usersRepo = new UsersRepository();
  }

  /**
   * Cria um novo pedido a partir dos itens do carrinho.
   * 
   * Se o usuário estiver logado, salva o endereço de entrega automaticamente.
   * 
   * @param items - Itens do carrinho
   * @param addressData - Dados do endereço de entrega
   * @param logisticsInfo - Informações de logística (frete, transportadora)
   * @param paymentMethod - Método de pagamento
   * @param subtotal - Subtotal do pedido
   * @param finalAmount - Valor final após descontos
   * @param userId - ID do usuário (opcional, se logado)
   * @returns Pedido criado
   */
  async createOrder(
    items: CartItem[],
    addressData: AddressData,
    logisticsInfo: InternalLogisticsInfo,
    paymentMethod: PaymentMethod,
    subtotal: number,
    finalAmount: number,
    userId?: string
  ): Promise<Order> {
    // Save address if user is logged in
    if (userId) {
      const isFirstAddress = true; // Check if user has addresses
      const newAddrPayload = {
        user_id: userId,
        line1: addressData.logradouro + (addressData.numero ? `, ${addressData.numero}` : ''),
        line2: addressData.complemento || '',
        neighborhood: addressData.bairro || '',
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

  /**
   * Busca um pedido pelo ID.
   * 
   * @param id - ID do pedido
   * @returns Pedido encontrado ou null
   */
  async getOrderById(id: string): Promise<Order | null> {
    return await this.ordersRepo.getById(id);
  }

  /**
   * Busca todos os pedidos de um usuário.
   * 
   * @param userId - ID do usuário
   * @returns Lista de pedidos do usuário
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    return await this.ordersRepo.getByUserId(userId);
  }

  /**
   * Atualiza o status de um pedido.
   * 
   * @param id - ID do pedido
   * @param status - Novo status do pedido
   * @param trackingCode - Código de rastreamento (opcional)
   * @returns Pedido atualizado
   */
  async updateOrderStatus(id: string, status: OrderStatus, trackingCode?: string): Promise<Order> {
    return await this.ordersRepo.updateStatus(id, status, trackingCode);
  }
}
