import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { BoardColumn } from '../../../types/dream';

interface ColumnConfigProps {
  columns: BoardColumn[];
  onSave: (columns: BoardColumn[]) => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#a3e635', // lime
  '#34d399', // emerald
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
  '#9ca3af', // gray
];

const ColumnConfig: React.FC<ColumnConfigProps> = ({ columns, onSave, onClose }) => {
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>(
    columns.length > 0 ? [...columns] : [
      { id: crypto.randomUUID(), title: 'Ideias', color: DEFAULT_COLORS[4], position: 0 },
      { id: crypto.randomUUID(), title: 'Em Analise', color: DEFAULT_COLORS[3], position: 1 },
      { id: crypto.randomUUID(), title: 'Em Producao', color: DEFAULT_COLORS[6], position: 2 },
      { id: crypto.randomUUID(), title: 'Concluido', color: DEFAULT_COLORS[0], position: 3 },
    ]
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddColumn = () => {
    const newColumn: BoardColumn = {
      id: crypto.randomUUID(),
      title: 'Nova Coluna',
      color: DEFAULT_COLORS[localColumns.length % DEFAULT_COLORS.length],
      position: localColumns.length,
    };
    setLocalColumns([...localColumns, newColumn]);
  };

  const handleRemoveColumn = (index: number) => {
    if (localColumns.length <= 1) return;
    const updated = localColumns.filter((_, i) => i !== index);
    setLocalColumns(updated.map((col, i) => ({ ...col, position: i })));
  };

  const handleUpdateColumn = (index: number, updates: Partial<BoardColumn>) => {
    setLocalColumns(prev =>
      prev.map((col, i) => i === index ? { ...col, ...updates } : col)
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...localColumns];
    const draggedColumn = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedColumn);

    setLocalColumns(newColumns.map((col, i) => ({ ...col, position: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onSave(localColumns);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <h2 className="text-lg font-bold">Configurar Colunas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {localColumns.map((column, index) => (
            <div
              key={column.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border-2 transition-all ${
                draggedIndex === index ? 'border-black opacity-50' : 'border-transparent'
              }`}
            >
              <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600">
                <GripVertical className="w-5 h-5" />
              </div>

              <input
                type="color"
                value={column.color}
                onChange={(e) => handleUpdateColumn(index, { color: e.target.value })}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer"
              />

              <input
                type="text"
                value={column.title}
                onChange={(e) => handleUpdateColumn(index, { title: e.target.value })}
                className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Nome da coluna"
              />

              <button
                onClick={() => handleRemoveColumn(index)}
                disabled={localColumns.length <= 1}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-neutral-100 space-y-4">
          <button
            onClick={handleAddColumn}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Coluna
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-black text-white hover:bg-neutral-800 rounded-xl text-sm font-medium transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnConfig;
