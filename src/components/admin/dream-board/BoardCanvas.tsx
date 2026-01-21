import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Category, Asset, Collection, Product } from '../../../types';
import { DreamBoard, DreamCard } from '../../../types/dream';
import { Locale } from '../../../i18n';
import DreamCardComponent from './DreamCard';
import DreamCardModal from './DreamCardModal';
import DroppableColumn from './DroppableColumn';

interface BoardCanvasProps {
  board: DreamBoard;
  cards: DreamCard[];
  categories: Category[];
  collections: Collection[];
  assets: Asset[];
  products: Product[];
  locale: Locale;
  onCardCreate: (columnId: string) => void;
  onCardUpdate: (cardId: string, updates: Partial<DreamCard>) => void;
  onCardMove: (cardId: string, columnId: string, position: number) => void;
  onCardDelete: (cardId: string) => void;
  onCardsReorder: (cards: { id: string; position: number; column_id: string }[]) => void;
}

const BoardCanvas: React.FC<BoardCanvasProps> = ({
  board,
  cards,
  categories,
  collections,
  assets,
  products,
  locale,
  onCardCreate,
  onCardUpdate,
  onCardMove,
  onCardDelete,
  onCardsReorder,
}) => {
  const [activeCard, setActiveCard] = useState<DreamCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<DreamCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, DreamCard[]> = {};
    board.columns.forEach(col => {
      grouped[col.id] = cards
        .filter(c => c.column_id === col.id)
        .sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [cards, board.columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find(c => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    const isOverColumn = board.columns.some(col => col.id === overId);
    
    if (isOverColumn && activeCard.column_id !== overId) {
      const targetCards = cardsByColumn[overId] || [];
      onCardMove(activeId, overId, targetCards.length);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    const isOverColumn = board.columns.some(col => col.id === overId);
    const overCard = cards.find(c => c.id === overId);

    if (isOverColumn) {
      const targetCards = cardsByColumn[overId] || [];
      if (activeCard.column_id !== overId) {
        onCardMove(activeId, overId, targetCards.length);
      }
    } else if (overCard) {
      const targetColumnId = overCard.column_id;
      const columnCards = cardsByColumn[targetColumnId] || [];
      const overIndex = columnCards.findIndex(c => c.id === overId);
      
      if (activeCard.column_id === targetColumnId) {
        const activeIndex = columnCards.findIndex(c => c.id === activeId);
        if (activeIndex !== overIndex) {
          const reordered = [...columnCards];
          const [moved] = reordered.splice(activeIndex, 1);
          reordered.splice(overIndex, 0, moved);
          
          const updates = reordered.map((card, idx) => ({
            id: card.id,
            position: idx,
            column_id: targetColumnId,
          }));
          onCardsReorder(updates);
        }
      } else {
        onCardMove(activeId, targetColumnId, overIndex);
      }
    }
  };

  const isLastColumn = (columnId: string) => {
    const sortedColumns = [...board.columns].sort((a, b) => a.position - b.position);
    return sortedColumns[sortedColumns.length - 1]?.id === columnId;
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full min-w-max p-1">
            {board.columns
              .sort((a, b) => a.position - b.position)
              .map(column => (
                <DroppableColumn key={column.id} column={column}>
                  <div className="w-80 flex flex-col h-full bg-neutral-50 rounded-2xl border border-neutral-100">
                    <header
                      className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between"
                      style={{ borderTopColor: column.color, borderTopWidth: 3 }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <h3 className="font-bold text-sm uppercase tracking-wide">{column.title}</h3>
                        <span className="text-xs text-neutral-400 font-medium">
                          {cardsByColumn[column.id]?.length || 0}
                        </span>
                      </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      <SortableContext
                        items={cardsByColumn[column.id]?.map(c => c.id) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        {cardsByColumn[column.id]?.map(card => (
                          <DreamCardComponent
                            key={card.id}
                            card={card}
                            category={categories.find(c => c.id === card.category_id)}
                            locale={locale}
                            onClick={() => setSelectedCard(card)}
                            isLastColumn={isLastColumn(column.id)}
                          />
                        ))}
                      </SortableContext>
                    </div>

                    <footer className="p-3 border-t border-neutral-100">
                      <button
                        onClick={() => onCardCreate(column.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </footer>
                  </div>
                </DroppableColumn>
              ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <DreamCardComponent
              card={activeCard}
              category={categories.find(c => c.id === activeCard.category_id)}
              locale={locale}
              onClick={() => {}}
              isDragging
              isLastColumn={false}
            />
          )}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <DreamCardModal
          card={selectedCard}
          categories={categories}
          collections={collections}
          assets={assets}
          products={products}
          locale={locale}
          isLastColumn={isLastColumn(selectedCard.column_id)}
          onUpdate={(updates) => {
            onCardUpdate(selectedCard.id, updates);
            setSelectedCard(prev => prev ? { ...prev, ...updates } : null);
          }}
          onDelete={() => {
            onCardDelete(selectedCard.id);
            setSelectedCard(null);
          }}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
};

export default BoardCanvas;

