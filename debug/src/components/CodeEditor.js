import React, { useEffect, useRef, useState } from 'react';

const MONACO_SRC = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs';

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript', icon: '⚡' },
  { label: 'Python', value: 'python', icon: '🐍' },
  { label: 'TypeScript', value: 'typescript', icon: '📘' },
  { label: 'JSON', value: 'json', icon: '📄' },
  { label: 'Markdown', value: 'markdown', icon: '📝' },
  { label: 'C++', value: 'cpp', icon: '⚙️' },
  { label: 'Java', value: 'java', icon: '☕' },
  { label: 'C', value: 'c', icon: '🔧' },
];

function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 animate-fade-in flex items-center gap-3 ${type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}
      onClick={onClose}
      role="alert"
      style={{ cursor: 'pointer' }}
    >
      {type === 'error' ? '⚠️' : '💡'}
      {message}
    </div>
  );
}

export default function CodeEditor({ value, language, onChange, onLanguageChange, onSubmit, loading, highlightLines = [] }) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const monacoInstance = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });
  const decorationsRef = useRef([]);

  useEffect(() => {
    // Dynamically load Monaco
    if (!window.monaco) {
      // Prevent duplicate loader injection
      if (!document.getElementById('monaco-loader-script')) {
        const loaderScript = document.createElement('script');
        loaderScript.id = 'monaco-loader-script';
        loaderScript.src = `${MONACO_SRC}/loader.js`;
        loaderScript.onload = () => {
          window.require.config({ paths: { vs: MONACO_SRC } });
          window.require(['vs/editor/editor.main'], () => {
            createEditor();
          });
        };
        document.body.appendChild(loaderScript);
      } else {
        // Loader is already being loaded, wait for it to finish
        const checkMonaco = setInterval(() => {
          if (window.monaco) {
            clearInterval(checkMonaco);
            createEditor();
          }
        }, 100);
      }
    } else {
      createEditor();
    }
    function createEditor() {
      if (containerRef.current && !editorRef.current) {
        editorRef.current = window.monaco.editor.create(containerRef.current, {
          value: value || '',
          language: language || 'javascript',
          theme: 'vs-dark',
          automaticLayout: true,
          lineNumbers: 'on',
        });
        monacoInstance.current = window.monaco;
        editorRef.current.onDidChangeModelContent(() => {
          onChange && onChange(editorRef.current.getValue());
        });
      }
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, []);

  // Update language or value if props change
  useEffect(() => {
    if (editorRef.current && monacoInstance.current) {
      const model = editorRef.current.getModel();
      if (model && language) {
        monacoInstance.current.editor.setModelLanguage(model, language);
      }
      if (typeof value === 'string' && value !== editorRef.current.getValue()) {
        editorRef.current.setValue(value);
      }
    }
  }, [language, value]);

  // Highlight lines when highlightLines prop changes
  useEffect(() => {
    if (editorRef.current && monacoInstance.current) {
      const model = editorRef.current.getModel();
      if (!model) return;
      // Remove previous decorations
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        []
      );
      if (highlightLines && highlightLines.length > 0) {
        // Support both single lines and ranges
        const decs = highlightLines.map((hl) => {
          if (typeof hl === 'number') {
            return {
              range: new monacoInstance.current.Range(hl, 1, hl, 1),
              options: {
                isWholeLine: true,
                className: 'monaco-highlight-line',
                inlineClassName: '',
                linesDecorationsClassName: '',
                glyphMarginClassName: '',
                minimap: { color: '#facc15', position: 1 },
                inlineClassNameAffectsLetterSpacing: true,
                backgroundColor: 'rgba(250,204,21,0.25)', // yellow-400/25
              },
            };
          } else if (hl && typeof hl === 'object' && hl.start && hl.end) {
            return {
              range: new monacoInstance.current.Range(hl.start, 1, hl.end, 1),
              options: {
                isWholeLine: true,
                className: 'monaco-highlight-line',
                backgroundColor: 'rgba(250,204,21,0.25)',
              },
            };
          }
          return null;
        }).filter(Boolean);
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          decs
        );
      }
    }
  }, [highlightLines]);

  // Add highlight style
  if (typeof window !== 'undefined') {
    const styleId = 'monaco-highlight-line-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `.monaco-highlight-line { background: rgba(250,204,21,0.25) !important; }`;
      document.head.appendChild(style);
    }
  }

  // Copy code to clipboard
  const handleCopy = async () => {
    if (editorRef.current) {
      try {
        await navigator.clipboard.writeText(editorRef.current.getValue());
        showToast('Code copied to clipboard!', 'success');
      } catch (err) {
        showToast('Failed to copy code', 'error');
      }
    }
  };

  // Beautify code
  const handleBeautify = () => {
    if (editorRef.current) {
      try {
        const currentValue = editorRef.current.getValue();
        let beautified = currentValue;
        
        // Basic beautification for different languages
        if (language === 'javascript' || language === 'typescript') {
          // Simple indentation fix
          beautified = currentValue
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
        } else if (language === 'json') {
          try {
            beautified = JSON.stringify(JSON.parse(currentValue), null, 2);
          } catch (e) {
            showToast('Invalid JSON format', 'error');
            return;
          }
        }
        
        editorRef.current.setValue(beautified);
        showToast('Code beautified!', 'success');
      } catch (err) {
        showToast('Failed to beautify code', 'error');
      }
    }
  };

  const currentLanguage = LANGUAGES.find(lang => lang.value === language);

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/90 dark:bg-zinc-900 rounded-2xl shadow-2xl p-0 mb-4 relative animate-fade-in mt-2">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      
      {/* Top bar with language selector, actions, and collapse */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
            title={isCollapsed ? 'Expand Editor' : 'Collapse Editor'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentLanguage?.icon}</span>
            <select
              id="language-select"
              value={language}
              onChange={e => onLanguageChange && onLanguageChange(e.target.value)}
              className="rounded px-3 py-1.5 bg-zinc-800 text-zinc-100 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              style={{ minWidth: 140 }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.icon} {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleBeautify}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-sm transition-all duration-200 hover:scale-105"
            title="Beautify Code"
          >
            ✨ Beautify
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Copy Code"
            aria-label="Copy code"
            type="button"
          >
            📋 Copy
          </button>
        </div>
      </div>
      
      {/* Monaco Editor */}
      <div
        ref={containerRef}
        className={`w-full transition-all duration-300 ${isCollapsed ? 'h-0 overflow-hidden' : 'h-[400px]'} border-t border-b border-zinc-800 bg-zinc-900 rounded-b-none rounded-t-none ${isFocused ? 'ring-4 ring-blue-500/60 border-blue-400 shadow-lg' : ''}`}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 z-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white font-semibold">Analyzing your code...</div>
          </div>
        </div>
      )}
      
      {/* Submit button */}
      <div className="flex justify-between items-center px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          ⌨️
          <span>Press Ctrl+Enter to submit</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow hover:from-blue-700 hover:to-pink-700 transition-all text-lg transform hover:scale-105 hover:shadow-2xl duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <>
              ⏸️ Analyzing...
            </>
          ) : (
            <>
              ▶️ Submit
            </>
          )}
        </button>
      </div>
    </div>
  );
} 