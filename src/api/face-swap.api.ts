/**
 * Face Swap API Service
 * Comunicação com a API de face swap para experimentação virtual
 */

import { faceSwapClient } from './client';

// Interfaces
export interface FaceSwapRequest {
  user_id: string;
  variant_id: string;
  user_image: string; // base64
}

export interface FaceSwapResponse {
  status: 'success' | 'error';
  image?: string; // base64 do resultado
  error?: string;
  processing_time_ms: number;
}

export interface FaceSwapStatus {
  available: boolean;
  active_requests: number;
  queued_requests: number;
  can_process_immediately: boolean;
}

export class FaceSwapApi {
  /**
   * Processa face swap com a imagem do usuário
   */
  async process(request: FaceSwapRequest): Promise<FaceSwapResponse> {
    return faceSwapClient.post<FaceSwapResponse>('/face-swap', request);
  }

  /**
   * Verifica disponibilidade do serviço de face swap
   */
  async getStatus(): Promise<FaceSwapStatus> {
    return faceSwapClient.get<FaceSwapStatus>('/face-swap/status');
  }
}

export const faceSwapApi = new FaceSwapApi();
