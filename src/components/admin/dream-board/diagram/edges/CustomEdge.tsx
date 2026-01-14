import React, { useState, useRef } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { MessageSquare } from 'lucide-react';
import { CustomEdgeData } from '../types';

export const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [labelText, setLabelText] = useState(data?.label || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data?.onLabelChange) {
      data.onLabelChange(labelText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLabelText(data?.label || '');
      setIsEditing(false);
    }
  };

  return (
    <>
      <path
        id={id}
        style={{ ...style, strokeWidth: 2 }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="px-2 py-1 text-xs border border-neutral-300 rounded-lg bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              placeholder="Comentario..."
            />
          ) : (
            <button
              onDoubleClick={handleDoubleClick}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                labelText
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                  : 'bg-white/80 text-neutral-400 border border-dashed border-neutral-300 hover:border-neutral-400 hover:bg-white'
              }`}
              title="Duplo clique para editar"
            >
              <MessageSquare className="w-3 h-3" />
              {labelText || 'Adicionar nota'}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
