import React from 'react';

export function DiagramFooter(props: { onCancel: () => void; onSave: () => void }) {
  const { onCancel, onSave } = props;

  return (
    <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
      <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors">
        Cancelar
      </button>
      <button onClick={onSave} className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors">
        Salvar Diagrama
      </button>
    </footer>
  );
}

