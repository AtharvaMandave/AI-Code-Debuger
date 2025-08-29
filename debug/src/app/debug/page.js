'use client';
import React, { useState, useContext, useRef, useEffect } from 'react';
import CodeEditor from '../../components/CodeEditor';
import Explanation from '../../components/Explanation';
import StepDebugger from '../../components/StepDebugger';
import AlgorithmVisualizer from '../../components/AlgorithmVisualizer';
import Link from 'next/link';
import { useTheme } from '../../components/ThemeContext';
import { useUser, SignInButton } from '@clerk/nextjs';

import { GoogleGenerativeAI } from "@google/generative-ai";
import CodeStructureVisualizer from '../../components/CodeStructureVisualizer';
import ComplexityAnalyzer from '../../components/ComplexityAnalyzer';

export default function DebugPage() {
  const { dark, setDark } = useTheme();
  const { isSignedIn } = useUser();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });
  const [view, setView] = useState('debug');
  const [highlightedLines, setHighlightedLines] = useState([]);
  const [complexity, setComplexity] = useState('beginner');
  const [structureTimeline, setStructureTimeline] = useState(null);
  const [resourceSuggestions, setResourceSuggestions] = useState(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState(null);
  const [instrumentedCode, setInstrumentedCode] = useState('');
  const [visualStructures, setVisualStructures] = useState(null);
  const [visualizeLoading, setVisualizeLoading] = useState(false);
  const [visualizeError, setVisualizeError] = useState(null);
  const [visualStep, setVisualStep] = useState(0);
  const [rightTab, setRightTab] = useState('debug');
  const [debugSteps, setDebugSteps] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showStepDebugger, setShowStepDebugger] = useState(false);
  const [algorithmVisualization, setAlgorithmVisualization] = useState(null);
  const [algorithmLoading, setAlgorithmLoading] = useState(false);
  const [algorithmError, setAlgorithmError] = useState(null);
  const [showAlgorithmVisualizer, setShowAlgorithmVisualizer] = useState(false);
  const [complexityAnalysis, setComplexityAnalysis] = useState(null);
  const [complexityLoading, setComplexityLoading] = useState(false);
  const [complexityError, setComplexityError] = useState(null);
  const [showComplexity, setShowComplexity] = useState(false);
  const [instrumentLoading, setInstrumentLoading] = useState(false);
  const [instrumentError, setInstrumentError] = useState(null);
  const [showInstrumented, setShowInstrumented] = useState(false);
  const [convertedCode, setConvertedCode] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState(null);
  const [showConverted, setShowConverted] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('python');

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="relative p-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
            🤖
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Sign in to Access AI Debugger
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
            Unlock the full power of AI-powered code analysis, debugging, and visualization.
          </p>
          <SignInButton>
            <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
              Get Started
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  const handleAnalyze = async (e, customLevel) => {
    e && e.preventDefault();
    setLoading(true);
    setError(null);
    setAiResponse(null);
    setStructureTimeline(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, level: customLevel || complexity }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Unknown error', 'error');
        throw new Error(err.error || 'Unknown error');
      }
      const data = await res.json();
      setAiResponse(data);
      const structRes = await fetch('/api/structure-visualizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (structRes.ok) {
        const structData = await structRes.json();
        if (structData.timeline && structData.timeline.length > 0) {
          setStructureTimeline(structData.timeline);
        }
      }
      showToast('Analysis complete!', 'success');
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestResources = async () => {
    setResourceLoading(true);
    setResourceError(null);
    setResourceSuggestions(null);
    try {
      const res = await fetch('/api/suggest-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: code }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'Gemini API key not configured') {
          setResourceError('API key not configured. Please set up your Gemini API key to use this feature.');
        } else {
          setResourceError(err.error || 'Unknown error');
        }
        return;
      }
      const data = await res.json();
      setResourceSuggestions(data);
    } catch (err) {
      setResourceError(err.message);
    } finally {
      setResourceLoading(false);
    }
  };

  const handleVisualize = async () => {
    setVisualizeLoading(true);
    setVisualizeError(null);
    setVisualStructures(null);
    setVisualStep(0);
    try {
      const res = await fetch('/api/visualize-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json();
        setVisualizeError(err.error || 'Unknown error');
        return;
      }
      const data = await res.json();
      setVisualStructures(data.structures);
    } catch (err) {
      setVisualizeError(err.message);
    } finally {
      setVisualizeLoading(false);
    }
  };

  const handleNext = () => {
    if (visualStructures && visualStep < visualStructures.length - 1) {
      setVisualStep(visualStep + 1);
    }
  };

  const handlePrev = () => {
    if (visualStructures && visualStep > 0) {
      setVisualStep(visualStep - 1);
    }
  };

  const handleStop = () => {
    setVisualStructures(null);
    setVisualStep(0);
  };

  const handleStepDebug = async () => {
    setDebugLoading(true);
    setDebugError(null);
    setDebugSteps(null);
    setCurrentStepIndex(0);
    setShowStepDebugger(true);
    
    try {
      const res = await fetch('/api/debug-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setDebugError(err.error || 'Unknown error');
        showToast(err.error || 'Unknown error', 'error');
        return;
      }
      
      const data = await res.json();
      
      if (!data || !Array.isArray(data.steps)) {
        setDebugError('Invalid debug steps response structure');
        showToast('Invalid debug steps response', 'error');
        return;
      }
      
      setDebugSteps(data);
      showToast(`Step debugging ready! Found ${data.steps.length} steps.`, 'success');
    } catch (err) {
      setDebugError(err.message);
      showToast(err.message, 'error');
    } finally {
      setDebugLoading(false);
    }
  };

  const handleStepChange = (newStepIndex) => {
    setCurrentStepIndex(newStepIndex);
    
    if (debugSteps && debugSteps.steps[newStepIndex] && debugSteps.steps[newStepIndex].highlightedLines) {
      setHighlightedLines(debugSteps.steps[newStepIndex].highlightedLines);
    } else {
      setHighlightedLines([]);
    }
  };

  const handleStepDebugToggle = () => {
    if (showStepDebugger) {
      setShowStepDebugger(false);
      setDebugSteps(null);
      setCurrentStepIndex(0);
      setHighlightedLines([]);
    } else {
      handleStepDebug();
    }
  };

  const handleAlgorithmVisualize = async () => {
    setAlgorithmLoading(true);
    setAlgorithmError(null);
    setAlgorithmVisualization(null);
    setShowAlgorithmVisualizer(true);
    
    try {
      const res = await fetch('/api/algorithm-visualizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        setAlgorithmError(err.error || 'Unknown error');
        showToast(err.error || 'Unknown error', 'error');
        return;
      }
      
      const data = await res.json();
      
      if (!data || !Array.isArray(data.animationSteps)) {
        setAlgorithmError('Invalid algorithm visualization data');
        showToast('Invalid algorithm visualization data', 'error');
        return;
      }
      
      setAlgorithmVisualization(data);
      showToast(`Algorithm visualization ready! Found ${data.animationSteps.length} steps.`, 'success');
    } catch (err) {
      setAlgorithmError(err.message);
      showToast(err.message, 'error');
    } finally {
      setAlgorithmLoading(false);
    }
  };

  const handleAlgorithmVisualizerToggle = () => {
    if (showAlgorithmVisualizer) {
      setShowAlgorithmVisualizer(false);
      setAlgorithmVisualization(null);
    } else {
      handleAlgorithmVisualize();
    }
  };

  const handleComplexityAnalyze = async () => {
    setComplexityLoading(true);
    setComplexityError(null);
    setComplexityAnalysis(null);
    setShowComplexity(true);
    try {
      const res = await fetch('/api/complexity-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        setComplexityError(err.error || 'Unknown error');
        return;
      }
      const data = await res.json();
      setComplexityAnalysis(data);
    } catch (err) {
      setComplexityError(err.message);
    } finally {
      setComplexityLoading(false);
    }
  };

  const handleApplyFix = async (suggestedFix) => {
    try {
      // Extract actual code fix from the suggested fix text
      let actualFix = suggestedFix;
      
      // Try to extract code from markdown code blocks
      const codeBlockMatch = suggestedFix.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        actualFix = codeBlockMatch[1].trim();
      } else {
        // Try to extract code from inline code blocks
        const inlineCodeMatch = suggestedFix.match(/`([^`]+)`/g);
        if (inlineCodeMatch && inlineCodeMatch.length > 0) {
          // Take the first code snippet found
          actualFix = inlineCodeMatch[0].replace(/`/g, '');
        } else {
          // Look for common code patterns in the explanation
          const codePatterns = [
            /print\(['"][^'"]*['"]\)/g,  // print("something")
            /console\.log\(['"][^'"]*['"]\)/g,  // console.log("something")
            /System\.out\.println\(['"][^'"]*['"]\)/g,  // System.out.println("something")
            /printf\(['"][^'"]*['"]\)/g,  // printf("something")
            /cout\s*<<\s*['"][^'"]*['"]/g,  // cout << "something"
            /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*['"][^'"]*['"]/g,  // variable = "value"
            /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[0-9]+/g,  // variable = 123
            /function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*{[^}]*}/g,  // function definition
            /def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:/g,  // Python function
            /public\s+static\s+void\s+main\s*\([^)]*\)\s*{[^}]*}/g,  // Java main method
          ];
          
          for (const pattern of codePatterns) {
            const matches = suggestedFix.match(pattern);
            if (matches && matches.length > 0) {
              actualFix = matches[0];
              break;
            }
          }
        }
      }
      
      // If we still have the original text, try to extract the most likely code fix
      if (actualFix === suggestedFix) {
        // Look for the most specific code suggestion in the text
        const lines = suggestedFix.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.includes('print(') || 
              trimmedLine.includes('console.log(') ||
              trimmedLine.includes('System.out.println(') ||
              trimmedLine.includes('printf(') ||
              trimmedLine.includes('cout') ||
              trimmedLine.includes('=') ||
              trimmedLine.includes('function') ||
              trimmedLine.includes('def ') ||
              trimmedLine.includes('public static void main')) {
            actualFix = trimmedLine;
            break;
          }
        }
      }
      
      // Apply surgical fix - only replace the problematic parts
      const currentCode = code;
      let fixedCode = currentCode;
      
      // Common surgical fixes
      if (actualFix.includes('print(') && currentCode.includes('print(')) {
        // Fix print statements
        const printRegex = /print\([^)]*\)/g;
        if (printRegex.test(currentCode)) {
          fixedCode = currentCode.replace(printRegex, actualFix);
        }
      } else if (actualFix.includes('console.log(') && currentCode.includes('console.log(')) {
        // Fix console.log statements
        const consoleRegex = /console\.log\([^)]*\)/g;
        if (consoleRegex.test(currentCode)) {
          fixedCode = currentCode.replace(consoleRegex, actualFix);
        }
      } else if (actualFix.includes('=') && currentCode.includes('=')) {
        // Fix variable assignments
        const assignmentRegex = /[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^;\n]*/g;
        if (assignmentRegex.test(currentCode)) {
          // Find the specific variable being assigned
          const varMatch = actualFix.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
          if (varMatch) {
            const varName = varMatch[1];
            const specificAssignmentRegex = new RegExp(`${varName}\\s*=\\s*[^;\\n]*`, 'g');
            fixedCode = currentCode.replace(specificAssignmentRegex, actualFix);
          }
        }
      } else if (actualFix.includes('function') && currentCode.includes('function')) {
        // Fix function definitions
        const functionRegex = /function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*{[^}]*}/g;
        if (functionRegex.test(currentCode)) {
          fixedCode = currentCode.replace(functionRegex, actualFix);
        }
      } else if (actualFix.includes('def ') && currentCode.includes('def ')) {
        // Fix Python function definitions
        const defRegex = /def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:/g;
        if (defRegex.test(currentCode)) {
          fixedCode = currentCode.replace(defRegex, actualFix);
        }
      } else {
        // If no specific pattern matches, try to find and replace the problematic line
        const lines = currentCode.split('\n');
        const fixedLines = lines.map(line => {
          // Check if this line contains the problematic pattern
          if (line.includes('print(') && actualFix.includes('print(')) {
            return actualFix;
          } else if (line.includes('console.log(') && actualFix.includes('console.log(')) {
            return actualFix;
          } else if (line.includes('=') && actualFix.includes('=')) {
            // Check if it's the same variable assignment
            const lineVarMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            const fixVarMatch = actualFix.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            if (lineVarMatch && fixVarMatch && lineVarMatch[1] === fixVarMatch[1]) {
              return actualFix;
            }
          }
          return line;
        });
        fixedCode = fixedLines.join('\n');
      }
      
      // Apply the surgical fix
      setCode(fixedCode);
      showToast('✅ Fix applied successfully!', 'success');
      
      // Optionally re-analyze the code to show the fixed version
      setTimeout(() => {
        handleAnalyze(null);
      }, 1000);
    } catch (error) {
      console.error('Failed to apply fix:', error);
      showToast('❌ Failed to apply fix. Please try again.', 'error');
    }
  };

  const handleInstrumentCode = async () => {
    setInstrumentLoading(true);
    setInstrumentError(null);
    setShowInstrumented(true);
    try {
      const res = await fetch('/api/instrument-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        setInstrumentError(err.error || 'Unknown error');
        return;
      }
      const data = await res.json();
      setInstrumentedCode(data.instrumentedCode);
      showToast('✅ Code instrumented successfully!', 'success');
    } catch (err) {
      setInstrumentError(err.message);
      showToast('❌ Failed to instrument code. Please try again.', 'error');
    } finally {
      setInstrumentLoading(false);
    }
  };

  const handleConvertCode = async () => {
    setConvertLoading(true);
    setConvertError(null);
    setShowConverted(true);
    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_code: code, 
          source_language: language, 
          target_language: targetLanguage 
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setConvertError(err.error || 'Unknown error');
        return;
      }
      const data = await res.json();
      setConvertedCode(data.translated_code);
      showToast(`✅ Code converted to ${targetLanguage}!`, 'success');
    } catch (err) {
      setConvertError(err.message);
      showToast('❌ Failed to convert code. Please try again.', 'error');
    } finally {
      setConvertLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-700">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-2xl shadow-2xl text-white font-semibold transition-all duration-300 animate-fade-in flex items-center gap-3 backdrop-blur-xl ${
          toast.type === 'error' 
            ? 'bg-red-500/90 border border-red-400/50' 
            : 'bg-green-600/90 border border-green-400/50'
        }`}
          onClick={() => setToast({ message: '', type: 'success' })}
          role="alert"
          style={{ cursor: 'pointer' }}
        >
          {toast.type === 'error' ? '🐛' : '💡'}
          {toast.message}
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            AI-Powered Code Analysis
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Debug smarter with AI assistance, interactive visualizations, and intelligent insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Code Editor and Controls */}
          <section className="space-y-6">
            {/* Complexity Level Selector */}
            <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Complexity Level:
                </label>
                <select
                  value={complexity}
                  onChange={e => setComplexity(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                  disabled={loading}
                >
                  <option value="beginner">🐣 Beginner (ELI5)</option>
                  <option value="intermediate">🧑‍💻 Intermediate</option>
                  <option value="expert">👨‍🚀 Expert</option>
                </select>
                {aiResponse && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    onClick={() => handleAnalyze(null)}
                    disabled={loading}
                    title="Regenerate explanation with selected level"
                  >
                    🔄 Regenerate
                  </button>
                )}
              </div>
            </div>

            {/* Code Editor */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
              <CodeEditor
                value={code}
                language={language}
                onChange={setCode}
                onLanguageChange={setLanguage}
                onSubmit={handleAnalyze}
                loading={loading}
                highlightLines={highlightedLines}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleComplexityAnalyze}
                disabled={complexityLoading || !code.trim()}
              >
                {complexityLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="spinner"></div>
                    <span>Analyzing Complexity...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>📊</span>
                    <span>{showComplexity ? 'Re-analyze Complexity' : 'Complexity Analyzer'}</span>
                  </div>
                )}
              </button>

              <button
                type="button"
                className="p-4 rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white font-bold shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAnalyze}
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="spinner"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span>🤖</span>
                    <span>Analyze Code</span>
                  </div>
                )}
              </button>
            </div>

            {/* Additional Tools */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                className="p-3 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleInstrumentCode}
                disabled={instrumentLoading || !code.trim()}
              >
                {instrumentLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Instrumenting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>🔧</span>
                    <span className="text-sm">Instrument Code</span>
                  </div>
                )}
              </button>

              <div className="flex gap-2">
                <select
                  value={targetLanguage}
                  onChange={e => setTargetLanguage(e.target.value)}
                  className="flex-1 px-3 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 text-sm"
                  disabled={convertLoading}
                >
                  <option value="python">🐍 Python</option>
                  <option value="javascript">🟨 JavaScript</option>
                  <option value="java">☕ Java</option>
                  <option value="cpp">⚙️ C++</option>
                  <option value="csharp">💎 C#</option>
                  <option value="go">🐹 Go</option>
                  <option value="rust">🦀 Rust</option>
                </select>
                <button
                  type="button"
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConvertCode}
                  disabled={convertLoading || !code.trim()}
                >
                  {convertLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Converting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🔄</span>
                      <span className="text-sm">Convert</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Complexity Analyzer Display */}
            {showComplexity && (
              <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                <ComplexityAnalyzer complexityData={complexityAnalysis} />
              </div>
            )}

            {/* Instrumented Code Display */}
            {showInstrumented && (
              <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white">
                      🔧
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Instrumented Code</h3>
                  </div>
                  {instrumentError ? (
                    <div className="p-4 rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-700 dark:text-red-300 font-semibold">
                      🚨 {instrumentError}
                    </div>
                  ) : instrumentedCode ? (
                    <div className="bg-zinc-900 dark:bg-black rounded-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-600">
                        <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                          Instrumented Code
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        <pre className="text-sm text-zinc-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
                          <code>{instrumentedCode}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm">No instrumented code available.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Converted Code Display */}
            {showConverted && (
              <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white">
                      🔄
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Converted Code ({targetLanguage})</h3>
                  </div>
                  {convertError ? (
                    <div className="p-4 rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-700 dark:text-red-300 font-semibold">
                      🚨 {convertError}
                    </div>
                  ) : convertedCode ? (
                    <div className="bg-zinc-900 dark:bg-black rounded-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
                      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-600">
                        <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                          {targetLanguage.toUpperCase()} Code
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <div className="p-4 max-h-[400px] overflow-y-auto">
                        <pre className="text-sm text-zinc-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
                          <code>{convertedCode}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm">No converted code available.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-700 dark:text-red-300 font-semibold">
                🚨 {error}
              </div>
            )}
          </section>

          {/* Right: Analysis Results */}
          <section className="space-y-6">
            {/* Tab Navigation */}
            <nav className="flex gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow focus:outline-none ${
                  rightTab === 'debug' && !showStepDebugger && !showAlgorithmVisualizer
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white scale-105'
                    : 'text-slate-700 dark:text-slate-300 hover:scale-105 hover:bg-white/10'
                }`}
                onClick={() => setRightTab('debug')}
                disabled={rightTab === 'debug' && !showStepDebugger && !showAlgorithmVisualizer}
              >
                🤖 Debug
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow focus:outline-none ${
                  showStepDebugger
                    ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white scale-105'
                    : 'text-slate-700 dark:text-slate-300 hover:scale-105 hover:bg-white/10'
                }`}
                onClick={handleStepDebugToggle}
                disabled={debugLoading || !code.trim()}
              >
                📋 {debugLoading ? 'Debugging...' : showStepDebugger ? 'Close' : 'Step Debugger'}
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow focus:outline-none ${
                  showAlgorithmVisualizer
                    ? 'bg-gradient-to-r from-purple-500 via-blue-400 to-green-500 text-white scale-105'
                    : 'text-slate-700 dark:text-slate-300 hover:scale-105 hover:bg-white/10'
                }`}
                onClick={handleAlgorithmVisualizerToggle}
                disabled={algorithmLoading || !code.trim()}
              >
                🌳 {algorithmLoading ? 'Visualizing...' : showAlgorithmVisualizer ? 'Close' : 'Algorithm Visualizer'}
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow focus:outline-none ${
                  rightTab === 'resources'
                    ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-white scale-105'
                    : 'text-slate-700 dark:text-slate-300 hover:scale-105 hover:bg-white/10'
                }`}
                onClick={() => {
                  setRightTab('resources');
                  handleSuggestResources();
                }}
                disabled={resourceLoading || !code.trim()}
              >
                📚 Resources
              </button>
            </nav>

            {/* Tab Content */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-h-[600px]">
              {!showStepDebugger && !showAlgorithmVisualizer && rightTab === 'debug' && (
                <Explanation aiResponse={aiResponse} onApplyFix={handleApplyFix} />
              )}

              {!showStepDebugger && !showAlgorithmVisualizer && rightTab === 'visualize' && visualStructures && (
                <div className="p-6">
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={handlePrev}
                      className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-105"
                      disabled={visualStep === 0}
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-105"
                      disabled={visualStep === visualStructures.length - 1}
                    >
                      Next →
                    </button>
                    <button
                      onClick={handleStop}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold transition-all duration-300 hover:scale-105"
                    >
                      Stop
                    </button>
                  </div>
                  <CodeStructureVisualizer structures={[visualStructures[visualStep]]} />
                </div>
              )}

              {!showStepDebugger && !showAlgorithmVisualizer && rightTab === 'resources' && (
                <div className="p-6">
                  {resourceLoading ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white text-2xl">
                          📚
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Suggested Resources</h2>
                      </div>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                            <div className="space-y-2">
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : resourceSuggestions ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white text-2xl">
                          📚
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Suggested Resources</h2>
                      </div>
                      
                      {/* YouTube Suggestions */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white">
                            ▶️
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">YouTube Suggestions</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800">
                          {resourceSuggestions.youtube && resourceSuggestions.youtube.length > 0 ? (
                            <ol className="list-decimal ml-6 space-y-2">
                              {resourceSuggestions.youtube.map((yt, i) => (
                                <li key={i} className="text-sm">
                                  <a 
                                    href={yt.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 transition-colors"
                                  >
                                    {yt.title}
                                  </a>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-slate-600 dark:text-slate-400 text-sm">No YouTube suggestions available.</p>
                          )}
                        </div>
                      </div>

                      {/* Documentation & Help Links */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                            📘
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Documentation & Help Links</h3>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                          {resourceSuggestions.docs && resourceSuggestions.docs.length > 0 ? (
                            <ul className="list-disc ml-6 space-y-2">
                              {resourceSuggestions.docs.map((doc, i) => (
                                <li key={i} className="text-sm">
                                  <a 
                                    href={doc} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 transition-colors"
                                  >
                                    {doc}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-slate-600 dark:text-slate-400 text-sm">No documentation links available.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : resourceError ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white text-2xl">
                          📚
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Suggested Resources</h2>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-300 text-sm">{resourceError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white text-2xl">
                          📚
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Suggested Resources</h2>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Click "Resources" to get personalized learning suggestions for your code.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step Debugger Display */}
              {showStepDebugger && (
                <StepDebugger 
                  debugSteps={debugSteps}
                  currentStepIndex={currentStepIndex}
                  onStepChange={handleStepChange}
                />
              )}

              {/* Algorithm Visualizer Display */}
              {showAlgorithmVisualizer && (
                <AlgorithmVisualizer 
                  visualizationData={algorithmVisualization}
                />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 