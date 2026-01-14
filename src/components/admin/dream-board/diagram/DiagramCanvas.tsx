import React from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MarkerType, MiniMap, type Edge, type Node } from 'reactflow';

export function DiagramCanvas(props: {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onConnect: any;
  onNodeClick: any;
  nodeTypes: any;
  edgeTypes: any;
}) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, nodeTypes, edgeTypes } = props;

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'custom',
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-neutral-100 !border !border-neutral-200 !rounded-xl !shadow-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
          nodeColor={(node) => {
            if (node.type === 'product') return '#06B6D4';
            if (node.type === 'variant') return '#F59E0B';
            if (node.type === 'result') return '#16A34A';
            if (node.type === 'calculator') return '#22C55E';
            if (node.type === 'variable') return '#A855F7';
            if (node.type === 'image') return '#0EA5E9';
            return (node.data as any)?.color || '#6B7280';
          }}
        />
      </ReactFlow>
    </div>
  );
}

