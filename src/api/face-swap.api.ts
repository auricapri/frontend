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
   * Rota: POST /api/ai/face-swap (proxy para AI API com autenticação)
   */
  async process(request: FaceSwapRequest): Promise<FaceSwapResponse> {
    return faceSwapClient.post<FaceSwapResponse>('/ai/face-swap', request);
  }

  /**
   * Verifica disponibilidade do serviço de face swap
   * Rota: GET /api/ai/face-swap/status
   */
  async getStatus(): Promise<FaceSwapStatus> {
    return faceSwapClient.get<FaceSwapStatus>('/ai/face-swap/status');
  }
}

export const faceSwapApi = new FaceSwapApi();
