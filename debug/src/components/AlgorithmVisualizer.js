import React, { useState, useEffect, useRef } from 'react';
import D3Visualizer from './D3Visualizer';

export default function AlgorithmVisualizer({ visualizationData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [showPointers, setShowPointers] = useState(true);
  const [showComparisons, setShowComparisons] = useState(true);
  const [useD3, setUseD3] = useState(false);
  const intervalRef = useRef(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && currentStep < (visualizationData?.animationSteps?.length || 0) - 1) {
      intervalRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed);
    } else if (currentStep >= (visualizationData?.animationSteps?.length || 0) - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentStep, speed, visualizationData?.animationSteps?.length]);

  if (!visualizationData || !visualizationData.animationSteps) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100">
        <h2 className="text-xl font-bold mb-4">🎬 Algorithm Visualizer</h2>
        <p className="text-zinc-600 dark:text-zinc-400">No visualization data available.</p>
      </div>
    );
  }

  const { algorithmType, visualizationType, animationSteps, config } = visualizationData;
  const totalSteps = animationSteps.length;
  const currentAnimation = animationSteps[currentStep];

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
  };

  // Intelligent data extraction and visualization
  const extractVisualizationData = (data) => {
    if (!data) return null;

    // Try to detect data type and extract meaningful information
    const extracted = {
      type: 'unknown',
      data: null,
      metadata: {}
    };

    // Check for arrays (sorting, searching)
    if (data.array && Array.isArray(data.array)) {
      extracted.type = 'array';
      extracted.data = data.array;
      extracted.metadata = {
        highlighted: data.highlighted || [],
        pointers: data.pointers || {},
        comparisons: data.comparisons || []
      };
    }
    // Check for nodes (trees, graphs, linked lists)
    else if (data.nodes && Array.isArray(data.nodes)) {
      if (data.edges && Array.isArray(data.edges)) {
        extracted.type = 'graph';
        extracted.data = { nodes: data.nodes, edges: data.edges };
        extracted.metadata = {
          highlighted: data.highlighted || [],
          visited: data.visited || [],
          path: data.path || []
        };
      } else {
        extracted.type = 'tree';
        extracted.data = data.nodes;
        extracted.metadata = {
          highlighted: data.highlighted || [],
          visited: data.visited || [],
          traversal: data.traversal || []
        };
      }
    }
    // Check for linked list structure
    else if (data.head || (data.nodes && data.connections)) {
      extracted.type = 'linked_list';
      extracted.data = data.nodes || [];
      extracted.metadata = {
        highlighted: data.highlighted || [],
        current: data.current || null,
        connections: data.connections || []
      };
    }
    // Check for matrix/grid (maze, pathfinding)
    else if (data.matrix && Array.isArray(data.matrix)) {
      extracted.type = 'matrix';
      extracted.data = data.matrix;
      extracted.metadata = {
        highlighted: data.highlighted || [],
        path: data.path || [],
        start: data.start,
        end: data.end
      };
    }
    // Check for variables and their values
    else if (data.variables) {
      extracted.type = 'variables';
      extracted.data = data.variables;
      extracted.metadata = {
        step: data.step || 0,
        operation: data.operation || ''
      };
    }
    // Check for graph-like structures without explicit nodes/edges
    else if (data.graph || data.vertices || data.adjacency) {
      extracted.type = 'graph';
      // Convert graph-like structures to nodes/edges format
      const nodes = data.vertices || data.graph?.vertices || [];
      const edges = data.edges || data.graph?.edges || data.adjacency || [];
      
      extracted.data = { 
        nodes: nodes.map((node, index) => ({
          id: index,
          value: node.value || node.id || node,
          ...node
        })),
        edges: edges.map((edge, index) => ({
          from: edge.from || edge.source || 0,
          to: edge.to || edge.target || 0,
          ...edge
        }))
      };
      extracted.metadata = {
        highlighted: data.highlighted || [],
        visited: data.visited || [],
        path: data.path || []
      };
    }
    // Check for any object with numeric values that could be a graph
    else if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      const values = Object.values(data);
      
      // If it looks like a graph (has numeric values and connections)
      if (keys.length > 0 && values.some(v => typeof v === 'number' || Array.isArray(v))) {
        extracted.type = 'graph';
        extracted.data = {
          nodes: keys.map((key, index) => ({
            id: index,
            value: data[key] || key,
            name: key
          })),
          edges: [] // Will be populated if connections are found
        };
        extracted.metadata = {
          highlighted: data.highlighted || [],
          visited: data.visited || [],
          path: data.path || []
        };
      }
    }

    return extracted;
  };

  const renderArrayVisualization = (data, metadata) => {
    const { highlighted, pointers, comparisons } = metadata;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">📊 Array Visualization</h3>
        <div className="flex items-end justify-center gap-2 h-40">
          {data.map((value, index) => (
            <div
              key={index}
              className={`relative flex flex-col items-center transition-all duration-300 ${
                highlighted?.includes(index) ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-blue-500 dark:bg-blue-600'
              } rounded-t-lg min-w-[50px] border-2 border-white shadow-lg`}
              style={{ height: `${Math.max((value / Math.max(...data)) * 120, 30)}px` }}
            >
              <span className="text-sm text-white font-bold mt-1 mb-1">{value}</span>
              <span className="text-xs text-white opacity-80">[{index}]</span>
              {showPointers && pointers && (
                <span className="text-xs text-red-500 font-bold absolute -top-6 bg-white px-1 rounded">
                  {pointers.i === index ? 'i' : pointers.j === index ? 'j' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
        {showComparisons && comparisons && comparisons.length > 0 && (
          <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Comparisons: </span>
            {comparisons.join(', ')}
          </div>
        )}
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center">
          Array: [{data.join(', ')}]
        </div>
      </div>
    );
  };

  const renderTreeVisualization = (data, metadata) => {
    const { highlighted, visited, traversal } = metadata;
    
    // Build tree structure
    const buildTree = (nodes) => {
      if (!nodes || nodes.length === 0) return null;
      
      // If nodes already have tree structure
      if (nodes[0].left !== undefined || nodes[0].right !== undefined) {
        return nodes[0];
      }
      
      // Build BST from array representation
      const root = nodes[0];
      const tree = { value: root.value, left: null, right: null, index: 0 };
      
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        let current = tree;
        
        if (node.value < current.value) {
          if (!current.left) {
            current.left = { value: node.value, left: null, right: null, index: i };
          } else {
            current = current.left;
          }
        } else {
          if (!current.right) {
            current.right = { value: node.value, left: null, right: null, index: i };
          } else {
            current = current.right;
          }
        }
      }
      
      return tree;
    };
    
    const renderTreeNode = (node, level = 0, x = 50) => {
      if (!node) return null;
      
      const isHighlighted = highlighted?.includes(node.index);
      const isVisited = visited?.includes(node.index);
      const isCurrent = highlighted?.includes(node.index);
      
      let bgColor = 'bg-green-500';
      if (isCurrent) bgColor = 'bg-yellow-500';
      else if (isVisited) bgColor = 'bg-blue-500';
      else if (isHighlighted) bgColor = 'bg-purple-500';
      
      const nodeWidth = 70;
      const levelHeight = 80;
      
      return (
        <div key={node.index} className="flex flex-col items-center" style={{ width: `${nodeWidth}px` }}>
          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-white font-bold transition-all duration-300 ${bgColor} border-2 border-white shadow-lg`}>
            <span className="text-sm">{node.value}</span>
            <span className="text-xs opacity-80">[{node.index}]</span>
          </div>
          
          {(node.left || node.right) && (
            <div className="flex justify-center mt-2 relative" style={{ width: `${nodeWidth * 2}px` }}>
              {node.left && (
                <div className="flex flex-col items-center" style={{ width: `${nodeWidth}px` }}>
                  <div className="w-0.5 h-4 bg-gray-400"></div>
                  <div className="text-xs text-gray-500 mb-1">L</div>
                  {renderTreeNode(node.left, level + 1)}
                </div>
              )}
              {node.right && (
                <div className="flex flex-col items-center" style={{ width: `${nodeWidth}px` }}>
                  <div className="w-0.5 h-4 bg-gray-400"></div>
                  <div className="text-xs text-gray-500 mb-1">R</div>
                  {renderTreeNode(node.right, level + 1)}
                </div>
              )}
            </div>
          )}
        </div>
      );
    };
    
    const tree = buildTree(data);
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">🌳 Tree Visualization</h3>
        
        {/* Tree Structure */}
        <div className="flex justify-center mb-4">
          {tree ? renderTreeNode(tree) : (
            <div className="text-center text-gray-500">No tree structure available</div>
          )}
        </div>
        
        {/* Node Values Display */}
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-3">
          <div className="text-sm font-semibold mb-1">📋 Node Values:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {data.map((node, index) => (
              <span key={index} className="inline-block mr-2">
                <span className="font-medium">[{index}]:</span> {node.value}
              </span>
            ))}
          </div>
        </div>
        
        {/* Traversal Information */}
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-3">
          <div className="text-sm font-semibold mb-1">📊 Traversal Information:</div>
          {traversal && traversal.length > 0 ? (
            <div className="text-sm">
              <span className="font-medium">Path: </span>
              <span className="text-blue-600 dark:text-blue-400">
                {traversal.map((step, index) => (
                  <span key={index}>
                    {step}
                    {index < traversal.length - 1 && ' → '}
                  </span>
                ))}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Click play to see traversal
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Highlighted</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGraphVisualization = (data, metadata) => {
    const { nodes, edges } = data;
    const { highlighted, visited, path } = metadata;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">🕸️ Graph Visualization</h3>
        
        {/* Node Values Display */}
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-3">
          <div className="text-sm font-semibold mb-1">📋 Node Values:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {nodes.map((node, index) => (
              <span key={index} className="inline-block mr-2">
                <span className="font-medium">[{index}]:</span> {node.value || node.id}
              </span>
            ))}
          </div>
        </div>
        
        <div className="relative flex flex-wrap justify-center gap-8 p-4">
          {/* Render edges */}
          {edges && edges.map((edge, index) => {
            const fromNode = nodes.find(n => n.id === edge.from || n.value === edge.from);
            const toNode = nodes.find(n => n.id === edge.to || n.value === edge.to);
            
            if (!fromNode || !toNode) return null;
            
            const fromIndex = nodes.indexOf(fromNode);
            const toIndex = nodes.indexOf(toNode);
            
            return (
              <svg
                key={`edge-${index}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <line
                  x1={`${25 + (fromIndex % 3) * 25}%`}
                  y1={`${25 + Math.floor(fromIndex / 3) * 25}%`}
                  x2={`${25 + (toIndex % 3) * 25}%`}
                  y2={`${25 + Math.floor(toIndex / 3) * 25}%`}
                  stroke="#6B7280"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                  </marker>
                </defs>
              </svg>
            );
          })}
          
          {/* Render nodes */}
          {nodes.map((node, index) => {
            let bgColor = 'bg-purple-500';
            if (highlighted?.includes(index)) bgColor = 'bg-yellow-500';
            else if (visited?.includes(index)) bgColor = 'bg-blue-500';
            else if (path?.includes(index)) bgColor = 'bg-green-500';
            
            return (
              <div
                key={index}
                className={`relative w-14 h-14 rounded-full flex flex-col items-center justify-center text-white font-bold transition-all duration-300 ${bgColor} border-2 border-white shadow-lg`}
                style={{ zIndex: 2 }}
              >
                <span className="text-sm">{node.value || node.id}</span>
                <span className="text-xs opacity-80">[{index}]</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLinkedListVisualization = (data, metadata) => {
    const { highlighted, current, connections } = metadata;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">🔗 Linked List Visualization</h3>
        
        {/* Node Values Display */}
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-3">
          <div className="text-sm font-semibold mb-1">📋 Node Values:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {data.map((node, index) => (
              <span key={index} className="inline-block mr-2">
                <span className="font-medium">[{index}]:</span> {node.value || node.id}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          {data.map((node, index) => {
            let bgColor = 'bg-blue-500';
            if (highlighted?.includes(index)) bgColor = 'bg-yellow-500';
            else if (current === index) bgColor = 'bg-green-500';
            
            return (
              <div key={index} className="flex items-center">
                <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-white font-bold text-sm transition-all duration-300 ${bgColor} border-2 border-white shadow-lg`}>
                  <span>{node.value || node.id}</span>
                  <span className="text-xs opacity-80">[{index}]</span>
                </div>
                {index < data.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-400 mx-2 relative">
                    <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMatrixVisualization = (data, metadata) => {
    const { highlighted, path, start, end } = metadata;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">📋 Matrix Visualization</h3>
        
        {/* Matrix Values Display */}
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-3">
          <div className="text-sm font-semibold mb-1">📊 Matrix Values:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="mb-1">
                <span className="font-medium">Row {rowIndex}:</span> [{row.join(', ')}]
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((cell, colIndex) => {
                const index = rowIndex * row.length + colIndex;
                let bgColor = 'bg-gray-300 dark:bg-gray-600';
                
                if (highlighted?.includes(index)) bgColor = 'bg-yellow-400 dark:bg-yellow-500';
                else if (path?.includes(index)) bgColor = 'bg-green-400 dark:bg-green-500';
                else if (start && start.row === rowIndex && start.col === colIndex) bgColor = 'bg-blue-400 dark:bg-blue-500';
                else if (end && end.row === rowIndex && end.col === colIndex) bgColor = 'bg-red-400 dark:bg-red-500';
                
                return (
                  <div
                    key={colIndex}
                    className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm transition-all duration-300 ${bgColor} border border-white`}
                  >
                    {cell}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVariablesVisualization = (data, metadata) => {
    const { step, operation } = metadata;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">📝 Variables Visualization</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{key}</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {typeof value === 'object' ? JSON.stringify(value) : value}
              </div>
            </div>
          ))}
        </div>
        {operation && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Operation: {operation}
          </div>
        )}
      </div>
    );
  };

  const renderVisualization = () => {
    if (!currentAnimation || !currentAnimation.data) {
      return (
        <div className="mb-4">
          <div className="text-center text-gray-500">No visualization data available</div>
        </div>
      );
    }
    
    const extracted = extractVisualizationData(currentAnimation.data);
    
    if (!extracted || !extracted.data) {
      // Fallback: Try to create a basic visualization from the raw data
      console.log('Extraction failed, trying fallback visualization');
      
      const fallbackData = currentAnimation.data;
      if (typeof fallbackData === 'object' && fallbackData !== null) {
        return (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">📊 Data Visualization (Fallback)</h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm font-semibold mb-2">Raw Data Structure:</div>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(fallbackData, null, 2)}
              </pre>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Unable to create specific visualization. Showing raw data structure.
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="mb-4">
          <div className="text-center text-gray-500">Unable to extract visualization data</div>
        </div>
      );
    }
    
    // Use D3 visualization if enabled and supported
    if (useD3 && ['tree', 'graph', 'array', 'linked_list'].includes(extracted.type)) {
      return (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">🎨 Advanced Visualization (D3.js)</h3>
          <D3Visualizer 
            data={currentAnimation.data} 
            type={extracted.type} 
            currentStep={currentStep}
          />
        </div>
      );
    }
    
    // Use simple visualization
    switch (extracted.type) {
      case 'array':
        return renderArrayVisualization(extracted.data, extracted.metadata);
      case 'tree':
        return renderTreeVisualization(extracted.data, extracted.metadata);
      case 'graph':
        return renderGraphVisualization(extracted.data, extracted.metadata);
      case 'linked_list':
        return renderLinkedListVisualization(extracted.data, extracted.metadata);
      case 'matrix':
        return renderMatrixVisualization(extracted.data, extracted.metadata);
      case 'variables':
        return renderVariablesVisualization(extracted.data, extracted.metadata);
      default:
        return (
          <div className="mb-4">
            <div className="text-center text-gray-500">Unknown visualization type: {extracted.type}</div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Data: {JSON.stringify(extracted.data).substring(0, 100)}...
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🎬 Algorithm Visualizer</h2>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      {/* Algorithm Type */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider">
          {algorithmType?.replace('_', ' ') || 'Unknown Algorithm'}
        </span>
      </div>

      {/* Current Step Description */}
      <div className="mb-4 p-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
        <div className="font-semibold mb-1">Step {currentStep + 1}: {currentAnimation?.action || 'execute'}</div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{currentAnimation?.description || 'Processing...'}</div>
      </div>

      {/* Visualization Type Toggle */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useD3}
            onChange={(e) => setUseD3(e.target.checked)}
            className="rounded"
          />
          🎨 Use Advanced D3 Visualization
        </label>
      </div>

      {/* Visualization */}
      {renderVisualization()}

      {/* Controls */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={handleStepBackward}
            disabled={currentStep === 0}
            className="px-3 py-1 rounded bg-zinc-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-zinc-700 transition-colors"
            title="Previous step"
          >
            ⏪
          </button>
          
          {isPlaying ? (
            <button
              onClick={handlePause}
              className="px-4 py-2 rounded bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              ⏸️ Pause
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={currentStep >= totalSteps - 1}
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              ▶️ Play
            </button>
          )}
          
          <button
            onClick={handleStepForward}
            disabled={currentStep >= totalSteps - 1}
            className="px-3 py-1 rounded bg-zinc-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-zinc-700 transition-colors"
            title="Next step"
          >
            ⏩
          </button>
          
          <button
            onClick={handleReset}
            className="px-3 py-1 rounded bg-zinc-600 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors"
            title="Reset to beginning"
          >
            🔄 Reset
          </button>
        </div>
        
        {/* Speed Control */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Speed:</span>
          <input
            type="range"
            min="100"
            max="3000"
            step="100"
            value={speed}
            onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{speed}ms</span>
        </div>
        
        {/* Display Options */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPointers}
              onChange={(e) => setShowPointers(e.target.checked)}
              className="rounded"
            />
            Show Pointers
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showComparisons}
              onChange={(e) => setShowComparisons(e.target.checked)}
              className="rounded"
            />
            Show Comparisons
          </label>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
} 