/**
 * Marketplace Shipping API
 */
import { apiClient } from '../client';
import type { MarketplaceShipment } from './types';

const BASE_PATH = '/marketplace';

/**
 * Get shipment details.
 */
export async function getShipment(configId: string, shipmentId: string): Promise<MarketplaceShipment> {
  return apiClient.get<MarketplaceShipment>(`${BASE_PATH}/shipping/${shipmentId}?config_id=${configId}`);
}

/**
 * Update shipment tracking.
 */
export async function updateShipmentTracking(
  configId: string,
  shipmentId: string,
  trackingNumber: string,
  carrier?: string
): Promise<{ status: string; message: string }> {
  return apiClient.put<{ status: string; message: string }>(
    `${BASE_PATH}/shipping/${shipmentId}/tracking`,
    {
      config_id: configId,
      tracking_number: trackingNumber,
      carrier,
    }
  );
}

/**
 * Get shipping label URL.
 */
export function getShippingLabelUrl(configId: string, shipmentId: string): string {
  return `${BASE_PATH}/shipping/${shipmentId}/label?config_id=${configId}`;
}
