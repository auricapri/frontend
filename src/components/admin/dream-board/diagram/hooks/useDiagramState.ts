import { useState, useRef, useEffect, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow';

export const generateVarName = (name: string): string => {
  return `var_${name?.replace(/\s+/g, '_').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'item'}`;
};

export function useDiagramState(
  initialNodes: Node[],
  initialEdges: Edge[],
  updateResultNodes: (nodes: Node[], edges: Edge[]) => Node[]
) {
  const edgesRef = useRef<Edge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    const hasResultNode = nodes.some(n => n.type === 'result');
    if (hasResultNode) {
      setNodes(nds => updateResultNodes(nds, edges));
    }
  }, [edges, nodes.filter(n => n.type !== 'result').map(n => JSON.stringify(n.data)).join(','), setNodes, updateResultNodes]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEditingLabel(node.data.label || '');
  }, []);

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    edgesRef,
    selectedNode,
    setSelectedNode,
    editingLabel,
    setEditingLabel,
    showResourcePanel,
    setShowResourcePanel,
    showTemplateSelector,
    setShowTemplateSelector,
    handleNodeClick,
  };
}
