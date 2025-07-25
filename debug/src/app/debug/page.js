'use client';
import React, { useState, useContext, useRef } from 'react';
import CodeEditor from '../../components/CodeEditor';
import Explanation from '../../components/Explanation';
import Visualizer from '../../components/Visualizer';
import Link from 'next/link';
import { ThemeContext } from '../../components/ClientLayout';
import { useUser, SignInButton } from '@clerk/nextjs';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { GoogleGenerativeAI } from "@google/generative-ai";
import DataStructureVisualizer from '../../components/DataStructureVisualizer';

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
  const [executionTrace, setExecutionTrace] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [complexity, setComplexity] = useState('beginner'); // 'beginner', 'intermediate', 'expert'
  const [structureTimeline, setStructureTimeline] = useState(null);
  const [resourceSuggestions, setResourceSuggestions] = useState(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState(null);

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

  const handleStartDebug = async () => {
    setLoading(true);
    setDebugMode(false);
    setExecutionTrace(null);
    setCurrentStep(0);
    try {
      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setExecutionTrace(data.execution_trace);
      setDebugMode(true);
      setCurrentStep(0);
    } catch (err) {
      setError('Failed to start debug.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep = (dir) => {
    if (!executionTrace) return;
    setCurrentStep((prev) => {
      if (dir === 'next') return Math.min(prev + 1, executionTrace.length - 1);
      if (dir === 'prev') return Math.max(prev - 1, 0);
      if (dir === 'restart') return 0;
      return prev;
    });
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

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
      {/* <h1 className="text-3xl font-bold mb-4 text-center mt-2">AI Debugger</h1> */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto px-4 md:px-8 ">
        {/* Left: Code Editor */}
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
            <button
              type="button"
              className="mt-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 text-white font-semibold shadow hover:from-red-600 hover:to-yellow-500 transition-all"
              onClick={handleSuggestResources}
              disabled={resourceLoading || !code.trim()}
            >
              {resourceLoading ? 'Loading Suggestions...' : 'Suggest Resources'}
            </button>
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
          </form>
          {error && <div className="text-red-500 font-semibold mb-4">{error}</div>}
          {language === 'python' && (
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
              onClick={handleStartDebug}
              disabled={loading || !code.trim()}
            >
              {loading ? 'Starting Debug...' : '🐞 Start Debug'}
            </button>
          )}
        </div>
        {/* Right: Debug/Visualize Toggle and Results */}
        <div className="md:w-1/2 w-full flex flex-col items-center">
          <div className="flex gap-4 mb-4">
            <button
              className={`px-6 py-2 mt-5 rounded-full font-semibold transition-all duration-200 shadow text-lg ${view === 'debug' ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={() => setView('debug')}
              disabled={view === 'debug'}
            >
              Debug
            </button>
            <button
              className={`px-6 py-2 mt-5 rounded-full font-semibold transition-all duration-200 shadow text-lg ${view === 'visualize' ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white scale-105' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:scale-105'}`}
              onClick={() => setView('visualize')}
              disabled={view === 'visualize'}
            >
              Visualize
            </button>
          </div>
          {loading && <div className="text-blue-500 font-medium mb-4 animate-pulse">Loading AI analysis...</div>}
          {/* Step Debugger UI */}
          {debugMode && executionTrace && (
            <div className="w-full flex flex-col gap-4 mb-8">
              <h2 className="text-xl font-bold mb-2">Step Debugger</h2>
              <div className="mb-2">
                <SyntaxHighlighter
                  language="python"
                  style={vscDarkPlus}
                  showLineNumbers
                  wrapLines
                  lineProps={lineNumber => {
                    const isCurrent = executionTrace[currentStep]?.line === lineNumber;
                    return {
                      style: isCurrent ? { background: '#fde68a', color: '#222' } : {}
                    };
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
              <div className="flex gap-4 mb-2">
                <button onClick={() => handleStep('prev')} className="px-3 py-1 bg-zinc-700 text-white rounded" disabled={currentStep === 0}>⏮️ Prev</button>
                <button onClick={() => handleStep('next')} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={currentStep === executionTrace.length - 1}>▶️ Next</button>
                <button onClick={() => handleStep('restart')} className="px-3 py-1 bg-zinc-500 text-white rounded">🔁 Restart</button>
              </div>
              <div className="mb-2 p-3 bg-zinc-800 text-white rounded">
                <strong>Step {currentStep + 1} of {executionTrace.length}</strong><br />
                <span className="block mt-1">{executionTrace[currentStep]?.description}</span>
              </div>
              <div className="mb-2 p-3 bg-zinc-100 text-zinc-900 rounded">
                <strong>Variables:</strong>
                <pre className="mt-1">{JSON.stringify(executionTrace[currentStep]?.variables, null, 2)}</pre>
              </div>
            </div>
          )}
          {/* End Step Debugger UI */}
          {aiResponse && (
            <div className="w-full flex flex-col gap-8">
              {view === 'debug' && <Explanation aiResponse={aiResponse} />}
              {structureTimeline && structureTimeline.length > 0 && (
                <DataStructureVisualizer timeline={structureTimeline} code={code} />
              )}
              {view === 'visualize' && (
                <Visualizer
                  aiResponse={aiResponse}
                  setHighlightedLines={setHighlightedLines}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 