import html2canvas from 'html2canvas';
import { Node, Edge, getNodesBounds } from 'reactflow';
import { DiagramData } from '../types/diagram';

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportDiagramAsPNG(
  reactFlowElement: HTMLElement,
  diagram: DiagramData,
  cardTitle: string
): Promise<void> {
  const canvas = await html2canvas(reactFlowElement, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
    useCORS: true,
    allowTaint: false,
  });

  canvas.toBlob((blob) => {
    if (!blob) {
      throw new Error('Failed to create PNG blob');
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `diagrama-${sanitizeFileName(cardTitle)}-${timestamp}.png`;
    downloadBlob(blob, filename);
  }, 'image/png');
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function exportDiagramAsSVG(
  nodes: Node[],
  edges: Edge[],
  diagram: DiagramData,
  cardTitle: string
): void {
  if (nodes.length === 0) {
    throw new Error('No nodes to export');
  }

  const bounds = getNodesBounds(nodes);
  const padding = 50;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;
  const offsetX = -bounds.x + padding;
  const offsetY = -bounds.y + padding;

  const nodeColors: Record<string, string> = {
    product: '#06B6D4',
    variant: '#F59E0B',
    result: '#16A34A',
    calculator: '#22C55E',
    variable: '#A855F7',
    image: '#0EA5E9',
  };

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#333" />
    </marker>
  </defs>
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <g transform="translate(${offsetX}, ${offsetY})">`;

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourceX = sourceNode.position.x + (sourceNode.width || 150) / 2;
    const sourceY = sourceNode.position.y + (sourceNode.height || 100) / 2;
    const targetX = targetNode.position.x + (targetNode.width || 150) / 2;
    const targetY = targetNode.position.y + (targetNode.height || 100) / 2;

    svg += `
    <line x1="${sourceX}" y1="${sourceY}" x2="${targetX}" y2="${targetY}" 
          stroke="#333" stroke-width="2" marker-end="url(#arrowhead)" />`;
  });

  nodes.forEach((node) => {
    const x = node.position.x;
    const y = node.position.y;
    const nodeWidth = node.width || 150;
    const nodeHeight = node.height || 100;
    const color = nodeColors[node.type || 'default'] || '#6B7280';
    const label = truncateText(String(node.data?.label || node.id), 30);
    const escapedLabel = escapeXml(label);

    svg += `
    <g>
      <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" 
            fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2" rx="8"/>
      <text x="${x + nodeWidth / 2}" y="${y + nodeHeight / 2}" 
            text-anchor="middle" dominant-baseline="middle" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="12" font-weight="600" fill="#1a1a1a">
        ${escapedLabel}
      </text>
    </g>`;
  });

  const escapedTitle = escapeXml(cardTitle);
  svg += `
  </g>
  <text x="10" y="${height - 20}" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="10" fill="#666">
    ${escapedTitle} - ${new Date().toLocaleDateString('pt-BR')}
  </text>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `diagrama-${sanitizeFileName(cardTitle)}-${timestamp}.svg`;
  downloadBlob(blob, filename);
}

export function exportDiagramAsJSON(
  diagram: DiagramData,
  cardTitle: string
): void {
  const data = {
    title: cardTitle,
    exportedAt: new Date().toISOString(),
    diagram: {
      nodes: diagram.nodes,
      edges: diagram.edges,
      metadata: diagram.metadata,
    },
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `diagrama-${sanitizeFileName(cardTitle)}-${timestamp}.json`;
  downloadBlob(blob, filename);
}
