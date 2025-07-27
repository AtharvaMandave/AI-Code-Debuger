import React from 'react';

export default function StepDebugger({ debugSteps, currentStepIndex, onStepChange }) {
  if (!debugSteps || !debugSteps.steps || debugSteps.steps.length === 0) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100">
        <h2 className="text-xl font-bold mb-4">🔍 Step Debugger</h2>
        <p className="text-zinc-600 dark:text-zinc-400">No debug steps available. Click "Step Debugger" to analyze your code step-by-step.</p>
      </div>
    );
  }

  const currentStep = debugSteps.steps[currentStepIndex];
  const totalSteps = debugSteps.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

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
    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🔍 Step Debugger</h2>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Step {currentStepIndex + 1} of {totalSteps}
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
      <div className="mb-4 p-3 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
        <div className="font-semibold mb-1">Step {currentStepIndex + 1}: {currentStep.stepType || 'execute'}</div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{currentStep.description}</div>
        {currentStep.lineNumber && (
          <div className="text-xs text-zinc-500 mt-1">Line {currentStep.lineNumber}</div>
        )}
      </div>

      {/* Bounds Check Warning */}
      {currentStep.boundsCheck && !currentStep.boundsCheck.isValid && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-red-600 dark:text-red-400 font-semibold mr-2">⚠️ Bounds Issue Detected</span>
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
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 dark:text-green-400 font-semibold mr-2">✅ Bounds Check Passed</span>
          </div>
        </div>
      )}

      {/* Variables Display */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Variables:</h3>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(currentStep.variables || {}).map(([varName, varValue]) => (
            <div key={varName} className="flex items-center justify-between p-2 bg-zinc-200 dark:bg-zinc-700 rounded">
              <span className="font-mono text-sm font-semibold">{varName}:</span>
              <span className="font-mono text-sm">
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
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleFirst}
            disabled={isFirstStep}
            className="px-3 py-1 rounded bg-zinc-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-zinc-700 transition-colors"
            title="Go to first step"
          >
            ⏮️ First
          </button>
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="px-3 py-1 rounded bg-zinc-700 text-white font-semibold disabled:opacity-50 text-sm hover:bg-zinc-800 transition-colors"
            title="Previous step"
          >
            ⏪ Previous
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleNext}
            disabled={isLastStep}
            className="px-3 py-1 rounded bg-blue-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-blue-700 transition-colors"
            title="Next step"
          >
            Next ⏩
          </button>
          <button
            onClick={handleLast}
            disabled={isLastStep}
            className="px-3 py-1 rounded bg-blue-600 text-white font-semibold disabled:opacity-50 text-sm hover:bg-blue-700 transition-colors"
            title="Go to last step"
          >
            Last ⏭️
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-zinc-300 dark:bg-zinc-600 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 