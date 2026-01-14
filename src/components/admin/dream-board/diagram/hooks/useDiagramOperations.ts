import { useCallback } from 'react';
import { Node, Edge, Connection, MarkerType } from 'reactflow';
import { nodeStyles, NODE_TEMPLATES, SPECIAL_NODES } from '../types';

export function useDiagramOperations(
  nodes: Node[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  edgesRef: React.MutableRefObject<Edge[]>,
  updateResultNodes: (nodes: Node[], edges: Edge[]) => Node[],
  extractAllVariables: (nodes: Node[]) => Record<string, number>,
  calculateFinalResult: (resultNode: Node, connectedVariables: Record<string, number>) => number,
  createNodeWithCallbacks: (node: Node) => Node,
  createEdgeWithCallbacks: (edge: Edge) => Edge
) {
  const updateNodeData = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    setNodes(nds => {
      const updatedNodes = nds.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, ...newData } }
          : n
      );
      return updateResultNodes(updatedNodes, edgesRef.current);
    });
  }, [setNodes, updateResultNodes, edgesRef]);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges(eds => eds.map(e => 
      e.id === edgeId 
        ? { ...e, data: { ...e.data, label } }
        : e
    ));
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const edgeId = `edge-${Date.now()}`;
      setEdges((eds) => {
        const newEdge = createEdgeWithCallbacks({
          id: edgeId,
          source: params.source!,
          target: params.target!,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: 'custom',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
          data: { label: '' },
        });
        
        const newEdges = [...eds, newEdge];
        edgesRef.current = newEdges;
        setNodes(nds => updateResultNodes(nds, newEdges));
        
        return newEdges;
      });
    },
    [setEdges, setNodes, updateResultNodes, createEdgeWithCallbacks, edgesRef]
  );

  const handleEdgesChange = useCallback((_changes: unknown) => {
    setEdges((eds) => {
      const updatedEdges = [...eds];
      setTimeout(() => {
        setNodes(nds => updateResultNodes(nds, edgesRef.current));
      }, 0);
      return updatedEdges;
    });
  }, [setEdges, setNodes, updateResultNodes, edgesRef]);

  const addNode = useCallback((template: typeof NODE_TEMPLATES[0] | typeof SPECIAL_NODES[0]) => {
    const nodeId = `node-${Date.now()}`;
    const isSpecial = 'type' in template && template.type !== 'default';
    
    let newNode: Node;
    
    if (isSpecial && template.type === 'image') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'image',
        data: { 
          label: '',
          imageUrl: '',
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'product') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'product',
        data: { 
          label: 'Produto',
          productName: 'Novo Produto',
          productImage: '',
          value: 0,
          unit: 'R$',
          category: '',
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'calculator') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'calculator',
        data: { 
          label: 'Calculo',
          formula: '',
          variables: {},
          result: 0,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'variable') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'variable',
        data: { 
          label: 'Variavel',
          varName: 'var',
          varValue: 0,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'variant') {
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'variant',
        data: { 
          label: 'Variacao',
          variantId: '',
          productId: '',
          sku: 'SKU-NOVO',
          color: '',
          colorHex: '#6B7280',
          size: '',
          retail_price: 0,
          wholesale_price: 0,
          cost_price: 0,
          stock_quantity: 0,
          comments: [],
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else if (isSpecial && template.type === 'result') {
      const allVars = extractAllVariables(nodes);
      const finalResult = Object.values(allVars).reduce((a: number, b: number) => a + b, 0);
      
      newNode = createNodeWithCallbacks({
        id: nodeId,
        type: 'result',
        data: { 
          label: 'Resultado',
          title: 'Resultado Final',
          formula: '',
          variables: allVars,
          finalResult,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
      });
    } else {
      newNode = {
        id: nodeId,
        type: 'default',
        data: { 
          label: template.label === 'Personalizado' ? 'Novo No' : template.label,
          color: template.color,
        },
        position: { 
          x: Math.random() * 400 + 100, 
          y: Math.random() * 200 + 100 
        },
        style: {
          ...nodeStyles,
          backgroundColor: `${template.color}20`,
          borderColor: template.color,
          color: template.color,
        },
      };
    }
    
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes, createNodeWithCallbacks, extractAllVariables]);

  const deleteSelectedNode = useCallback((selectedNode: Node | null, setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const updateNodeLabel = useCallback((
    selectedNode: Node | null,
    editingLabel: string,
    setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>,
    setEditingLabel: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!selectedNode || !editingLabel.trim()) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, label: editingLabel } }
          : n
      )
    );
    setSelectedNode(null);
    setEditingLabel('');
  }, [setNodes]);

  return {
    updateNodeData,
    updateEdgeLabel,
    onConnect,
    handleEdgesChange,
    addNode,
    deleteSelectedNode,
    updateNodeLabel,
  };
}
