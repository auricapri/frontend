/**
 * Garment Transfer API Service
 * Virtual try-on functionality for e-commerce
 */

import { apiClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface Garment {
  id: string;
  name: string;
  image_url: string;
  category?: string;
  status: 'pending' | 'ready' | 'error';
  created_at: string;
}

export interface GarmentModel {
  id: string;
  name: string;
  image_url: string;
  gender?: 'male' | 'female' | 'neutral';
  body_type?: string;
  status: 'pending' | 'ready' | 'error';
  created_at: string;
}

export interface TransferJob {
  id: string;
  garment_id: string;
  model_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  error?: string;
  processing_time_ms?: number;
  created_at: string;
  completed_at?: string;
}

export interface TransferResult {
  id: string;
  garment: Garment;
  model: GarmentModel;
  result_url: string;
  status: 'pending_review' | 'approved' | 'rejected';
  created_at: string;
}

export interface GalleryItem {
  id: string;
  garment: Garment;
  model: GarmentModel;
  result_url: string;
  approved_at: string;
}

export interface UploadResponse {
  id: string;
  status: string;
  message?: string;
}

export interface ReviewResponse {
  item?: TransferResult;
  remaining_count: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ============================================================================
// API Class
// ============================================================================

export class GarmentTransferApi {
  // -------------------------------------------------------------------------
  // Garments
  // -------------------------------------------------------------------------

  /**
   * Upload a garment image
   */
  async uploadGarment(
    file: File,
    name: string,
    category?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (category) formData.append('category', category);

    return apiClient.post<UploadResponse>('/garment-transfer/garments', formData);
  }

  /**
   * List all garments
   */
  async listGarments(page = 1, perPage = 20): Promise<PaginatedResponse<Garment>> {
    return apiClient.get<PaginatedResponse<Garment>>(
      `/garment-transfer/garments?page=${page}&per_page=${perPage}`
    );
  }

  /**
   * Get a specific garment
   */
  async getGarment(id: string): Promise<Garment> {
    return apiClient.get<Garment>(`/garment-transfer/garments/${id}`);
  }

  /**
   * Delete a garment
   */
  async deleteGarment(id: string): Promise<void> {
    return apiClient.delete(`/garment-transfer/garments/${id}`);
  }

  // -------------------------------------------------------------------------
  // Models
  // -------------------------------------------------------------------------

  /**
   * Upload a model image
   */
  async uploadModel(
    file: File,
    name: string,
    gender?: 'male' | 'female' | 'neutral',
    bodyType?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (gender) formData.append('gender', gender);
    if (bodyType) formData.append('body_type', bodyType);

    return apiClient.post<UploadResponse>('/garment-transfer/models', formData);
  }

  /**
   * List all models
   */
  async listModels(page = 1, perPage = 20): Promise<PaginatedResponse<GarmentModel>> {
    return apiClient.get<PaginatedResponse<GarmentModel>>(
      `/garment-transfer/models?page=${page}&per_page=${perPage}`
    );
  }

  /**
   * Get a specific model
   */
  async getModel(id: string): Promise<GarmentModel> {
    return apiClient.get<GarmentModel>(`/garment-transfer/models/${id}`);
  }

  /**
   * Delete a model
   */
  async deleteModel(id: string): Promise<void> {
    return apiClient.delete(`/garment-transfer/models/${id}`);
  }

  // -------------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------------

  /**
   * Start a garment transfer job
   */
  async startTransfer(garmentId: string, modelId: string): Promise<TransferJob> {
    return apiClient.post<TransferJob>('/garment-transfer/process', {
      garment_id: garmentId,
      model_id: modelId,
    });
  }

  /**
   * Get transfer job status
   */
  async getTransferStatus(jobId: string): Promise<TransferJob> {
    return apiClient.get<TransferJob>(`/garment-transfer/process/${jobId}`);
  }

  /**
   * Poll for transfer completion
   */
  async waitForTransfer(jobId: string, maxWaitMs = 120000): Promise<TransferJob> {
    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getTransferStatus(jobId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Transfer timed out');
  }

  // -------------------------------------------------------------------------
  // Review
  // -------------------------------------------------------------------------

  /**
   * Get next item for review
   */
  async getNextForReview(): Promise<ReviewResponse> {
    return apiClient.get<ReviewResponse>('/garment-transfer/review/next');
  }

  /**
   * Approve a transfer result
   */
  async approveResult(resultId: string): Promise<void> {
    return apiClient.post(`/garment-transfer/review/${resultId}/approve`);
  }

  /**
   * Reject a transfer result
   */
  async rejectResult(resultId: string, reason?: string): Promise<void> {
    return apiClient.post(`/garment-transfer/review/${resultId}/reject`, { reason });
  }

  // -------------------------------------------------------------------------
  // Gallery
  // -------------------------------------------------------------------------

  /**
   * List approved gallery items
   */
  async listGallery(
    page = 1,
    perPage = 20,
    garmentId?: string
  ): Promise<PaginatedResponse<GalleryItem>> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (garmentId) params.append('garment_id', garmentId);

    return apiClient.get<PaginatedResponse<GalleryItem>>(
      `/garment-transfer/gallery?${params.toString()}`
    );
  }

  /**
   * Remove item from gallery
   */
  async removeFromGallery(itemId: string): Promise<void> {
    return apiClient.delete(`/garment-transfer/gallery/${itemId}`);
  }
}

export const garmentTransferApi = new GarmentTransferApi();
