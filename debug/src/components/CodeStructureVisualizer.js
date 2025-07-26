import React from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer';

function structureToFlow(structure) {
  const nodes = [];
  const edges = [];
  if (structure.type === 'Array' && Array.isArray(structure.values)) {
    structure.values.forEach((val, idx) => {
      nodes.push({
        id: `${structure.label}-arr-${idx}`,
        data: { label: val.toString() },
        position: { x: 100 + idx * 70, y: 100 },
        style: { background: '#2563eb', color: '#fff', borderRadius: 12, padding: 12, fontWeight: 'bold' },
      });
      if (idx > 0) {
        edges.push({
          id: `${structure.label}-arr-e-${idx}`,
          source: `${structure.label}-arr-${idx - 1}`,
          target: `${structure.label}-arr-${idx}`,
          animated: true,
          style: { stroke: '#818cf8', strokeWidth: 2 },
        });
      }
    });
  } else if ((structure.type || '').toLowerCase().includes('linkedlist') && Array.isArray(structure.nodes)) {
    structure.nodes.forEach((node, idx) => {
      nodes.push({
        id: node.id,
        data: { label: node.value },
        position: { x: 100 + idx * 120, y: 200 },
        style: { background: '#0ea5e9', color: '#fff', borderRadius: 20, padding: 16, fontWeight: 'bold' },
      });
      if (node.next) {
        edges.push({
          id: `e-${node.id}-${node.next}`,
          source: node.id,
          target: node.next,
          label: 'next',
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 2 },
        });
      }
      if (node.prev) {
        edges.push({
          id: `e-${node.id}-${node.prev}`,
          source: node.id,
          target: node.prev,
          label: 'prev',
          style: { stroke: '#fbbf24', strokeDasharray: '4 2', strokeWidth: 2 },
        });
      }
    });
    // Pointers (head/tail)
    if (structure.pointers) {
      Object.entries(structure.pointers).forEach(([name, nodeId], i) => {
        nodes.push({
          id: `${structure.label}-ptr-${name}`,
          data: { label: name },
          position: { x: 100 + i * 120, y: 80 },
          style: { background: '#f59e42', color: '#fff', borderRadius: 16, padding: 8, fontWeight: 'bold' },
        });
        edges.push({
          id: `ptr-${name}-${nodeId}`,
          source: `${structure.label}-ptr-${name}`,
          target: nodeId,
          style: { stroke: '#f59e42', strokeWidth: 2 },
          animated: true,
        });
      });
    }
  } else if ((structure.type || '').toLowerCase().includes('tree') && Array.isArray(structure.nodes)) {
    // Simple binary tree layout (vertical)
    const nodeMap = {};
    structure.nodes.forEach((node, idx) => {
      nodeMap[node.id] = node;
      nodes.push({
        id: node.id,
        data: { label: node.value },
        position: { x: 100 + idx * 100, y: 300 + (node.id.length * 10) },
        style: { background: '#a21caf', color: '#fff', borderRadius: 20, padding: 16, fontWeight: 'bold' },
      });
    });
    structure.nodes.forEach((node) => {
      if (node.left) {
        edges.push({
          id: `e-${node.id}-${node.left}`,
          source: node.id,
          target: node.left,
          label: 'left',
          style: { stroke: '#f472b6', strokeWidth: 2 },
        });
      }
      if (node.right) {
        edges.push({
          id: `e-${node.id}-${node.right}`,
          source: node.id,
          target: node.right,
          label: 'right',
          style: { stroke: '#60a5fa', strokeWidth: 2 },
        });
      }
    });
  } else if ((structure.type || '').toLowerCase().includes('graph') && Array.isArray(structure.nodes)) {
    structure.nodes.forEach((node, idx) => {
      nodes.push({
        id: node.id,
        data: { label: node.value },
        position: { x: 100 + idx * 100, y: 400 },
        style: { background: '#f43f5e', color: '#fff', borderRadius: 20, padding: 16, fontWeight: 'bold' },
      });
    });
    if (Array.isArray(structure.edges)) {
      structure.edges.forEach((edge, i) => {
        edges.push({
          id: `g-e-${edge.from}-${edge.to}`,
          source: edge.from,
          target: edge.to,
          label: edge.label || '',
          style: { stroke: '#f43f5e', strokeWidth: 2 },
        });
      });
    }
  }
  return { nodes, edges };
}

export default function CodeStructureVisualizer({ structures }) {
  if (!structures || !structures.length) return null;
  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-900 rounded-2xl shadow-2xl mt-8 p-4">
      {structures.map((structure, idx) => {
        const { nodes, edges } = structureToFlow(structure);
        return (
          <div key={idx} className="mb-12">
            <div className="font-bold text-lg text-white mb-2">{structure.label || structure.type}</div>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              style={{ width: '100%', height: 320, background: '#18181b', borderRadius: 16 }}
            >
              <MiniMap />
              <Controls />
              <Background color="#444" gap={16} />
            </ReactFlow>
          </div>
        );
      })}
    </div>
  );
} 