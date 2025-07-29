import React, { useEffect } from 'react';

export default function StepDebugger({ debugSteps, currentStepIndex, onStepChange }) {
  if (!debugSteps || !debugSteps.steps || debugSteps.steps.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-xl shadow-lg w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white">
            📋
          </div>
          <h2 className="text-xl font-bold">🔍 Step Debugger</h2>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-zinc-600 dark:text-zinc-400">No debug steps available. Click "Step Debugger" to analyze your code step-by-step.</p>
        </div>
      </div>
    );
  }

  const currentStep = debugSteps.steps[currentStepIndex];
  const totalSteps = debugSteps.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      switch (event.key) {
        case 'ArrowLeft':
          if (!isFirstStep) {
            event.preventDefault();
            onStepChange(currentStepIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (!isLastStep) {
            event.preventDefault();
            onStepChange(currentStepIndex + 1);
          }
          break;
        case 'Home':
          event.preventDefault();
          onStepChange(0);
          break;
        case 'End':
          event.preventDefault();
          onStepChange(totalSteps - 1);
          break;
        case ' ':
          event.preventDefault();
          // Auto-play functionality could be added here
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStepIndex, totalSteps, isFirstStep, isLastStep, onStepChange]);

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handleFirst = () => {
    onStepChange(0);
  };

  const handleLast = () => {
    onStepChange(totalSteps - 1);
  };

  return (
    <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-xl shadow-lg w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white">
            📋
          </div>
          <h2 className="text-xl font-bold">�� Step Debugger</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          ⌨️
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
        </div>
      </div>

      {/* Algorithm Type */}
      {debugSteps.algorithmType && (
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider">
            {debugSteps.algorithmType.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Step Description */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
            {currentStepIndex + 1}
          </div>
          <div className="font-semibold">{currentStep.stepType || 'execute'}</div>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300 ml-8">{currentStep.description}</div>
        {currentStep.lineNumber && (
          <div className="text-xs text-zinc-500 mt-2 ml-8">Line {currentStep.lineNumber}</div>
        )}
      </div>

      {/* Bounds Check Warning */}
      {currentStep.boundsCheck && !currentStep.boundsCheck.isValid && (
        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <div className="flex items-center mb-2">
            ⚠️
            <span className="text-red-600 dark:text-red-400 font-semibold ml-2">⚠️ Bounds Issue Detected</span>
          </div>
          <div className="text-sm text-red-700 dark:text-red-300 mb-2">
            <strong>Issue:</strong> {currentStep.boundsCheck.issue}
          </div>
          {currentStep.boundsCheck.suggestion && (
            <div className="text-sm text-red-600 dark:text-red-400">
              <strong>Suggestion:</strong> {currentStep.boundsCheck.suggestion}
            </div>
          )}
        </div>
      )}

      {/* Bounds Check Success */}
      {currentStep.boundsCheck && currentStep.boundsCheck.isValid && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-300 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            ✅
            <span className="text-green-600 dark:text-green-400 font-semibold ml-2">✅ Bounds Check Passed</span>
          </div>
        </div>
      )}

      {/* Variables Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            📋
          </div>
          <h3 className="font-semibold">Variables:</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(currentStep.variables || {}).map(([varName, varValue]) => (
            <div key={varName} className="flex items-center justify-between p-3 bg-gradient-to-r from-zinc-50 to-gray-50 dark:from-zinc-800 dark:to-gray-800 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-all duration-200 hover:scale-105">
              <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">{varName}:</span>
              <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {Array.isArray(varValue) 
                  ? `[${varValue.join(', ')}]` 
                  : typeof varValue === 'object' 
                    ? JSON.stringify(varValue) 
                    : String(varValue)
                }
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={handleFirst}
            disabled={isFirstStep}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-zinc-700 transition-all duration-200 hover:scale-105"
            title="Go to first step (Home)"
          >
            ⏮️ First
          </button>
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-700 text-white font-semibold disabled:opacity-50 text-sm hover:bg-zinc-800 transition-all duration-200 hover:scale-105"
            title="Previous step (←)"
          >
            ⏪ Previous
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleNext}
            disabled={isLastStep}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            title="Next step (→)"
          >
            Next ⏩
          </button>
          <button
            onClick={handleLast}
            disabled={isLastStep}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            title="Go to last step (End)"
          >
            Last ⏭️
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-zinc-300 dark:bg-zinc-600 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-1">
          <span>Step {currentStepIndex + 1}</span>
          <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete</span>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-gradient-to-r from-zinc-50 to-gray-50 dark:from-zinc-800 dark:to-gray-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 mb-2">
          ⌨️
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Keyboard Shortcuts:</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <div>← Previous</div>
          <div>→ Next</div>
          <div>Home First</div>
          <div>End Last</div>
        </div>
      </div>
    </div>
  );
} 