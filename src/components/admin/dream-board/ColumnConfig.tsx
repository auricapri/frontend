import React, { useState } from 'react';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import { BoardColumn } from '../../../types';

interface ColumnConfigProps {
  columns: BoardColumn[];
  onSave: (columns: BoardColumn[]) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', 
  '#F59E0B', '#10B981', '#14B8A6', '#3B82F6',
  '#6B7280', '#1F2937'
];

const ColumnConfig: React.FC<ColumnConfigProps> = ({ columns, onSave, onClose }) => {
  const [localColumns, setLocalColumns] = useState<BoardColumn[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddColumn = () => {
    const newColumn: BoardColumn = {
      id: `col-${Date.now()}`,
      title: 'Nova Coluna',
      color: PRESET_COLORS[localColumns.length % PRESET_COLORS.length],
      position: localColumns.length,
    };
    setLocalColumns([...localColumns, newColumn]);
  };

  const handleUpdateColumn = (index: number, updates: Partial<BoardColumn>) => {
    setLocalColumns(prev => prev.map((col, i) => 
      i === index ? { ...col, ...updates } : col
    ));
  };

  const handleDeleteColumn = (index: number) => {
    if (localColumns.length <= 1) return;
    setLocalColumns(prev => prev.filter((_, i) => i !== index).map((col, i) => ({ ...col, position: i })));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...localColumns];
    const [dragged] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, dragged);
    
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold">Configurar Colunas</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {localColumns.map((column, index) => (
              <div
                key={column.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div
                  className="w-8 h-8 rounded-lg cursor-pointer relative group"
                  style={{ backgroundColor: column.color }}
                >
                  <input
                    type="color"
                    value={column.color}
                    onChange={(e) => handleUpdateColumn(index, { color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <input
                  type="text"
                  value={column.title}
                  onChange={(e) => handleUpdateColumn(index, { title: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
                />

                <button
                  onClick={() => handleDeleteColumn(index)}
                  disabled={localColumns.length <= 1}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddColumn}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Coluna
          </button>
        </div>

        <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Salvar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ColumnConfig;

