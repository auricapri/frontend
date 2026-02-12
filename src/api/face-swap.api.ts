/**
 * Face Swap / Virtual Try-On API Service
 * Comunicação com a API de experimentação virtual (Provador Virtual)
 */

import { apiClient } from './client';

// Interfaces
export interface FaceSwapRequest {
  user_id?: string; // Optional - not required by garment-transfer endpoint
  variant_id: string;
  user_image: string; // base64 with data URL prefix
}

export interface FaceSwapResponse {
  success: boolean;
  image_url?: string; // URL of result image
  job_id?: string;
  error?: string;
  // Legacy fields for backwards compatibility
  status?: 'success' | 'error';
  image?: string;
  processing_time_ms?: number;
}

export interface FaceSwapStatus {
  available: boolean;
  reason?: string;
  // Legacy fields
  active_requests?: number;
  queued_requests?: number;
  can_process_immediately?: boolean;
}

export class FaceSwapApi {
  /**
   * Processa virtual try-on com a imagem do usuário
   * Rota: POST /api/garment-transfer/try-on
   */
  async process(request: FaceSwapRequest): Promise<FaceSwapResponse> {
    const response = await apiClient.post<FaceSwapResponse>('/garment-transfer/try-on', {
      variant_id: request.variant_id,
      user_image: request.user_image,
    });

    // Map response for backwards compatibility
    return {
      ...response,
      status: response.success ? 'success' : 'error',
      image: response.image_url,
    };
  }

  /**
   * Verifica disponibilidade do serviço de try-on
   * Rota: GET /api/garment-transfer/try-on/status
   */
  async getStatus(): Promise<FaceSwapStatus> {
    const response = await apiClient.get<FaceSwapStatus>('/garment-transfer/try-on/status');
    return {
      ...response,
      can_process_immediately: response.available,
    };
  }
}

export const faceSwapApi = new FaceSwapApi();
