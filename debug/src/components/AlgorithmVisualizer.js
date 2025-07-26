import React, { useState, useEffect, useRef } from 'react';

export default function AlgorithmVisualizer({ visualizationData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [showPointers, setShowPointers] = useState(true);
  const [showComparisons, setShowComparisons] = useState(true);
  const intervalRef = useRef(null);

  // Auto-play functionality - moved to top level
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

  // Render different visualization types
  const renderVisualization = () => {
    const { data } = currentAnimation;
    
    switch (visualizationType) {
      case 'sorting':
        return renderSortingVisualization(data);
      case 'linked_list':
        return renderLinkedListVisualization(data);
      case 'binary_tree':
        return renderBinaryTreeVisualization(data);
      case 'graph':
        return renderGraphVisualization(data);
      default:
        return renderSortingVisualization(data);
    }
  };

  const renderSortingVisualization = (data) => {
    const { array, highlighted, pointers } = data;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Array Visualization</h3>
        <div className="flex items-end justify-center gap-1 h-32">
          {array.map((value, index) => (
            <div
              key={index}
              className={`relative flex flex-col items-center transition-all duration-300 ${
                highlighted.includes(index) ? 'bg-yellow-400 dark:bg-yellow-500' : 'bg-blue-500 dark:bg-blue-600'
              } rounded-t-lg min-w-[40px]`}
              style={{ height: `${(value / Math.max(...array)) * 100}px` }}
            >
              <span className="text-xs text-white font-bold mt-1">{value}</span>
              {showPointers && pointers && (
                <span className="text-xs text-red-500 font-bold absolute -top-6">
                  {pointers.i === index ? 'i' : pointers.j === index ? 'j' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLinkedListVisualization = (data) => {
    const { nodes, connections, highlighted } = data;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Linked List Visualization</h3>
        <div className="flex items-center justify-center gap-4">
          {nodes?.map((node, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ${
                highlighted?.includes(index) ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {node.value}
              </div>
              {index < nodes.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-400 mx-2 relative">
                  <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-l-gray-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBinaryTreeVisualization = (data) => {
    const { nodes, highlighted } = data;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Binary Tree Visualization</h3>
        <div className="flex flex-col items-center">
          {nodes?.map((node, index) => (
            <div key={index} className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
              highlighted?.includes(index) ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
              {node.value}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGraphVisualization = (data) => {
    const { nodes, edges, highlighted } = data;
    
    return (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Graph Visualization</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {nodes?.map((node, index) => (
            <div key={index} className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
              highlighted?.includes(index) ? 'bg-yellow-500' : 'bg-purple-500'
            }`}>
              {node.value}
            </div>
          ))}
        </div>
      </div>
    );
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
            className="px-3 py-1 rounded bg-blue-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-blue-700 transition-colors"
            title="Next step"
          >
            ⏩
          </button>
          
          <button
            onClick={handleReset}
            className="px-3 py-1 rounded bg-gray-600 text-white font-semibold text-sm hover:bg-gray-700 transition-colors"
            title="Reset to beginning"
          >
            🔄 Reset
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center justify-center gap-4">
          <label className="text-sm font-semibold">Speed:</label>
          <input
            type="range"
            min="200"
            max="2000"
            step="200"
            value={speed}
            onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{speed}ms</span>
        </div>

        {/* Options */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPointers}
              onChange={(e) => setShowPointers(e.target.checked)}
              className="rounded"
            />
            Show Pointers
          </label>
          <label className="flex items-center gap-2 text-sm">
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
      <div className="mt-4">
        <div className="w-full bg-zinc-300 dark:bg-zinc-600 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 