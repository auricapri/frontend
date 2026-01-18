import { DreamRepository, DreamBoard, DreamCard, DreamComment, BoardColumn } from '../repositories/dream.repository.js';
import { CleanupRepository } from '../repositories/cleanup.repository.js';
import { supabase } from '../config/supabase.js';
import { DiagramData } from '../../shared/types/index.js';
import logger from '../config/logger.js';

const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: 'col-1', title: 'Ideias', color: '#6366F1', position: 0 },
  { id: 'col-2', title: 'Validacao', color: '#F59E0B', position: 1 },
  { id: 'col-3', title: 'Em Producao', color: '#3B82F6', position: 2 },
  { id: 'col-4', title: 'Pronto', color: '#10B981', position: 3 },
];

export class DreamService {
  private repository: DreamRepository;
  private cleanupRepository: CleanupRepository;

  constructor() {
    this.repository = new DreamRepository();
    this.cleanupRepository = new CleanupRepository();
  }

  async getAllBoards(): Promise<DreamBoard[]> {
    return this.repository.getAllBoards();
  }

  async getBoardById(id: string): Promise<DreamBoard | null> {
    return this.repository.getBoardById(id);
  }

  async createBoard(data: { name: string; description?: string; created_by?: string }): Promise<DreamBoard> {
    const board: Partial<DreamBoard> = {
      name: data.name,
      description: data.description,
      columns: DEFAULT_COLUMNS,
      created_by: data.created_by,
      is_active: true,
    };
    return this.repository.createBoard(board);
  }

  async updateBoard(id: string, updates: Partial<DreamBoard>): Promise<DreamBoard> {
    return this.repository.updateBoard(id, updates);
  }

  async updateBoardColumns(id: string, columns: BoardColumn[]): Promise<DreamBoard> {
    return this.repository.updateBoard(id, { columns });
  }

  async deleteBoard(id: string): Promise<void> {
    return this.repository.deleteBoard(id);
  }

  async getCardsByBoardId(boardId: string): Promise<DreamCard[]> {
    return this.repository.getCardsByBoardId(boardId);
  }

  async getCardById(id: string): Promise<DreamCard | null> {
    return this.repository.getCardById(id);
  }

  async createCard(data: Partial<DreamCard>): Promise<DreamCard> {
    const existingCards = await this.repository.getCardsByBoardId(data.board_id!);
    const columnCards = existingCards.filter(c => c.column_id === data.column_id);
    const maxPosition = columnCards.length > 0 
      ? Math.max(...columnCards.map(c => c.position)) 
      : -1;

    const card: Partial<DreamCard> = {
      ...data,
      position: maxPosition + 1,
      metadata: data.metadata || {},
    };
    return this.repository.createCard(card);
  }

  async updateCard(id: string, updates: Partial<DreamCard>): Promise<DreamCard> {
    return this.repository.updateCard(id, updates);
  }

  async moveCard(id: string, columnId: string, position: number): Promise<DreamCard> {
    // Buscar o card e o board para verificar se está indo para última coluna
    const card = await this.repository.getCardById(id);
    if (!card) {
      throw new Error('Card not found');
    }

    const board = await this.repository.getBoardById(card.board_id);
    if (board) {
      const columns = board.columns || [];
      const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
      const lastColumn = sortedColumns[sortedColumns.length - 1];
      
      // Se está movendo para a última coluna, marcar como concluído
      if (lastColumn && columnId === lastColumn.id) {
        await this.cleanupRepository.markCardAsCompleted(id);
        logger.info(`[DreamService] Card ${id} movido para última coluna, marcado para exclusão em 2 dias`);
      } 
      // Se está saindo da última coluna, desmarcar conclusão
      else if (card.column_id === lastColumn?.id && columnId !== lastColumn.id) {
        await this.cleanupRepository.unmarkCardAsCompleted(id);
        logger.info(`[DreamService] Card ${id} removido da última coluna, desmarcado para exclusão`);
      }
    }

    return this.repository.moveCard(id, columnId, position);
  }

  async reorderCards(cards: { id: string; position: number; column_id: string }[]): Promise<void> {
    return this.repository.updateCardsPositions(cards);
  }

  async deleteCard(id: string): Promise<void> {
    return this.repository.deleteCard(id);
  }

  async getCommentsByCardId(cardId: string): Promise<DreamComment[]> {
    return this.repository.getCommentsByCardId(cardId);
  }

  async createComment(data: Partial<DreamComment>): Promise<DreamComment> {
    return this.repository.createComment(data);
  }

  async deleteComment(id: string): Promise<void> {
    return this.repository.deleteComment(id);
  }

  async generateDraft(cardId: string): Promise<{
    product_id?: string;
    collection_id?: string;
    category_id?: string;
  }> {
    const card = await this.repository.getCardById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const result: {
      product_id?: string;
      collection_id?: string;
      category_id?: string;
    } = {};

    const productData = {
      name: { pt: card.title, en: card.title },
      description: { pt: card.description || '', en: card.description || '' },
      slug: { pt: this.generateSlug(card.title), en: this.generateSlug(card.title) },
      category_id: card.category_id || null,
      base_images: card.image_url ? [card.image_url] : [],
      is_active: false,
      is_highlight: false,
    };

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (productError) {
      logger.error('Error creating product draft:', { error: productError });
      throw productError;
    }

    result.product_id = product.id;

    const defaultVariant = {
      product_id: product.id,
      sku: `DRAFT-${product.id.slice(0, 8)}`,
      color_name: { pt: 'Padrao', en: 'Default' },
      color_hex: '#000000',
      retail_price: 0,
      wholesale_price: 0,
      stock_quantity: 0,
      variant_images: card.image_url ? [card.image_url] : [],
      is_active: false,
    };

    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(defaultVariant);

    if (variantError) {
      logger.error('Error creating variant:', { error: variantError });
    }

    if (card.metadata?.associated_collections?.length) {
      const collectionId = card.metadata.associated_collections[0];
      
      const { data: existingCollection } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .single();

      if (existingCollection) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('collection_ids')
          .eq('id', product.id)
          .single();

        const currentCollections = existingProduct?.collection_ids || [];
        if (!currentCollections.includes(collectionId)) {
          await supabase
            .from('products')
            .update({ collection_ids: [...currentCollections, collectionId] })
            .eq('id', product.id);
        }
        result.collection_id = collectionId;
      }
    }

    const updatedMetadata = {
      ...card.metadata,
      draft_product_id: result.product_id,
      draft_collection_id: result.collection_id,
      draft_category_id: result.category_id,
    };

    await this.repository.updateCard(cardId, { metadata: updatedMetadata });

    return result;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-draft-' + Date.now();
  }

  async exportDiagram(cardId: string, diagram: DiagramData): Promise<{
    success: boolean;
    productsCreated: number;
    productsUpdated: number;
    variantsUpdated: number;
  }> {
    const result = {
      success: true,
      productsCreated: 0,
      productsUpdated: 0,
      variantsUpdated: 0,
    };

    try {
      const { nodes, metadata } = diagram;
      
      // Processar modificações de produtos existentes
      if (metadata?.modifiedProducts?.length) {
        for (const mod of metadata.modifiedProducts) {
          const { error } = await supabase
            .from('products')
            .update(mod.changes)
            .eq('id', mod.productId);
          
          if (!error) {
            result.productsUpdated++;
          }
        }
      }

      // Processar modificações de variantes
      if (metadata?.modifiedVariants?.length) {
        for (const mod of metadata.modifiedVariants) {
          const { error } = await supabase
            .from('product_variants')
            .update(mod.changes)
            .eq('id', mod.variantId);
          
          if (!error) {
            result.variantsUpdated++;
          }
        }
      }

      // Processar nodes de produto sem productId (novos produtos)
      const newProductNodes = nodes.filter((n) => {
        const data = n.data as Record<string, unknown>;
        return n.type === 'product' && !data.productId && data.productName;
      });

      for (const node of newProductNodes) {
        const nodeData = node.data as Record<string, unknown>;
        const productName = nodeData.productName as string;
        const productImage = nodeData.productImage as string | undefined;
        const value = nodeData.value as number | undefined;

        const productData = {
          name: { pt: productName, en: productName },
          description: { pt: '', en: '' },
          slug: { pt: this.generateSlug(productName), en: this.generateSlug(productName) },
          base_images: productImage ? [productImage] : [],
          is_active: false,
          is_highlight: false,
        };

        const { data: product, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (!error && product) {
          result.productsCreated++;
          
          // Criar variante padrão se houver valor
          if (value) {
            await supabase
              .from('product_variants')
              .insert({
                product_id: product.id,
                sku: `DRAFT-${product.id.slice(0, 8)}`,
                color_name: { pt: 'Padrao', en: 'Default' },
                color_hex: '#000000',
                retail_price: value,
                wholesale_price: value * 0.7,
                stock_quantity: 0,
                variant_images: productImage ? [productImage] : [],
                is_active: false,
              });
          }
        }
      }

      // Atualizar card com resultado da exportação
      const card = await this.repository.getCardById(cardId);
      if (card) {
        const updatedMetadata = {
          ...card.metadata,
          lastExportedAt: new Date().toISOString(),
          exportResult: result,
        };
        await this.repository.updateCard(cardId, { metadata: updatedMetadata });
      }

      return result;
    } catch (error: unknown) {
      logger.error('[DreamService] Error exporting diagram:', { error });
      return { ...result, success: false };
    }
  }
}

