'use client';
import React, { useState, useContext, useRef, useEffect } from 'react';
import CodeEditor from '../../components/CodeEditor';
import Explanation from '../../components/Explanation';
import StepDebugger from '../../components/StepDebugger';
import AlgorithmVisualizer from '../../components/AlgorithmVisualizer';
import Link from 'next/link';
import { ThemeContext } from '../../components/ClientLayout';
import { useUser, SignInButton } from '@clerk/nextjs';

import { GoogleGenerativeAI } from "@google/generative-ai";
import CodeStructureVisualizer from '../../components/CodeStructureVisualizer';
import ComplexityAnalyzer from '../../components/ComplexityAnalyzer';

export default function DebugPage() {
  const { dark, setDark } = useContext(ThemeContext);
  const { isSignedIn } = useUser();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });
  const [view, setView] = useState('debug'); // 'debug' or 'visualize'
  const [highlightedLines, setHighlightedLines] = useState([]); // <-- new state

  const [complexity, setComplexity] = useState('beginner'); // 'beginner', 'intermediate', 'expert'
  const [structureTimeline, setStructureTimeline] = useState(null);
  const [resourceSuggestions, setResourceSuggestions] = useState(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState(null);
  const [instrumentedCode, setInstrumentedCode] = useState('');
  const [visualStructures, setVisualStructures] = useState(null);
  const [visualizeLoading, setVisualizeLoading] = useState(false);
  const [visualizeError, setVisualizeError] = useState(null);
  const [visualStep, setVisualStep] = useState(0);
  const [rightTab, setRightTab] = useState('debug'); // 'debug', 'visualize', 'resources'

  // Step Debugger state
  const [debugSteps, setDebugSteps] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showStepDebugger, setShowStepDebugger] = useState(false);

  // Algorithm Visualizer state
  const [algorithmVisualization, setAlgorithmVisualization] = useState(null);
  const [algorithmLoading, setAlgorithmLoading] = useState(false);
  const [algorithmError, setAlgorithmError] = useState(null);
  const [showAlgorithmVisualizer, setShowAlgorithmVisualizer] = useState(false);

  // Complexity Analyzer state
  const [complexityAnalysis, setComplexityAnalysis] = useState(null);
  const [complexityLoading, setComplexityLoading] = useState(false);
  const [complexityError, setComplexityError] = useState(null);
  const [showComplexity, setShowComplexity] = useState(false);


  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-900">
        <div className="bg-zinc-100 dark:bg-zinc-800 p-8 rounded-xl shadow-lg flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to use the AI Debugger</h2>
          <SignInButton>
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-lg shadow hover:scale-105 transition-all duration-200">Sign In</button>
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
      // Structure visualizer call
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
        setResourceError(err.error || 'Unknown error');
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
      
      // Validate the response structure
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
    
    // Update highlighted lines if available
    if (debugSteps && debugSteps.steps[newStepIndex] && debugSteps.steps[newStepIndex].highlightedLines) {
      setHighlightedLines(debugSteps.steps[newStepIndex].highlightedLines);
    } else {
      setHighlightedLines([]);
    }
  };

  const handleStepDebugToggle = () => {
    if (showStepDebugger) {
      // Close step debugger
      setShowStepDebugger(false);
      setDebugSteps(null);
      setCurrentStepIndex(0);
      setHighlightedLines([]);
    } else {
      // Open step debugger
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
      
      // Validate the response structure
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
      // Close algorithm visualizer
      setShowAlgorithmVisualizer(false);
      setAlgorithmVisualization(null);
    } else {
      // Open algorithm visualizer
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

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors pt-8">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 animate-fade-in ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}
          onClick={() => setToast({ message: '', type: 'success' })}
          role="alert"
          style={{ cursor: 'pointer' }}
        >
          {toast.message}
        </div>
      )}
      {/* <h1 className="text-3xl font-bold mb-4 text-center mt-2">AI Debugger</h1> */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto px-4 md:px-8 mt-6">
        {/* Left: Code Editor and Controls */}
        <div className="md:w-1/2 w-full flex flex-col">
          <form onSubmit={handleAnalyze} className="flex-1 flex flex-col gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-2 items-start md:items-center mb-2">
              <label className="font-semibold text-zinc-700 dark:text-zinc-200 mr-2">Complexity Level:</label>
              <select
                value={complexity}
                onChange={e => setComplexity(e.target.value)}
                className="p-2 rounded border dark:bg-zinc-800 dark:text-zinc-100"
                disabled={loading}
              >
                <option value="beginner">Beginner (ELI5 🐣)</option>
                <option value="intermediate">Intermediate (🧑‍💻)</option>
                <option value="expert">Expert (👨‍🚀)</option>
              </select>
              {aiResponse && (
                <button
                  type="button"
                  className="ml-4 px-3 py-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded shadow hover:scale-105 transition-all duration-200"
                  onClick={() => handleAnalyze(null)}
                  disabled={loading}
                  title="Regenerate explanation with selected level"
                >
                  Regenerate
                </button>
              )}
            </div>
            <CodeEditor
              value={code}
              language={language}
              onChange={setCode}
              onLanguageChange={setLanguage}
              onSubmit={handleAnalyze}
              loading={loading}
              highlightLines={highlightedLines}
            />
            {/* Complexity Analyzer Button */}
            <button
              type="button"
              className="mt-2 px-4 py-2 rounded bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-all duration-200 w-fit"
              onClick={handleComplexityAnalyze}
              disabled={complexityLoading || !code.trim()}
            >
              {complexityLoading ? 'Analyzing Complexity...' : showComplexity ? 'Re-analyze Complexity' : 'Complexity Analyzer'}
            </button>
            {/* Show ComplexityAnalyzer below the editor */}
            {showComplexity && (
              <ComplexityAnalyzer
                analysis={complexityAnalysis}
                loading={complexityLoading}
                error={complexityError}
                onClose={() => setShowComplexity(false)}
              />
            )}
            {visualizeError && <div className="text-red-500 font-semibold mt-2">{visualizeError}</div>}
            {instrumentedCode && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                <div className="font-bold text-lg mb-2">🧩 Instrumented Code (JavaScript with Tracer API)</div>
                <pre className="bg-zinc-900 text-white rounded p-3 mb-3 text-sm overflow-x-auto border border-zinc-700">
                  {instrumentedCode}
                </pre>
                <div className="mb-2 text-xs text-zinc-500">Copy and run this code in <a href="https://algorithm-visualizer.org/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">Algorithm Visualizer</a> or integrate tracers.js in your app for live visualization.</div>
              </div>
            )}
            {resourceError && <div className="text-red-500 font-semibold mt-2">{resourceError}</div>}
            {resourceSuggestions && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                <div className="font-bold text-lg mb-2">🔗 Resource Suggestions</div>
                <div className="mb-2">
                  <span className="font-semibold">▶️ YouTube Suggestions:</span>
                  <ol className="list-decimal ml-6 mt-1">
                    {resourceSuggestions.youtube.map((yt, i) => (
                      <li key={i} className="mb-1">
                        <a href={yt.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{yt.title}</a>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <span className="font-semibold">📘 Documentation & Help Links:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {resourceSuggestions.docs.map((doc, i) => (
                      <li key={i} className="mb-1">
                        <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{doc}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {debugError && <div className="text-red-500 font-semibold mt-2">{debugError}</div>}
            {algorithmError && <div className="text-red-500 font-semibold mt-2">{algorithmError}</div>}
          </form>
          {error && <div className="text-red-500 font-semibold mb-4">{error}</div>}

        </div>
        {/* Right: Tabbed Panel */}
        <div className="md:w-1/2 w-full flex flex-col items-center mt-4">
          {/* Tab bar at the top of the right panel */}
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-1.5 rounded-full font-semibold transition-all duration-200 shadow text-base ${rightTab === 'debug' ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={() => setRightTab('debug')}
              disabled={rightTab === 'debug'}
            >
              Debug
            </button>
            {/* <button
              type="button"
              className={`px-4 py-1.5 rounded-full font-semibold transition-all duration-200 shadow text-base ${rightTab === 'visualize' ? 'bg-gradient-to-r from-green-500 via-blue-400 to-purple-500 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={handleVisualize}
              disabled={visualizeLoading || !code.trim()}
            >
              {visualizeLoading ? 'Visualizing...' : 'Visualize'}
            </button> */}

            <button
              type="button"
              className={`px-4 py-1.5 rounded-full font-semibold transition-all duration-200 shadow text-base ${showStepDebugger ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={handleStepDebugToggle}
              disabled={debugLoading || !code.trim()}
            >
              {debugLoading ? 'Debugging...' : showStepDebugger ? 'Close' : 'Step Debugger'}
            </button>

            <button
              type="button"
              className={`px-4 py-1.5 rounded-full font-semibold transition-all duration-200 shadow text-base ${showAlgorithmVisualizer ? 'bg-gradient-to-r from-purple-500 via-blue-400 to-green-500 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={handleAlgorithmVisualizerToggle}
              disabled={algorithmLoading || !code.trim()}
            >
              {algorithmLoading ? 'Visualizing...' : showAlgorithmVisualizer ? 'Close Algorithm Visualizer' : 'Algorithm Visualizer'}
            </button>

            <button
              type="button"
              className={`px-4 py-1.5 rounded-full font-semibold transition-all duration-200 shadow text-base ${rightTab === 'resources' ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={handleSuggestResources}
              disabled={resourceLoading || !code.trim()}
            >
              Suggested Resources
            </button>
          </div>
          
          {/* Tab content - only show when Step Debugger and Algorithm Visualizer are NOT active */}
          {!showStepDebugger && !showAlgorithmVisualizer && rightTab === 'debug' && <Explanation aiResponse={aiResponse} />}
          {!showStepDebugger && !showAlgorithmVisualizer && rightTab === 'visualize' && visualStructures && (
            <>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handlePrev}
                  className="px-3 py-1 rounded bg-zinc-700 text-white font-semibold disabled:opacity-50 text-sm"
                  disabled={visualStep === 0}
                >
                  Prev
                </button>
                <button
                  onClick={handleNext}
                  className="px-3 py-1 rounded bg-blue-600 text-white font-semibold disabled:opacity-50 text-sm"
                  disabled={visualStep === visualStructures.length - 1}
                >
                  Next
                </button>
                <button
                  onClick={handleStop}
                  className="px-3 py-1 rounded bg-red-600 text-white font-semibold text-sm"
                >
                  Stop
                </button>
              </div>
              <CodeStructureVisualizer structures={[visualStructures[visualStep]]} />
            </>
          )}

          {!showStepDebugger && !showAlgorithmVisualizer && rightTab === 'resources' && resourceSuggestions && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
              <div className="font-bold text-lg mb-2">🔗 Resource Suggestions</div>
              <div className="mb-2">
                <span className="font-semibold">▶️ YouTube Suggestions:</span>
                <ol className="list-decimal ml-6 mt-1">
                  {resourceSuggestions.youtube.map((yt, i) => (
                    <li key={i} className="mb-1">
                      <a href={yt.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{yt.title}</a>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <span className="font-semibold">📘 Documentation & Help Links:</span>
                <ul className="list-disc ml-6 mt-1">
                  {resourceSuggestions.docs.map((doc, i) => (
                    <li key={i} className="mb-1">
                      <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{doc}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step Debugger Display - shows in the right panel when active */}
          {showStepDebugger && (
            <StepDebugger 
              debugSteps={debugSteps}
              currentStepIndex={currentStepIndex}
              onStepChange={handleStepChange}
            />
          )}

          {/* Algorithm Visualizer Display - shows in the right panel when active */}
          {showAlgorithmVisualizer && (
            <AlgorithmVisualizer 
              visualizationData={algorithmVisualization}
            />
          )}
        </div>
      </div>
    </div>
  );
} 