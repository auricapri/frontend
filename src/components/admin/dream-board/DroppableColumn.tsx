import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { BoardColumn } from '../../../types';

interface DroppableColumnProps {
  column: BoardColumn;
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ column, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 ${isOver ? 'scale-[1.02]' : ''}`}
    >
      {children}
    </div>
  );
};

export default DroppableColumn;

