/**
 * Feature Feedback API Service
 * Gerencia avaliações de funcionalidades como Provador Virtual e Pós-Compra
 */

import { supabase } from '../utils/supabase';

export type FeedbackType = 'virtual_try_on' | 'post_purchase';

export interface FeatureFeedback {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CreateFeedbackRequest {
  feedback_type: FeedbackType;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface FeedbackStatistics {
  feedback_type: FeedbackType;
  total_feedbacks: number;
  average_rating: number;
  excellent_count: number;
  good_count: number;
  neutral_count: number;
  bad_count: number;
  terrible_count: number;
  feedback_date: string;
}

class FeedbackApi {
  /**
   * Verifica se o usuário já deu feedback para um tipo específico
   */
  async hasFeedback(feedbackType: FeedbackType): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('feature_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('feedback_type', feedbackType)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar feedback:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Obtém o feedback do usuário para um tipo específico
   */
  async getFeedback(feedbackType: FeedbackType): Promise<FeatureFeedback | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('feature_feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('feedback_type', feedbackType)
      .maybeSingle();

    if (error) {
      console.error('Erro ao obter feedback:', error);
      return null;
    }

    return data;
  }

  /**
   * Cria um novo feedback
   */
  async createFeedback(request: CreateFeedbackRequest): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verifica se já existe feedback
    const hasExisting = await this.hasFeedback(request.feedback_type);
    if (hasExisting) {
      return { success: false, error: 'Você já enviou feedback para esta funcionalidade' };
    }

    const { error } = await supabase
      .from('feature_feedback')
      .insert({
        user_id: user.id,
        feedback_type: request.feedback_type,
        rating: request.rating,
        comment: request.comment || null,
        metadata: request.metadata || {},
      });

    if (error) {
      console.error('Erro ao criar feedback:', error);
      if (error.code === '23505') {
        return { success: false, error: 'Você já enviou feedback para esta funcionalidade' };
      }
      return { success: false, error: 'Erro ao enviar feedback' };
    }

    return { success: true };
  }

  /**
   * Atualiza um feedback existente
   */
  async updateFeedback(
    feedbackType: FeedbackType,
    updates: Partial<Pick<CreateFeedbackRequest, 'rating' | 'comment'>>
  ): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('feature_feedback')
      .update(updates)
      .eq('user_id', user.id)
      .eq('feedback_type', feedbackType);

    if (error) {
      console.error('Erro ao atualizar feedback:', error);
      return { success: false, error: 'Erro ao atualizar feedback' };
    }

    return { success: true };
  }

  /**
   * Obtém estatísticas de feedback (apenas para admins)
   */
  async getStatistics(feedbackType?: FeedbackType): Promise<FeedbackStatistics[]> {
    let query = supabase
      .from('feedback_statistics')
      .select('*')
      .order('feedback_date', { ascending: false })
      .limit(30);

    if (feedbackType) {
      query = query.eq('feedback_type', feedbackType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao obter estatísticas:', error);
      return [];
    }

    return data || [];
  }
}

export const feedbackApi = new FeedbackApi();
