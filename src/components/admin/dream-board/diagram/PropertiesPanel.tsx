import React from 'react';
import { Trash2 } from 'lucide-react';
import { type Node } from 'reactflow';

export function PropertiesPanel(props: {
  selectedNode: Node | null;
  editingLabel: string;
  setEditingLabel: (val: string) => void;
  isDefaultNode: boolean;
  onSaveLabel: () => void;
  onDelete: () => void;
}) {
  const { selectedNode, editingLabel, setEditingLabel, isDefaultNode, onSaveLabel, onDelete } = props;

  if (!selectedNode) return null;

  if (isDefaultNode) {
    return (
      <div className="mt-6 pt-6 border-t border-neutral-100">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Editar No</h3>
        <input
          type="text"
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-black"
          onKeyDown={(e) => e.key === 'Enter' && onSaveLabel()}
        />
        <div className="flex gap-2">
          <button onClick={onSaveLabel} className="flex-1 px-3 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800">
            Salvar
          </button>
          <button onClick={onDelete} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-neutral-100">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Acoes</h3>
      <button onClick={onDelete} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
        <Trash2 className="w-4 h-4" />
        Excluir No
      </button>
    </div>
  );
}

