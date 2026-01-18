import React, { useMemo, useCallback, useEffect } from 'react';
import { Node, Edge, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import { DiagramEditorProps, DiagramMetadata, nodeStyles, NODE_TEMPLATES, SPECIAL_NODES } from './diagram/types';
import ResourcePanel from './ResourcePanel';
import { DiagramToolbar } from './diagram/DiagramToolbar';
import { DiagramFooter } from './diagram/DiagramFooter';
import { DiagramCanvas } from './diagram/DiagramCanvas';
import { NodeLibrary } from './diagram/NodeLibrary';
import { 
  generateCostFlowTemplate, 
  generateRevenueFlowTemplate, 
  generateCollectionFlowTemplate,
  generateProductNode,
  generateVariantNode,
  TEMPLATE_CONFIGS,
  TemplateType
} from './diagram-templates';
import { useDiagramCalculations } from './diagram/hooks/useDiagramCalculations';
import { ImageNode, ProductNode, VariantNode, CalculatorNode, VariableNode, ResultNode } from './diagram/nodes/NodeComponents';
import { CustomEdge } from './diagram/edges/CustomEdge';
import type { Product, Collection, ProductVariant } from '../../../types';

const DiagramEditor: React.FC<DiagramEditorProps> = ({ 
  diagram, 
  products: _products = [], 
  collections: _collections = [], 
  locale = 'pt', 
  onSave, 
  onClose 
}) => {
  const edgesRef = React.useRef<Edge[]>([]);
  const [showResourcePanel, setShowResourcePanel] = React.useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null);
  const [editingLabel, setEditingLabel] = React.useState('');

  const {
    extractAllVariables,
    calculateFinalResult,
    updateResultNodes,
  } = useDiagramCalculations();

  const createNodeWithCallbacks = useCallback((node: Node, updateNodeData: (nodeId: string, newData: Record<string, unknown>) => void) => {
    const baseData = { ...node.data };
    
    if (node.type === 'image') {
      baseData.onUpdateImage = (url: string) => updateNodeData(node.id, { imageUrl: url });
      baseData.onUpdateLabel = (label: string) => updateNodeData(node.id, { label });
    } else if (node.type === 'calculator') {
      baseData.onUpdateData = (calcData: Record<string, unknown>) => updateNodeData(node.id, calcData);
    } else if (node.type === 'variable') {
      baseData.onUpdateData = (varData: Record<string, unknown>) => updateNodeData(node.id, varData);
    } else if (node.type === 'product') {
      baseData.onUpdateData = (productData: Record<string, unknown>) => updateNodeData(node.id, productData);
    } else if (node.type === 'variant') {
      baseData.onUpdateData = (variantData: Record<string, unknown>) => updateNodeData(node.id, variantData);
    } else if (node.type === 'result') {
      baseData.onUpdateData = (resultData: Record<string, unknown>) => updateNodeData(node.id, resultData);
    }
    
    return { ...node, data: baseData };
  }, []);

  const createEdgeWithCallbacks = useCallback((edge: Edge, updateEdgeLabel: (edgeId: string, label: string) => void): Edge => {
    return {
      ...edge,
      type: 'custom',
      data: {
        ...edge.data,
        onLabelChange: (label: string) => updateEdgeLabel(edge.id, label),
      },
    };
  }, []);

  const initialNodes: Node[] = diagram.nodes.length > 0 
    ? diagram.nodes.map(n => {
        const node = {
          ...n,
          type: n.type || 'default',
          style: n.type && n.type !== 'default' ? undefined : {
            ...nodeStyles,
            backgroundColor: n.data?.color ? `${n.data.color}20` : '#F3F4F6',
            borderColor: n.data?.color || '#6B7280',
            color: n.data?.color || '#374151',
          },
        };
        return node;
      })
    : [];

  const initialEdges: Edge[] = diagram.edges.map(e => ({
    ...e,
    type: 'custom',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 2 },
    data: { label: e.label || '' },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    const hasResultNode = nodes.some(n => n.type === 'result');
    if (hasResultNode) {
      setNodes(nds => updateResultNodes(nds, edges));
    }
  }, [edges, nodes.filter(n => n.type !== 'result').map(n => JSON.stringify(n.data)).join(','), setNodes, updateResultNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    setNodes(nds => {
      const updatedNodes = nds.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, ...newData } }
          : n
      );
      return updateResultNodes(updatedNodes, edgesRef.current);
    });
  }, [setNodes, updateResultNodes]);

  const updateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges(eds => eds.map(e => 
      e.id === edgeId 
        ? { ...e, data: { ...e.data, label } }
        : e
    ));
  }, [setEdges]);

  const nodesWithCallbacks = useMemo(() => {
    return nodes.map(n => createNodeWithCallbacks(n, updateNodeData));
  }, [nodes, createNodeWithCallbacks, updateNodeData]);

  const edgesWithCallbacks = useMemo(() => {
    return edges.map(e => createEdgeWithCallbacks(e, updateEdgeLabel));
  }, [edges, createEdgeWithCallbacks, updateEdgeLabel]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEditingLabel(node.data.label || '');
  }, []);

  const onConnect = useCallback(
    (params: { source: string | null; target: string | null; sourceHandle?: string | null; targetHandle?: string | null }) => {
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
        }, updateEdgeLabel);
        
        const newEdges = [...eds, newEdge];
        edgesRef.current = newEdges;
        setNodes(nds => updateResultNodes(nds, newEdges));
        
        return newEdges;
      });
    },
    [setEdges, setNodes, updateResultNodes, createEdgeWithCallbacks, updateEdgeLabel]
  );

  const handleEdgesChange = useCallback((changes: unknown) => {
    onEdgesChange(changes);
    setTimeout(() => {
      setNodes(nds => updateResultNodes(nds, edgesRef.current));
    }, 0);
  }, [onEdgesChange, setNodes, updateResultNodes]);

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
      }, updateNodeData);
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
      }, updateNodeData);
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
      }, updateNodeData);
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
      }, updateNodeData);
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
      }, updateNodeData);
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
      }, updateNodeData);
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
  }, [nodes, setNodes, createNodeWithCallbacks, updateNodeData, extractAllVariables]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const updateNodeLabel = useCallback(() => {
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
  }, [selectedNode, editingLabel, setNodes, setSelectedNode, setEditingLabel]);

  const handleAddProductFromResource = useCallback((product: Product) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 };
    const newNode = createNodeWithCallbacks(generateProductNode(product, position, locale), updateNodeData);
    setNodes((nds) => [...nds, newNode]);
    setShowResourcePanel(false);
  }, [createNodeWithCallbacks, locale, updateNodeData, setNodes, setShowResourcePanel]);

  const handleAddVariantFromResource = useCallback((product: Product, variant: ProductVariant) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 };
    const newNode = createNodeWithCallbacks(generateVariantNode(product, variant, position, locale), updateNodeData);
    setNodes((nds) => [...nds, newNode]);
    setShowResourcePanel(false);
  }, [createNodeWithCallbacks, locale, updateNodeData, setNodes, setShowResourcePanel]);

  const handleAddCollectionFromResource = useCallback((collection: Collection, collectionProducts: Product[]) => {
    const { nodes: templateNodes, edges: templateEdges } = generateCollectionFlowTemplate(
      collection,
      collectionProducts,
      locale
    );
    
    const nodesWithCallbacks = templateNodes.map(n => createNodeWithCallbacks(n, updateNodeData));
    const edgesWithCallbacks = templateEdges.map(e => createEdgeWithCallbacks(e, updateEdgeLabel));
    
    setNodes((nds) => [...nds, ...nodesWithCallbacks]);
    setEdges((eds) => [...eds, ...edgesWithCallbacks]);
    setShowResourcePanel(false);
  }, [createNodeWithCallbacks, createEdgeWithCallbacks, locale, updateNodeData, updateEdgeLabel, setNodes, setEdges, setShowResourcePanel]);

  const handleApplyTemplate = useCallback((templateType: TemplateType) => {
    let templateData: { nodes: Node[]; edges: Edge[] };
    
    switch (templateType) {
      case 'cost':
        templateData = generateCostFlowTemplate();
        break;
      case 'revenue':
        templateData = generateRevenueFlowTemplate();
        break;
      case 'collection':
        templateData = { nodes: [], edges: [] };
        break;
      default:
        templateData = { nodes: [], edges: [] };
    }
    
    const nodesWithCallbacks = templateData.nodes.map(n => createNodeWithCallbacks(n, updateNodeData));
    const edgesWithCallbacks = templateData.edges.map(e => createEdgeWithCallbacks(e, updateEdgeLabel));
    
    setNodes((nds) => [...nds, ...nodesWithCallbacks]);
    setEdges((eds) => [...eds, ...edgesWithCallbacks]);
    setShowTemplateSelector(false);
  }, [createNodeWithCallbacks, createEdgeWithCallbacks, updateNodeData, updateEdgeLabel, setNodes, setEdges, setShowTemplateSelector]);

  const handleSave = useCallback(() => {
    const allVars = extractAllVariables(nodes);
    const resultNode = nodes.find(n => n.type === 'result');
    const finalResult = resultNode ? calculateFinalResult(resultNode, allVars) : 0;
    
    const cleanNodes = nodes.map(({ id, type, data, position }) => {
      const cleanData = { ...data };
      delete cleanData.onUpdateImage;
      delete cleanData.onUpdateLabel;
      delete cleanData.onUpdateData;
      return { id, type: type || 'default', data: cleanData, position };
    });
    
    const cleanEdges = edges.map(({ id, source, target, sourceHandle, targetHandle, data }) => ({ 
      id, 
      source, 
      target,
      sourceHandle,
      targetHandle,
      label: data?.label || '',
    }));
    
    const modifiedProducts: DiagramMetadata['modifiedProducts'] = [];
    const modifiedVariants: DiagramMetadata['modifiedVariants'] = [];
    
    nodes.forEach(node => {
      if (node.type === 'product' && node.data.productId) {
        modifiedProducts.push({
          productId: node.data.productId,
          productName: node.data.productName,
          changes: {
            value: node.data.value,
            category: node.data.category,
          },
        });
      }
      if (node.type === 'variant' && node.data.variantId && node.data.isModified) {
        modifiedVariants.push({
          variantId: node.data.variantId,
          productId: node.data.productId,
          changes: {
            retail_price: node.data.retail_price,
            wholesale_price: node.data.wholesale_price,
            cost_price: node.data.cost_price,
            stock_quantity: node.data.stock_quantity,
            sku: node.data.sku,
            color: node.data.color,
            colorHex: node.data.colorHex,
            size: node.data.size,
          },
        });
      }
    });
    
    const metadata: DiagramMetadata = {
      resultNodeId: resultNode?.id,
      totalVariables: allVars,
      finalResult,
      flowType: 'mixed',
      modifiedProducts: modifiedProducts.length > 0 ? modifiedProducts : undefined,
      modifiedVariants: modifiedVariants.length > 0 ? modifiedVariants : undefined,
    };
    
    onSave({ nodes: cleanNodes, edges: cleanEdges, metadata });
  }, [nodes, edges, extractAllVariables, calculateFinalResult, onSave]);

  const isDefaultNode = selectedNode?.type === 'default' || !selectedNode?.type;

  const totalVariables = extractAllVariables(nodes);
  const totalCount = Object.keys(totalVariables).length;
  const totalSum = Object.values(totalVariables as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0);

  const nodeTypes = useMemo(() => ({
    image: ImageNode,
    calculator: CalculatorNode,
    variable: VariableNode,
    product: ProductNode,
    variant: VariantNode,
    result: ResultNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 h-[85vh] flex flex-col overflow-hidden">
        <DiagramToolbar totalCount={totalCount} totalSum={totalSum} onClose={onClose} />

        <div className="flex flex-1 overflow-hidden">
          <NodeLibrary
            showResourcePanel={showResourcePanel}
            setShowResourcePanel={setShowResourcePanel}
            showTemplateSelector={showTemplateSelector}
            setShowTemplateSelector={setShowTemplateSelector}
            TEMPLATE_CONFIGS={TEMPLATE_CONFIGS as unknown as Record<string, unknown>}
            onApplyTemplate={(key) => handleApplyTemplate(key as TemplateType)}
            SPECIAL_NODES={SPECIAL_NODES}
            NODE_TEMPLATES={NODE_TEMPLATES}
            addNode={addNode}
            selectedNode={selectedNode}
            isDefaultNode={isDefaultNode}
            editingLabel={editingLabel}
            setEditingLabel={setEditingLabel}
            onSaveLabel={updateNodeLabel}
            onDeleteSelectedNode={deleteSelectedNode}
          />

          {showResourcePanel && (
            <aside className="w-72 border-r border-neutral-100 bg-neutral-50">
              <ResourcePanel
                locale={locale}
                onAddProduct={handleAddProductFromResource}
                onAddCollection={handleAddCollectionFromResource}
                onAddVariant={handleAddVariantFromResource}
              />
            </aside>
          )}

          <DiagramCanvas
            nodes={nodesWithCallbacks}
            edges={edgesWithCallbacks}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
          />
        </div>

        <DiagramFooter onCancel={onClose} onSave={handleSave} />
      </div>
    </div>
  );
};

export default DiagramEditor;
