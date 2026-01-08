import { apiClient } from './client';
import { DreamBoard, DreamCard, DreamComment, BoardColumn, Product, Collection, DiagramData } from '../types';

export class DreamApi {
  async getAllBoards(): Promise<DreamBoard[]> {
    return apiClient.get<DreamBoard[]>('/dream/boards');
  }

  async getBoardById(id: string): Promise<DreamBoard | null> {
    return apiClient.get<DreamBoard | null>(`/dream/boards/${id}`);
  }

  async createBoard(data: { name: string; description?: string; created_by?: string }): Promise<DreamBoard> {
    return apiClient.post<DreamBoard>('/dream/boards', data);
  }

  async updateBoard(id: string, updates: Partial<DreamBoard>): Promise<DreamBoard> {
    return apiClient.put<DreamBoard>(`/dream/boards/${id}`, updates);
  }

  async updateBoardColumns(id: string, columns: BoardColumn[]): Promise<DreamBoard> {
    return apiClient.put<DreamBoard>(`/dream/boards/${id}/columns`, { columns });
  }

  async deleteBoard(id: string): Promise<void> {
    return apiClient.delete<void>(`/dream/boards/${id}`);
  }

  async getCardsByBoardId(boardId: string): Promise<DreamCard[]> {
    return apiClient.get<DreamCard[]>(`/dream/boards/${boardId}/cards`);
  }

  async getCardById(id: string): Promise<DreamCard | null> {
    return apiClient.get<DreamCard | null>(`/dream/cards/${id}`);
  }

  async createCard(data: Partial<DreamCard>): Promise<DreamCard> {
    return apiClient.post<DreamCard>('/dream/cards', data);
  }

  async updateCard(id: string, updates: Partial<DreamCard>): Promise<DreamCard> {
    return apiClient.put<DreamCard>(`/dream/cards/${id}`, updates);
  }

  async moveCard(id: string, columnId: string, position: number): Promise<DreamCard> {
    return apiClient.patch<DreamCard>(`/dream/cards/${id}/move`, { column_id: columnId, position });
  }

  async reorderCards(cards: { id: string; position: number; column_id: string }[]): Promise<void> {
    return apiClient.post<void>('/dream/cards/reorder', { cards });
  }

  async deleteCard(id: string): Promise<void> {
    return apiClient.delete<void>(`/dream/cards/${id}`);
  }

  async getCommentsByCardId(cardId: string): Promise<DreamComment[]> {
    return apiClient.get<DreamComment[]>(`/dream/cards/${cardId}/comments`);
  }

  async createComment(cardId: string, data: { content: string; user_id?: string; user_name?: string }): Promise<DreamComment> {
    return apiClient.post<DreamComment>(`/dream/cards/${cardId}/comments`, data);
  }

  async deleteComment(id: string): Promise<void> {
    return apiClient.delete<void>(`/dream/comments/${id}`);
  }

  async generateDraft(cardId: string): Promise<{ product_id?: string; collection_id?: string; category_id?: string }> {
    return apiClient.post<{ product_id?: string; collection_id?: string; category_id?: string }>(`/dream/cards/${cardId}/generate-draft`);
  }

  async completeCard(cardId: string): Promise<{ success: boolean; message: string; deletion_date: string }> {
    return apiClient.put<{ success: boolean; message: string; deletion_date: string }>(`/dream/cards/${cardId}/complete`);
  }

  async reopenCard(cardId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.put<{ success: boolean; message: string }>(`/dream/cards/${cardId}/reopen`);
  }

  async getDeletionInfo(cardId: string): Promise<{ is_completed: boolean; deletion_date: string | null; days_until_deletion: number | null }> {
    return apiClient.get<{ is_completed: boolean; deletion_date: string | null; days_until_deletion: number | null }>(`/dream/cards/${cardId}/deletion-info`);
  }

  async getProductsForDiagram(search?: string): Promise<Product[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient.get<Product[]>(`/dream/products${query}`);
  }

  async getCollectionsForDiagram(): Promise<Collection[]> {
    return apiClient.get<Collection[]>('/dream/collections');
  }

  async getCollectionProducts(collectionId: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/dream/collections/${collectionId}/products`);
  }

  async exportDiagram(cardId: string, diagram: DiagramData): Promise<{ 
    success: boolean; 
    productsCreated: number; 
    productsUpdated: number;
    variantsUpdated: number;
  }> {
    return apiClient.post(`/dream/cards/${cardId}/export`, { diagram });
  }
}

