import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider
} from 'react-flow-renderer';

// Icon SVGs
const icons = {
  fn: <span role="img" aria-label="function">🧩</span>,
  conditional: <span role="img" aria-label="conditional">🔶</span>,
  loop: <span role="img" aria-label="loop">🔁</span>,
  bug: <span role="img" aria-label="bug">⚠️</span>,
  entry: <span role="img" aria-label="entry">🔵</span>,
  exit: <span role="img" aria-label="exit">🟣</span>,
};

function CustomNode({ data, isActive, onClick, onHover, onLeave }) {
  // Style by type
  let style = 'px-4 py-2 rounded-lg text-white shadow-lg flex items-center gap-2 cursor-pointer';
  let icon = null;
  let shape = {};
  if (isActive) style += ' ring-4 ring-yellow-400 z-10';
  switch (data.type) {
    case 'function':
      style += ' bg-blue-600';
      icon = icons.fn;
      break;
    case 'conditional':
      style += ' bg-orange-500';
      shape = { transform: 'rotate(45deg)', width: 60, height: 60 };
      icon = icons.conditional;
      break;
    case 'loop':
      style += ' bg-green-600';
      icon = icons.loop;
      break;
    case 'bug':
      style += ' bg-zinc-900 border-2 border-red-500';
      icon = icons.bug;
      break;
    case 'entry':
      style += ' bg-gradient-to-r from-blue-400 to-purple-500 rounded-full';
      icon = icons.entry;
      shape = { width: 56, height: 56 };
      break;
    case 'exit':
      style += ' bg-gradient-to-r from-pink-500 to-purple-600 rounded-full';
      icon = icons.exit;
      shape = { width: 56, height: 56 };
      break;
    default:
      style += ' bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500';
  }
  return (
    <div
      className={`transition-transform duration-200 hover:scale-105 relative group`}
      style={shape}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className={style} style={data.type === 'conditional' ? { transform: 'rotate(-45deg)' } : {}}>
        {icon}
        <span style={data.type === 'conditional' ? { transform: 'rotate(45deg)' } : {}}>{data.label}</span>
      </div>
      {(data.line || data.explanation) && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-zinc-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[180px] text-center">
          {data.line && <div>Line: {data.line}</div>}
          {data.explanation && <div>{data.explanation}</div>}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  default: (props) => <CustomNode {...props}
    isActive={props.data.isActive}
    onClick={props.data.onClick}
    onHover={props.data.onHover}
    onLeave={props.data.onLeave}
  />,
};

function VisualizerInner({ aiResponse, setHighlightedLines }) {
  const reactFlowWrapper = useRef(null);
  const { toObject } = useReactFlow();
  const [activeNode, setActiveNode] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [visibleNodes, setVisibleNodes] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackTimer, setPlaybackTimer] = useState(null);
  const [paused, setPaused] = useState(false);

  if (!aiResponse || !aiResponse.visualization) return null;
  const { nodes = [], edges = [] } = aiResponse.visualization;

  // Find entry node(s)
  const entryNodes = nodes.filter(n => n.type === 'entry');
  const entryId = entryNodes.length ? (entryNodes[0].id?.toString() || 'node-0') : (nodes[0]?.id?.toString() || 'node-0');

  // Playback helpers
  const nodeOrder = nodes.map((n, idx) => n.id?.toString() || `node-${idx}`);

  // Start playback mode
  const startPlayback = () => {
    setPlaybackMode(true);
    setVisibleNodes([entryId]);
    setPlaybackIndex(0);
    setActiveNode(entryId);
    setPaused(false);
    if (setHighlightedLines) {
      const entryNode = nodes.find(n => (n.id?.toString() || `node-0`) === entryId);
      if (entryNode && entryNode.line) {
        if (typeof entryNode.line === 'number') setHighlightedLines([entryNode.line]);
        else if (typeof entryNode.line === 'object' && entryNode.line.start && entryNode.line.end) setHighlightedLines([{ start: entryNode.line.start, end: entryNode.line.end }]);
      }
    }
  };

  // Stop playback mode
  const stopPlayback = () => {
    setPlaybackMode(false);
    setVisibleNodes(nodeOrder);
    setPlaybackIndex(0);
    setActiveNode(null);
    setPaused(false);
    if (setHighlightedLines) setHighlightedLines([]);
    if (playbackTimer) clearTimeout(playbackTimer);
  };

  // Step to next node
  const stepPlayback = () => {
    if (playbackIndex < nodeOrder.length - 1) {
      const nextIdx = playbackIndex + 1;
      const nextId = nodeOrder[nextIdx];
      setVisibleNodes(v => Array.from(new Set([...v, nextId])));
      setPlaybackIndex(nextIdx);
      setActiveNode(nextId);
      if (setHighlightedLines) {
        const node = nodes.find(n => (n.id?.toString() || `node-${nextIdx}`) === nextId);
        if (node && node.line) {
          if (typeof node.line === 'number') setHighlightedLines([node.line]);
          else if (typeof node.line === 'object' && node.line.start && node.line.end) setHighlightedLines([{ start: node.line.start, end: node.line.end }]);
        }
      }
    } else {
      setActiveNode(null);
      setPaused(false);
      if (setHighlightedLines) setHighlightedLines([]);
    }
  };

  // Play animation
  const playFlow = () => {
    setPlaying(true);
    setPaused(false);
    const animate = (idx) => {
      if (!playbackMode || paused) return;
      if (idx >= nodeOrder.length) {
        setActiveNode(null);
        setPlaying(false);
        setPaused(false);
        if (setHighlightedLines) setHighlightedLines([]);
        return;
      }
      const nodeId = nodeOrder[idx];
      setVisibleNodes(v => Array.from(new Set([...v, nodeId])));
      setPlaybackIndex(idx);
      setActiveNode(nodeId);
      if (setHighlightedLines) {
        const node = nodes.find(n => (n.id?.toString() || `node-${idx}`) === nodeId);
        if (node && node.line) {
          if (typeof node.line === 'number') setHighlightedLines([node.line]);
          else if (typeof node.line === 'object' && node.line.start && node.line.end) setHighlightedLines([{ start: node.line.start, end: node.line.end }]);
        }
      }
      const timer = setTimeout(() => animate(idx + 1), 900);
      setPlaybackTimer(timer);
    };
    animate(playbackIndex);
  };

  // Pause playback
  const pausePlayback = () => {
    setPaused(true);
    setPlaying(false);
    if (playbackTimer) clearTimeout(playbackTimer);
  };

  // Resume playback
  const resumePlayback = () => {
    setPaused(false);
    setPlaying(true);
    playFlow();
  };

  // Scroll to explanation
  const handleNodeClick = (id) => {
    setActiveNode(id);
    const el = document.getElementById(`explanation-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Render only visible nodes in playback mode
  const flowNodes = playbackMode
    ? nodes.map((node, idx) => {
        const nodeId = node.id?.toString() || `node-${idx}`;
        if (!visibleNodes.includes(nodeId)) return null;
        return {
          id: nodeId,
          type: 'default',
          data: {
            label: node.label || node.type || `Node ${idx}`,
            type: node.type,
            line: node.line,
            explanation: node.explanation,
            isActive: activeNode === nodeId,
            onClick: () => handleNodeClick(nodeId),
            onHover: () => {
              if (setHighlightedLines && node.line) {
                if (typeof node.line === 'number') setHighlightedLines([node.line]);
                else if (typeof node.line === 'object' && node.line.start && node.line.end) setHighlightedLines([{ start: node.line.start, end: node.line.end }]);
              }
            },
            onLeave: () => setHighlightedLines && setHighlightedLines([]),
          },
          position: node.position || { x: 100 * idx, y: 100 },
        };
      }).filter(Boolean)
    : nodes.map((node, idx) => {
        const nodeId = node.id?.toString() || `node-${idx}`;
        return {
          id: nodeId,
          type: 'default',
          data: {
            label: node.label || node.type || `Node ${idx}`,
            type: node.type,
            line: node.line,
            explanation: node.explanation,
            isActive: activeNode === nodeId,
            onClick: () => handleNodeClick(nodeId),
            onHover: () => {
              if (setHighlightedLines && node.line) {
                if (typeof node.line === 'number') setHighlightedLines([node.line]);
                else if (typeof node.line === 'object' && node.line.start && node.line.end) setHighlightedLines([{ start: node.line.start, end: node.line.end }]);
              }
            },
            onLeave: () => setHighlightedLines && setHighlightedLines([]),
          },
          position: node.position || { x: 100 * idx, y: 100 },
        };
      });

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
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow hover:from-blue-700 hover:to-pink-700 transition-all text-sm"
          >
            Export Diagram
          </button>
          {!playbackMode && (
            <button
              onClick={startPlayback}
              className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold shadow hover:from-yellow-500 hover:to-orange-600 transition-all text-sm"
            >
              ▶ Run
            </button>
          )}
          {playbackMode && (
            <>
              <button
                onClick={playing ? pausePlayback : resumePlayback}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold shadow hover:from-green-600 hover:to-blue-600 transition-all text-sm"
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={stepPlayback}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold shadow hover:from-blue-500 hover:to-purple-600 transition-all text-sm"
                disabled={playing}
              >
                Step
              </button>
              <button
                onClick={stopPlayback}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-zinc-600 to-zinc-900 text-white font-semibold shadow hover:from-zinc-700 hover:to-zinc-950 transition-all text-sm"
              >
                Stop
              </button>
            </>
          )}
        </div>
      </div>
      <div className="h-[440px] w-full rounded-b-2xl overflow-hidden relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          fitView
          panOnScroll
          zoomOnScroll
          panOnDrag
          nodeTypes={nodeTypes}
        >
          <MiniMap style={{ position: 'absolute', right: 10, bottom: 10, width: 120, height: 80, background: '#222', borderRadius: 8, boxShadow: '0 2px 8px #0004' }} />
          <Controls showInteractive={true} />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </div>
      {/* Explanations below */}
      <div className="px-8 py-6 bg-zinc-950/80 rounded-b-2xl">
        <h3 className="text-white text-lg font-bold mb-4">Node Explanations</h3>
        <ul className="space-y-4">
          {nodes.map((node, idx) => (
            <li
              key={node.id || idx}
              id={`explanation-${node.id?.toString() || `node-${idx}`}`}
              className={`p-4 rounded-lg ${activeNode === (node.id?.toString() || `node-${idx}`) ? 'bg-blue-900/60 ring-2 ring-yellow-400' : 'bg-zinc-800/60'} text-white transition-all`}
            >
              <div className="font-semibold mb-1">{node.label || node.type || `Node ${idx}`}</div>
              {node.line && <div className="text-xs text-zinc-300 mb-1">Line: {node.line}</div>}
              {node.explanation && <div className="text-sm">{node.explanation}</div>}
            </li>
          ))}
        </ul>
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