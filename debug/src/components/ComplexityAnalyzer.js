import React from 'react';

export default function ComplexityAnalyzer({ analysis, loading, error, onClose }) {
  if (loading) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 mt-4">
        <span className="font-semibold">Analyzing complexity...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 p-4 rounded-xl shadow w-full max-w-2xl border border-red-300 dark:border-red-700 text-red-800 dark:text-red-100 mt-4">
        <span className="font-semibold">{error}</span>
        {onClose && (
          <button className="ml-4 px-2 py-1 bg-red-600 text-white rounded" onClick={onClose}>Close</button>
        )}
      </div>
    );
  }
  if (!analysis) return null;

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">🧮 Complexity Analysis</h2>
        {onClose && (
          <button className="px-2 py-1 bg-zinc-600 text-white rounded text-xs" onClick={onClose}>Close</button>
        )}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Time Complexity:</span> <span className="text-blue-700 dark:text-blue-300">{analysis.timeComplexity}</span>
      </div>
      <div className="mb-2">
        <span className="font-semibold">Space Complexity:</span> <span className="text-purple-700 dark:text-purple-300">{analysis.spaceComplexity}</span>
      </div>
      <div className="mb-2">
        <span className="font-semibold">Explanation:</span>
        <div className="text-zinc-700 dark:text-zinc-300 mt-1">{analysis.explanation}</div>
      </div>
      {analysis.optimizationSuggestions && analysis.optimizationSuggestions.length > 0 && (
        <div className="mb-2">
          <span className="font-semibold">Optimization Suggestions:</span>
          <ul className="list-disc ml-6 mt-1">
            {analysis.optimizationSuggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {/* Improved code and explanation */}
      {analysis.improvedCode && analysis.improvedCode.trim() && (
        <div className="mb-2 mt-4">
          <span className="font-semibold">Improved Code:</span>
          <pre className="bg-zinc-900 text-white rounded p-3 mt-2 text-sm overflow-x-auto border border-zinc-700">
            {analysis.improvedCode}
          </pre>
          {analysis.improvementExplanation && (
            <div className="mt-2 text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold">Why this is better:</span> {analysis.improvementExplanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 