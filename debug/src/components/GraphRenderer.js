import React from 'react';

function getNodePos(idx, total, radius = 100) {
  const angle = (2 * Math.PI * idx) / total;
  return {
    x: radius * Math.cos(angle) + radius + 20,
    y: radius * Math.sin(angle) + radius + 20,
  };
}

export default function GraphRenderer({ state, highlightOp }) {
  if (!state || !Array.isArray(state.nodes) || !Array.isArray(state.edges)) return <div>Invalid graph state</div>;
  const nodePos = state.nodes.map((n, i) => getNodePos(i, state.nodes.length));
  return (
    <div className="relative w-[260px] h-[260px] mx-auto my-4">
      <svg width={260} height={260}>
        {state.edges.map((edge, i) => {
          const from = nodePos[edge.from];
          const to = nodePos[edge.to];
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={highlightOp === 'delete' ? '#f87171' : 'url(#edgeGradient)'}
              strokeWidth={highlightOp === 'insert' ? 5 : 3}
              opacity={highlightOp === 'delete' ? 0.5 : 1}
              className="transition-all duration-500 animate-pulse"
            />
          );
        })}
        <defs>
          <linearGradient id="edgeGradient" x1="0" y1="0" x2="260" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        {state.nodes.map((node, i) => {
          const isInsert = highlightOp === 'insert' && i === state.nodes.length - 1;
          const isDelete = highlightOp === 'delete' && node == null;
          const isUpdate = highlightOp === 'update';
          return (
            <g key={i}>
              <circle
                cx={nodePos[i].x}
                cy={nodePos[i].y}
                r={26}
                fill={isInsert ? 'url(#nodeGradient)' : '#e0e7ff'}
                stroke={isUpdate ? '#60a5fa' : '#334155'}
                strokeWidth={isUpdate ? 5 : 2}
                opacity={isDelete ? 0.5 : 1}
                className={`transition-all duration-500 ${isInsert ? 'scale-110 shadow-2xl animate-bounce' : ''} ${isDelete ? 'animate-fadeOut' : ''} ${isUpdate ? 'animate-pulse' : ''}`}
              />
              <text
                x={nodePos[i].x}
                y={nodePos[i].y + 7}
                textAnchor="middle"
                fontSize={18}
                fill="#222"
                fontWeight="bold"
              >
                {node && node.value !== undefined ? node.value : '∅'}
              </text>
              {isInsert && <text x={nodePos[i].x + 18} y={nodePos[i].y - 18} fontSize={18} fill="#22c55e" className="animate-bounce">➕</text>}
              {isDelete && <text x={nodePos[i].x + 18} y={nodePos[i].y - 18} fontSize={18} fill="#ef4444" className="animate-bounce">➖</text>}
              {isUpdate && <text x={nodePos[i].x + 18} y={nodePos[i].y - 18} fontSize={18} fill="#3b82f6" className="animate-pulse">✏️</text>}
            </g>
          );
        })}
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
} 