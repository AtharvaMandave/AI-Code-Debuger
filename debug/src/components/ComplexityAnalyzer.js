import React, { useState } from 'react';

export default function ComplexityAnalyzer({ complexityData }) {
  const [copied, setCopied] = useState(false);

  if (!complexityData) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white">
        <h2 className="text-xl font-bold mb-4">🧮 Complexity Analyzer</h2>
        <p className="text-zinc-600 dark:text-zinc-400">No complexity analysis available.</p>
      </div>
    );
  }

  const { timeComplexity, spaceComplexity, explanation, optimizationSuggestions, improvedCode, improvementExplanation } = complexityData;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatCode = (code) => {
    if (!code) return '';
    
    // Clean up the code if it's wrapped in markdown code blocks
    let cleanedCode = code;
    if (code.includes('```')) {
      const codeBlockMatch = code.match(/```(?:[\w-]+)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanedCode = codeBlockMatch[1].trim();
      }
    }
    
    return cleanedCode;
  };

  const detectLanguage = (code) => {
    if (!code) return 'javascript';
    
    const firstLine = code.split('\n')[0].toLowerCase();
    if (firstLine.includes('import java') || firstLine.includes('public class') || firstLine.includes('class ')) return 'java';
    if (firstLine.includes('def ') || firstLine.includes('import ') && firstLine.includes('numpy')) return 'python';
    if (firstLine.includes('#include') || firstLine.includes('using namespace')) return 'cpp';
    if (firstLine.includes('function ') || firstLine.includes('const ') || firstLine.includes('let ') || firstLine.includes('var ')) return 'javascript';
    return 'javascript';
  };

  const language = detectLanguage(improvedCode);

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl shadow w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white">
      <h2 className="text-xl font-bold mb-4">🧮 Complexity Analyzer</h2>

      {/* Time Complexity */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">⏱️</span>
          <h3 className="font-semibold text-lg">Time Complexity</h3>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-mono text-lg">
          {timeComplexity || 'O(n)'}
        </div>
      </div>

      {/* Space Complexity */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">💾</span>
          <h3 className="font-semibold text-lg">Space Complexity</h3>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-lg font-mono text-lg">
          {spaceComplexity || 'O(1)'}
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📝</span>
            <h3 className="font-semibold">Explanation</h3>
          </div>
          <div className="bg-zinc-200 dark:bg-zinc-700 p-3 rounded-lg text-sm">
            {explanation}
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {optimizationSuggestions && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <h3 className="font-semibold">Optimization Suggestions</h3>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
            <ul className="list-disc list-inside text-sm space-y-1">
              {Array.isArray(optimizationSuggestions) 
                ? optimizationSuggestions.map((suggestion, index) => (
                    <li key={index} className="text-zinc-700 dark:text-zinc-300">{suggestion}</li>
                  ))
                : <li className="text-zinc-700 dark:text-zinc-300">{optimizationSuggestions}</li>
              }
            </ul>
          </div>
        </div>
      )}

      {/* Improved Code */}
      {improvedCode && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚀</span>
              <h3 className="font-semibold">Improved Code</h3>
            </div>
            <button
              onClick={() => copyToClipboard(formatCode(improvedCode))}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <span>✅</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          
          <div className="relative">
            <div className="bg-zinc-900 dark:bg-black rounded-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
              {/* Language Badge */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-600">
                <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                  {language}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>
              
              {/* Code Content */}
              <div className="p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
                <pre className="text-sm text-zinc-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
                  <code>{formatCode(improvedCode)}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Explanation */}
      {improvementExplanation && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔍</span>
            <h3 className="font-semibold">Improvement Explanation</h3>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {improvementExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold">Complexity Summary</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Time:</span>
            <span className="ml-2 font-mono text-purple-600 dark:text-purple-400">{timeComplexity || 'O(n)'}</span>
          </div>
          <div>
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Space:</span>
            <span className="ml-2 font-mono text-green-600 dark:text-green-400">{spaceComplexity || 'O(1)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 