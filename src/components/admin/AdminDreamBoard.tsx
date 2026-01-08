import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Loader2, Settings2, Trash2 } from 'lucide-react';
import { DreamApi } from '../../api/dream.api';
import { DreamBoard, DreamCard, Category, Asset, Collection, Product } from '../../types';
import { Locale } from '../../i18n';
import BoardCanvas from './dream-board/BoardCanvas';
import ColumnConfig from './dream-board/ColumnConfig';

const dreamApiInstance = new DreamApi();

interface AdminDreamBoardProps {
  categories: Category[];
  collections: Collection[];
  assets: Asset[];
  products?: Product[];
  locale: Locale;
}

const AdminDreamBoard: React.FC<AdminDreamBoardProps> = ({
  categories,
  collections,
  assets,
  products = [],
  locale,
}) => {
  const [boards, setBoards] = useState<DreamBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<DreamBoard | null>(null);
  const [cards, setCards] = useState<DreamCard[]>([]);
  const [diagramProducts, setDiagramProducts] = useState<Product[]>(products);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const dreamApi = dreamApiInstance;

  const fetchBoards = useCallback(async () => {
    try {
      const data = await dreamApi.getAllBoards();
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  }, []);

  const fetchCards = useCallback(async (boardId: string) => {
    try {
      const data = await dreamApi.getCardsByBoardId(boardId);
      setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await dreamApi.getProductsForDiagram();
      setDiagramProducts(data);
    } catch (error) {
      console.error('Error fetching products for diagram:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      setIsLoading(true);
      await fetchBoards();
      await fetchProducts();
      if (isMounted) {
        setIsLoading(false);
      }
    };
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      fetchCards(selectedBoard.id);
    }
  }, [selectedBoard?.id]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const board = await dreamApi.createBoard({ name: newBoardName });
      setBoards(prev => [board, ...prev]);
      setSelectedBoard(board);
      setNewBoardName('');
      setIsCreatingBoard(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este board?')) return;
    try {
      await dreamApi.deleteBoard(boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (selectedBoard?.id === boardId) {
        setSelectedBoard(boards.find(b => b.id !== boardId) || null);
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const handleUpdateColumns = async (columns: DreamBoard['columns']) => {
    if (!selectedBoard) return;
    try {
      const updated = await dreamApi.updateBoardColumns(selectedBoard.id, columns);
      setSelectedBoard(updated);
      setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (error) {
      console.error('Error updating columns:', error);
    }
  };

  const handleCardCreate = async (columnId: string) => {
    if (!selectedBoard) return;
    try {
      const card = await dreamApi.createCard({
        board_id: selectedBoard.id,
        column_id: columnId,
        title: 'Nova Ideia',
        metadata: {},
      });
      setCards(prev => [...prev, card]);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleCardUpdate = async (cardId: string, updates: Partial<DreamCard>) => {
    try {
      const updated = await dreamApi.updateCard(cardId, updates);
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const handleCardMove = async (cardId: string, columnId: string, position: number) => {
    try {
      const updated = await dreamApi.moveCard(cardId, columnId, position);
      setCards(prev => prev.map(c => c.id === cardId ? updated : c));
    } catch (error) {
      console.error('Error moving card:', error);
    }
  };

  const handleCardDelete = async (cardId: string) => {
    try {
      await dreamApi.deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleCardsReorder = async (reorderedCards: { id: string; position: number; column_id: string }[]) => {
    try {
      await dreamApi.reorderCards(reorderedCards);
      setCards(prev => {
        const updated = [...prev];
        reorderedCards.forEach(rc => {
          const idx = updated.findIndex(c => c.id === rc.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], position: rc.position, column_id: rc.column_id };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Error reordering cards:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black uppercase tracking-tight">Dream Board</h1>
          
          {boards.length > 0 && (
            <select
              value={selectedBoard?.id || ''}
              onChange={(e) => {
                const board = boards.find(b => b.id === e.target.value);
                setSelectedBoard(board || null);
              }}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedBoard && (
            <>
              <button
                onClick={() => setShowColumnConfig(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium transition-colors"
              >
                <Settings2 className="w-4 h-4" />
                Colunas
              </button>
              <button
                onClick={() => handleDeleteBoard(selectedBoard.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {isCreatingBoard ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Nome do board..."
                className="px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateBoard();
                  if (e.key === 'Escape') setIsCreatingBoard(false);
                }}
              />
              <button
                onClick={handleCreateBoard}
                className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                Criar
              </button>
              <button
                onClick={() => setIsCreatingBoard(false)}
                className="px-4 py-2 bg-neutral-100 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingBoard(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Board
            </button>
          )}
        </div>
      </header>

      {selectedBoard ? (
        <BoardCanvas
          board={selectedBoard}
          cards={cards}
          categories={categories}
          collections={collections}
          assets={assets}
          products={diagramProducts}
          locale={locale}
          onCardCreate={handleCardCreate}
          onCardUpdate={handleCardUpdate}
          onCardMove={handleCardMove}
          onCardDelete={handleCardDelete}
          onCardsReorder={handleCardsReorder}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
          <div className="text-center">
            <h3 className="text-lg font-bold text-neutral-400 mb-2">Nenhum board selecionado</h3>
            <p className="text-sm text-neutral-400 mb-4">Crie um novo board para comecar a planejar suas ideias</p>
            <button
              onClick={() => setIsCreatingBoard(true)}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Board
            </button>
          </div>
        </div>
      )}

      {showColumnConfig && selectedBoard && (
        <ColumnConfig
          columns={selectedBoard.columns}
          onSave={handleUpdateColumns}
          onClose={() => setShowColumnConfig(false)}
        />
      )}
    </div>
  );
};

export default AdminDreamBoard;

