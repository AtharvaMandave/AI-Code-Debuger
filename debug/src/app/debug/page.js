'use client';
import React, { useState, useContext, useRef } from 'react';
import CodeEditor from '../../components/CodeEditor';
import Explanation from '../../components/Explanation';
import Visualizer from '../../components/Visualizer';
import Link from 'next/link';
import { ThemeContext } from '../../components/ClientLayout';

export default function DebugPage() {
  const { dark, setDark } = useContext(ThemeContext);
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

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Unknown error', 'error');
        throw new Error(err.error || 'Unknown error');
      }
      const data = await res.json();
      setAiResponse(data);
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

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
      {/* <h1 className="text-3xl font-bold mb-4 text-center mt-2">AI Debugger</h1> */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto px-4 md:px-8 ">
        {/* Left: Code Editor */}
        <div className="md:w-1/2 w-full flex flex-col">
          <form onSubmit={handleAnalyze} className="flex-1 flex flex-col gap-4 mb-4">
            <CodeEditor
              value={code}
              language={language}
              onChange={setCode}
              onLanguageChange={setLanguage}
              onSubmit={handleAnalyze}
              loading={loading}
              highlightLines={highlightedLines}
            />
          </form>
          {error && <div className="text-red-500 font-semibold mb-4">{error}</div>}
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
          {aiResponse && (
            <div className="w-full flex flex-col gap-8">
              {view === 'debug' && <Explanation aiResponse={aiResponse} />}
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