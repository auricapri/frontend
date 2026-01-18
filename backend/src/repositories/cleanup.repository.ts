import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

export interface CleanupResult {
  deletedCount: number;
  errors: string[];
}

export class CleanupRepository {
  /**
   * Remove cards do dream board que foram concluídos há mais de X dias
   * Também remove: comments, drafts, e metadados associados
   */
  async cleanupCompletedDreamCards(daysThreshold: number = 2): Promise<CleanupResult> {
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      // Calcular data limite (X dias atrás)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysThreshold);
      const limitDateISO = limitDate.toISOString();

      logger.info(`[CleanupRepository] Iniciando limpeza de dream cards completados antes de ${limitDateISO}`);

      // 1. Buscar cards para limpeza
      const { data: cardsToDelete, error: fetchError } = await supabase
        .from('dream_cards')
        .select('id, metadata')
        .not('completed_at', 'is', null)
        .lte('completed_at', limitDateISO);

      if (fetchError) {
        errors.push(`Erro ao buscar cards: ${fetchError.message}`);
        throw fetchError;
      }

      if (!cardsToDelete || cardsToDelete.length === 0) {
        logger.info('[CleanupRepository] Nenhum card para limpeza');
        return { deletedCount: 0, errors };
      }

      const cardIds = cardsToDelete.map(c => c.id);
      logger.info(`[CleanupRepository] Encontrados ${cardIds.length} cards para limpeza`);

      // 2. Remover comments
      const { error: commentsError } = await supabase
        .from('dream_comments')
        .delete()
        .in('card_id', cardIds);

      if (commentsError) {
        errors.push(`Erro ao remover comments: ${commentsError.message}`);
        logger.error('[CleanupRepository] Erro ao remover comments:', { error: commentsError });
      }

      // 3. Remover cards
      const { error: cardsError } = await supabase
        .from('dream_cards')
        .delete()
        .in('id', cardIds);

      if (cardsError) {
        errors.push(`Erro ao remover cards: ${cardsError.message}`);
        throw cardsError;
      }

      deletedCount = cardIds.length;
      logger.info(`[CleanupRepository] Limpeza concluída: ${deletedCount} cards removidos`);

      return { deletedCount, errors };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(errorMsg);
      logger.error('[CleanupRepository] Erro na limpeza:', { error });
      return { deletedCount, errors };
    }
  }

  async cleanupSoftDeletedCollections(daysThreshold: number = 30): Promise<CleanupResult> {
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysThreshold);
      const limitDateISO = limitDate.toISOString();

      const { data: rows, error: fetchError } = await supabase
        .from('collections')
        .select('id')
        .not('deleted_at', 'is', null)
        .lte('deleted_at', limitDateISO);

      if (fetchError) {
        errors.push(`Erro ao buscar coleções para limpeza: ${fetchError.message}`);
        throw fetchError;
      }

      const ids = (rows || []).map((r: any) => r.id).filter(Boolean);
      if (ids.length === 0) {
        return { deletedCount: 0, errors };
      }

      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .in('id', ids);

      if (deleteError) {
        errors.push(`Erro ao remover coleções: ${deleteError.message}`);
        throw deleteError;
      }

      deletedCount = ids.length;
      return { deletedCount, errors };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(errorMsg);
      logger.error('[CleanupRepository] Erro na limpeza de coleções soft-deleted:', { error });
      return { deletedCount, errors };
    }
  }

  /**
   * Marca um card como concluído (quando chega na última coluna)
   */
  async markCardAsCompleted(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('dream_cards')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', cardId);

    if (error) {
      logger.error('[CleanupRepository] Erro ao marcar card como concluído:', { error });
      throw error;
    }

    logger.info(`[CleanupRepository] Card ${cardId} marcado como concluído`);
  }

  /**
   * Remove a marca de conclusão se card for movido de volta
   */
  async unmarkCardAsCompleted(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('dream_cards')
      .update({ completed_at: null })
      .eq('id', cardId);

    if (error) {
      logger.error('[CleanupRepository] Erro ao desmarcar conclusão do card:', { error });
      throw error;
    }

    logger.info(`[CleanupRepository] Card ${cardId} desmarcado como concluído`);
  }

  /**
   * Verifica se um card está marcado como concluído
   */
  async isCardCompleted(cardId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('dream_cards')
      .select('completed_at')
      .eq('id', cardId)
      .single();

    if (error) {
      logger.error('[CleanupRepository] Erro ao verificar conclusão do card:', { error });
      return false;
    }

    return data?.completed_at !== null;
  }

  /**
   * Retorna a data prevista para exclusão de um card
   */
  async getCardDeletionDate(cardId: string, daysThreshold: number = 2): Promise<Date | null> {
    const { data, error } = await supabase
      .from('dream_cards')
      .select('completed_at')
      .eq('id', cardId)
      .single();

    if (error || !data?.completed_at) {
      return null;
    }

    const completedDate = new Date(data.completed_at);
    completedDate.setDate(completedDate.getDate() + daysThreshold);
    return completedDate;
  }
}
