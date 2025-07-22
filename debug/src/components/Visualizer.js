import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider
} from 'react-flow-renderer';

function CustomNode({ data }) {
  return (
    <div className="transition-transform duration-200 hover:scale-105 relative group">
      <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg">
        {data.label}
      </div>
      {data.tooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-zinc-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {data.tooltip}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  default: CustomNode,
};

function VisualizerInner({ aiResponse }) {
  const reactFlowWrapper = useRef(null);
  const { toObject } = useReactFlow();

  if (!aiResponse || !aiResponse.visualization) return null;
  const { nodes = [], edges = [] } = aiResponse.visualization;

  const flowNodes = nodes.map((node, idx) => ({
    id: node.id?.toString() || `node-${idx}`,
    type: 'default',
    data: {
      label: node.label || node.type || `Node ${idx}`,
      tooltip: node.tooltip || '',
    },
    position: node.position || { x: 100 * idx, y: 100 },
  }));

  const flowEdges = edges.map((edge, idx) => ({
    id: edge.id?.toString() || `edge-${idx}`,
    source: edge.source?.toString() || '',
    target: edge.target?.toString() || '',
    label: edge.label || '',
    animated: edge.animated || false,
    style: edge.style || {},
  }));

  // Layout fallback if no positions
  if (flowNodes.length && !flowNodes.some(n => n.position)) {
    flowNodes.forEach((n, i) => {
      n.position = { x: 100 * i, y: 100 };
    });
  }

  // Download/export as JSON
  const handleExport = () => {
    const diagram = toObject();
    const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-zinc-900/90 dark:bg-zinc-900 rounded-2xl shadow-2xl mt-8 p-0 animate-fade-in">
      <div className="flex justify-between items-center px-6 pt-6 pb-2">
        <h2 className="text-lg font-bold text-white">Code Logic Visualizer</h2>
        <button
          onClick={handleExport}
          className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow hover:from-blue-700 hover:to-pink-700 transition-all text-sm"
        >
          Export Diagram
        </button>
      </div>
      <div className="h-[440px] w-full rounded-b-2xl overflow-hidden" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          panOnScroll
          zoomOnScroll
          panOnDrag
          nodeTypes={nodeTypes}
        >
          <MiniMap />
          <Controls showInteractive={true} />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function Visualizer(props) {
  return (
    <ReactFlowProvider>
      <VisualizerInner {...props} />
    </ReactFlowProvider>
  );
} 