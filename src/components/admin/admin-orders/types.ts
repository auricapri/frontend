/**
 * AdminOrders Types
 */
import { Order, Product, Asset, UserProfile, OrderEconomics } from '../../../types';
import { Locale } from '../../../i18n';
import { OrderStatus } from '../../../constants/enums';

export interface AdminOrdersProps {
  orders: Order[];
  products?: Product[];
  assets?: Asset[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus, trackingCode?: string) => void;
  locale: Locale;
}

export interface SLAStatus {
  color: string;
  priority: number;
  label: string;
}

export interface LogisticsMetrics {
  totalWeight: number;
  dimensions: string;
}

export interface ExtendedOrderEconomics extends OrderEconomics {
  gatewayRate: number;
  taxRate: number;
}

export interface OrderColumnProps {
  title: string;
  icon: React.ReactNode;
  iconBgClass: string;
  count: number;
  children: React.ReactNode;
  opacity?: boolean;
}

export interface OrderCardProps {
  order: Order;
  onClick: () => void;
  locale: Locale;
  children?: React.ReactNode;
}

export interface OrderModalProps {
  order: Order;
  economics: ExtendedOrderEconomics;
  logistics: LogisticsMetrics;
  customerData: UserProfile | null;
  loadingCustomer: boolean;
  isDocGenerated: boolean;
  isGeneratingLabel: boolean;
  trackingInput: string;
  products: Product[];
  assets: Asset[];
  locale: Locale;
  onClose: () => void;
  onTrackingChange: (value: string) => void;
  onGenerateDoc: () => void;
  onDispatch: () => void;
  onApprove: () => void;
  onReject: () => void;
  getLoc: (obj: any) => string;
}

export interface CustomerInfoProps {
  userId: string;
  customerData: UserProfile | null;
  loadingCustomer: boolean;
}

export interface ConfirmationStageProps {
  onApprove: () => void;
  onReject: () => void;
}

export interface ExpeditionStageProps {
  order: Order;
  logistics: LogisticsMetrics;
  isDocGenerated: boolean;
  isGeneratingLabel: boolean;
  trackingInput: string;
  onTrackingChange: (value: string) => void;
  onGenerateDoc: () => void;
  onDispatch: () => void;
}

export interface TransitStageProps {
  order: Order;
}

export interface OrderItemsProps {
  items: Order['items'];
  getLoc: (obj: any) => string;
  locale: Locale;
}

export interface FinancialSummaryProps {
  economics: ExtendedOrderEconomics;
  locale: Locale;
}
