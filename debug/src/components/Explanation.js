import React, { useState, useRef } from 'react';

function renderDesc(desc) {
  if (desc == null) return '';
  if (typeof desc === 'string' || typeof desc === 'number') return desc;
  if (Array.isArray(desc)) {
    return (
      <ul className="ml-4 list-disc">
        {desc.map((item, i) => (
          <li key={i}>{renderDesc(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof desc === 'object') {
    const { type, description, line, ...rest } = desc;
    const hasKnown = Boolean(type || description || line);

    return (
      <span>
        {type && <span className="font-semibold">[{type}] </span>}
        {description && <span>{description} </span>}
        {line && <span>(line {line})</span>}
        {Object.keys(rest).length > 0 && (
          <span className="ml-2 text-xs text-zinc-500">{JSON.stringify(rest)}</span>
        )}
        {!hasKnown && Object.keys(rest).length === 0 && (
          <span>{JSON.stringify(desc)}</span>
        )}
      </span>
    );
  }
  return String(desc);
}

export default function Explanation({ aiResponse, onApplyFix }) {
  if (!aiResponse) return null;

  const { explanation, bugs_detected, issues, suggested_fix, line_by_line, images } = aiResponse;
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState({});
  const [applyingFix, setApplyingFix] = useState(false);
  const synthRef = useRef(null);

  const handlePlayExplanation = () => {
    if (!explanation) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utter = new window.SpeechSynthesisUtterance(explanation);
    synthRef.current = utter;
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utter);
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleAutoApplyFix = async () => {
    if (!suggested_fix || !onApplyFix) return;
    
    setApplyingFix(true);
    try {
      await onApplyFix(suggested_fix);
    } catch (error) {
      console.error('Failed to apply fix:', error);
    } finally {
      setApplyingFix(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900/80 p-6 rounded-xl shadow-lg w-full max-w-2xl ml-0 md:ml-8 mt-6 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white">
      {/* AI Explanation Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              💡
            </div>
            <h2 className="text-xl font-bold">AI Explanation</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(explanation, 'explanation')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Copy explanation"
            >
              {copied.explanation ? '✅' : '📋'}
              {copied.explanation ? 'Copied!' : 'Copy'}
            </button>
            {explanation && (
              <button
                onClick={handlePlayExplanation}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white transition-all duration-200 hover:scale-105"
                title={isPlaying ? 'Pause explanation' : 'Play explanation'}
              >
                {isPlaying ? '⏸️' : '🔊'}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            )}
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm leading-relaxed">{explanation}</p>
        </div>
      </div>

      {/* Images Section */}
      {images && images.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
              🖼️
            </div>
            <h3 className="font-semibold">Visual Aids</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img}
                  alt={`Illustration ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-lg shadow-md border border-zinc-300 dark:border-zinc-700 bg-white transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">View Full Size</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bugs / Issues Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 text-white">
            🐛
          </div>
          <h3 className="font-semibold">Bugs / Issues Found</h3>
        </div>
        {(bugs_detected || (issues && issues.length > 0)) ? (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <ul className="list-disc list-inside space-y-2 text-sm">
              {issues && issues.length > 0 ? (
                issues.map((issue, idx) => (
                  <li key={idx} className="text-red-700 dark:text-red-300">
                    {renderDesc(issue)}
                  </li>
                ))
              ) : bugs_detected && explanation ? (
                <li className="text-red-700 dark:text-red-300">
                  {renderDesc(explanation)}
                </li>
              ) : (
                <li className="text-red-700 dark:text-red-300">
                  Bug detected but no specific details provided.
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              ✅
              <span className="font-semibold">No bugs or issues detected.</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Fix Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              🚀
            </div>
            <h3 className="font-semibold">Suggested Fix</h3>
          </div>
          {suggested_fix && (
            <button
              onClick={() => copyToClipboard(suggested_fix, 'fix')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Copy suggested fix"
            >
              {copied.fix ? '✅' : '📋'}
              {copied.fix ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {suggested_fix ? (
          <div className="bg-zinc-900 dark:bg-black rounded-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700 dark:border-zinc-600">
              <span className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">
                Suggested Fix
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
              <pre className="text-sm text-zinc-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
                <code>{suggested_fix}</code>
              </pre>
            </div>
            {/* Auto Apply Button - Only show when bugs are detected and fix is available */}
            {bugs_detected && onApplyFix && (
              <div className="px-4 pb-4">
                <button
                  onClick={handleAutoApplyFix}
                  disabled={applyingFix}
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title="Automatically apply the suggested fix to your code"
                >
                  {applyingFix ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Applying Fix...
                    </>
                  ) : (
                    <>
                      <span>🔧</span>
                      Auto Apply Fix
                    </>
                  )}
                </button>
                <p className="text-xs text-zinc-400 mt-2 text-center">
                  This will replace your current code with the fixed version
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">No suggested fix provided.</p>
          </div>
        )}
      </div>

      {/* Line-by-Line Breakdown Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            📋
          </div>
          <h3 className="font-semibold">Line-by-Line Breakdown</h3>
        </div>
        {line_by_line && Object.keys(line_by_line).length > 0 ? (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="space-y-3">
              {Object.entries(line_by_line).map(([line, desc], idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {line}
                  </div>
                  <div className="flex-1 text-sm">
                    {renderDesc(desc)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-300 dark:border-zinc-700">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">No line-by-line breakdown available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
