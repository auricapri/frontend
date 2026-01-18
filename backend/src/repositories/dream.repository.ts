import { supabase } from '../config/supabase.js';

export interface BoardColumn {
  id: string;
  title: string;
  color: string;
  position: number;
}

export interface DreamBoard {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
}

export interface DreamCardMetadata {
  diagram?: {
    nodes: any[];
    edges: any[];
  };
  associated_assets?: string[];
  associated_collections?: string[];
  strategy?: string;
  draft_product_id?: string;
  draft_collection_id?: string;
  draft_category_id?: string;
}

export interface DreamCard {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description?: string;
  image_url?: string;
  category_id?: string;
  position: number;
  metadata: DreamCardMetadata;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  comments_count?: number;
}

export interface DreamComment {
  id: string;
  card_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export class DreamRepository {
  async getAllBoards(): Promise<DreamBoard[]> {
    const { data, error } = await supabase
      .from('dream_boards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DreamBoard[];
  }

  async getBoardById(id: string): Promise<DreamBoard | null> {
    const { data, error } = await supabase
      .from('dream_boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DreamBoard | null;
  }

  async createBoard(board: Partial<DreamBoard>): Promise<DreamBoard> {
    const { data, error } = await supabase
      .from('dream_boards')
      .insert(board)
      .select()
      .single();

    if (error) throw error;
    return data as DreamBoard;
  }

  async updateBoard(id: string, updates: Partial<DreamBoard>): Promise<DreamBoard> {
    const { data, error } = await supabase
      .from('dream_boards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DreamBoard;
  }

  async deleteBoard(id: string): Promise<void> {
    const { error } = await supabase
      .from('dream_boards')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  async getCardsByBoardId(boardId: string): Promise<DreamCard[]> {
    const { data, error } = await supabase
      .from('dream_cards')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) throw error;

    const cards = data || [];
    const cardsWithComments = await Promise.all(
      cards.map(async (card) => {
        const { count } = await supabase
          .from('dream_comments')
          .select('*', { count: 'exact', head: true })
          .eq('card_id', card.id);
        return { ...card, comments_count: count || 0 };
      })
    );

    return cardsWithComments as DreamCard[];
  }

  async getCardById(id: string): Promise<DreamCard | null> {
    const { data, error } = await supabase
      .from('dream_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as DreamCard | null;
  }

  async createCard(card: Partial<DreamCard>): Promise<DreamCard> {
    const { data, error } = await supabase
      .from('dream_cards')
      .insert(card)
      .select()
      .single();

    if (error) throw error;
    return data as DreamCard;
  }

  async updateCard(id: string, updates: Partial<DreamCard>): Promise<DreamCard> {
    const { data, error } = await supabase
      .from('dream_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DreamCard;
  }

  async moveCard(id: string, columnId: string, position: number): Promise<DreamCard> {
    const { data, error } = await supabase
      .from('dream_cards')
      .update({ 
        column_id: columnId, 
        position, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DreamCard;
  }

  async deleteCard(id: string): Promise<void> {
    const { error } = await supabase
      .from('dream_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getCommentsByCardId(cardId: string): Promise<DreamComment[]> {
    const { data, error } = await supabase
      .from('dream_comments')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as DreamComment[];
  }

  async createComment(comment: Partial<DreamComment>): Promise<DreamComment> {
    const { data, error } = await supabase
      .from('dream_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data as DreamComment;
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('dream_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateCardsPositions(cards: { id: string; position: number; column_id: string }[]): Promise<void> {
    for (const card of cards) {
      const { error } = await supabase
        .from('dream_cards')
        .update({ position: card.position, column_id: card.column_id })
        .eq('id', card.id);

      if (error) throw error;
    }
  }
}

