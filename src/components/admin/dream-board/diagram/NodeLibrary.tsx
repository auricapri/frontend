import React from 'react';
import { Database, Layout } from 'lucide-react';
import { PropertiesPanel } from './PropertiesPanel';

export function NodeLibrary(props: {
  showResourcePanel: boolean;
  setShowResourcePanel: (v: boolean) => void;
  showTemplateSelector: boolean;
  setShowTemplateSelector: (v: boolean) => void;
  TEMPLATE_CONFIGS: Record<string, { name: string; description: string }>;
  onApplyTemplate: (key: string) => void;
  SPECIAL_NODES: any[];
  NODE_TEMPLATES: any[];
  addNode: (template: any) => void;
  selectedNode: any;
  isDefaultNode: boolean;
  editingLabel: string;
  setEditingLabel: (v: string) => void;
  onSaveLabel: () => void;
  onDeleteSelectedNode: () => void;
}) {
  const {
    showResourcePanel,
    setShowResourcePanel,
    showTemplateSelector,
    setShowTemplateSelector,
    TEMPLATE_CONFIGS,
    onApplyTemplate,
    SPECIAL_NODES,
    NODE_TEMPLATES,
    addNode,
    selectedNode,
    isDefaultNode,
    editingLabel,
    setEditingLabel,
    onSaveLabel,
    onDeleteSelectedNode,
  } = props;

  return (
    <aside className="w-72 border-r border-neutral-100 p-4 overflow-y-auto">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowResourcePanel(!showResourcePanel)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
            showResourcePanel ? 'bg-cyan-500 text-white' : 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Base
        </button>
        <button
          onClick={() => setShowTemplateSelector(!showTemplateSelector)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
            showTemplateSelector ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Templates
        </button>
      </div>

      {showTemplateSelector && (
        <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <h4 className="text-xs font-bold text-purple-800 mb-2">Aplicar Template</h4>
          <div className="space-y-1.5">
            {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => onApplyTemplate(key)}
                className="w-full text-left px-3 py-2 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors"
              >
                <p className="text-xs font-medium text-neutral-800">{config.name}</p>
                <p className="text-[10px] text-neutral-500">{config.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Nos Especiais</h3>
      <div className="space-y-2 mb-6">
        {SPECIAL_NODES.map((template) => (
          <button
            key={template.label}
            onClick={() => addNode(template)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-50 transition-colors text-left border border-neutral-100"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${template.color}20` }}>
              <template.icon className="w-4 h-4" style={{ color: template.color }} />
            </div>
            <div>
              <span className="text-sm font-medium block">{template.label}</span>
              <span className="text-[10px] text-neutral-400">{template.description}</span>
            </div>
          </button>
        ))}
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3">Nos de Processo</h3>
      <div className="space-y-1">
        {NODE_TEMPLATES.map((template) => (
          <button
            key={template.label}
            onClick={() => addNode(template)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="w-4 h-4 rounded" style={{ backgroundColor: template.color }} />
            <span className="text-sm font-medium">{template.label}</span>
          </button>
        ))}
      </div>

      <PropertiesPanel
        selectedNode={selectedNode}
        editingLabel={editingLabel}
        setEditingLabel={setEditingLabel}
        isDefaultNode={isDefaultNode}
        onSaveLabel={onSaveLabel}
        onDelete={onDeleteSelectedNode}
      />

      <div className="mt-6 pt-6 border-t border-neutral-100">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">Dicas</h3>
        <ul className="text-xs text-neutral-500 space-y-1">
          <li>• Arraste nos para mover</li>
          <li>• Conecte de qualquer lado do card</li>
          <li>
            • <strong>Duplo clique na linha</strong>: adicionar comentario
          </li>
          <li>
            • <strong>Produto</strong>: gera variavel automatica
          </li>
          <li>
            • <strong>Resultado</strong>: soma variaveis conectadas
          </li>
          <li>
            • Use o <strong>MiniMap</strong> para navegar
          </li>
        </ul>
      </div>
    </aside>
  );
}

