import { useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { generateVarName } from './useDiagramState';

export function useDiagramCalculations() {
  const extractAllVariables = useCallback((nodes: Node[]): Record<string, number> => {
    const vars: Record<string, number> = {};
    
    nodes.forEach(node => {
      if (node.type === 'product') {
        const varName = generateVarName(node.data.productName || 'produto');
        vars[varName] = node.data.value ?? 0;
      } else if (node.type === 'variant') {
        const varName = generateVarName(node.data.sku || 'variacao');
        vars[varName] = node.data.retail_price ?? 0;
      } else if (node.type === 'variable') {
        const varName = node.data.varName ?? `var_${node.id}`;
        vars[varName] = node.data.varValue ?? 0;
      } else if (node.type === 'calculator' && typeof node.data.result === 'number') {
        vars[`calc_${node.id.replace('node-', '')}`] = node.data.result;
      }
    });
    
    return vars;
  }, []);

  const findConnectedNodes = useCallback((
    targetNodeId: string,
    allNodes: Node[],
    allEdges: Edge[],
    visited: Set<string> = new Set()
  ): Node[] => {
    if (visited.has(targetNodeId)) return [];
    visited.add(targetNodeId);

    const connectedNodes: Node[] = [];
    
    const incomingEdges = allEdges.filter(e => e.target === targetNodeId);
    
    incomingEdges.forEach(edge => {
      const sourceNode = allNodes.find(n => n.id === edge.source);
      if (sourceNode && !visited.has(sourceNode.id)) {
        connectedNodes.push(sourceNode);
        const upstreamNodes = findConnectedNodes(sourceNode.id, allNodes, allEdges, visited);
        connectedNodes.push(...upstreamNodes);
      }
    });

    return connectedNodes;
  }, []);

  const extractConnectedVariables = useCallback((
    resultNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): Record<string, number> => {
    const vars: Record<string, number> = {};
    const connectedNodes = findConnectedNodes(resultNodeId, allNodes, allEdges);
    
    connectedNodes.forEach(node => {
      if (node.type === 'product') {
        const varName = generateVarName(node.data.productName || 'produto');
        vars[varName] = node.data.value ?? 0;
      } else if (node.type === 'variant') {
        const varName = generateVarName(node.data.sku || 'variacao');
        vars[varName] = node.data.retail_price ?? 0;
      } else if (node.type === 'variable') {
        const varName = node.data.varName ?? `var_${node.id}`;
        vars[varName] = node.data.varValue ?? 0;
      } else if (node.type === 'calculator' && typeof node.data.result === 'number') {
        vars[`calc_${node.id.replace('node-', '')}`] = node.data.result;
      }
    });
    
    return vars;
  }, [findConnectedNodes]);

  const calculateFinalResult = useCallback((
    resultNode: Node,
    connectedVariables: Record<string, number>
  ): number => {
    if (resultNode.data.formula && resultNode.data.formula.trim()) {
      try {
        let formula = resultNode.data.formula;
        Object.entries(connectedVariables).forEach(([key, value]) => {
          formula = formula.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        });
        const result = new Function(`return ${formula}`)();
        return typeof result === 'number' ? Math.round(result * 100) / 100 : 0;
      } catch {
        return 0;
      }
    }
    
    return Object.values(connectedVariables).reduce((a, b) => a + b, 0);
  }, []);

  const updateResultNodes = useCallback((currentNodes: Node[], currentEdges: Edge[]): Node[] => {
    return currentNodes.map(n => {
      if (n.type === 'result') {
        const connectedVars = extractConnectedVariables(n.id, currentNodes, currentEdges);
        const finalResult = calculateFinalResult(n, connectedVars);
        return { ...n, data: { ...n.data, variables: connectedVars, finalResult } };
      }
      return n;
    });
  }, [extractConnectedVariables, calculateFinalResult]);

  return {
    extractAllVariables,
    findConnectedNodes,
    extractConnectedVariables,
    calculateFinalResult,
    updateResultNodes,
  };
}
