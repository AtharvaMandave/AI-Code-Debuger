import React, { useEffect, useRef, useState } from 'react';

const MONACO_SRC = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs';

const LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
];

function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300 animate-fade-in ${type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}
      onClick={onClose}
      role="alert"
      style={{ cursor: 'pointer' }}
    >
      {message}
    </div>
  );
}

export default function CodeEditor({ value, language, onChange, onLanguageChange, onSubmit, loading, highlightLines = [] }) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const monacoInstance = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });
  const decorationsRef = useRef([]);

  useEffect(() => {
    // Dynamically load Monaco
    if (!window.monaco) {
      const loaderScript = document.createElement('script');
      loaderScript.src = `${MONACO_SRC}/loader.js`;
      loaderScript.onload = () => {
        window.require.config({ paths: { vs: MONACO_SRC } });
        window.require(['vs/editor/editor.main'], () => {
          createEditor();
        });
      };
      document.body.appendChild(loaderScript);
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
  const handleCopy = () => {
    if (editorRef.current) {
      navigator.clipboard.writeText(editorRef.current.getValue());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/90 dark:bg-zinc-900 rounded-2xl shadow-2xl p-0 mb-8 relative animate-fade-in mt-6">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      {/* Top bar with language selector and copy icon */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <div></div>
        <div className="flex items-center gap-2">
          <select
            id="language-select"
            value={language}
            onChange={e => onLanguageChange && onLanguageChange(e.target.value)}
            className="rounded px-2 py-1 bg-zinc-800 text-zinc-100 border border-zinc-700 focus:outline-none"
            style={{ minWidth: 120 }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          <button
            onClick={handleCopy}
            className="ml-2 p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Copy code"
            aria-label="Copy code"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6.75A2.25 2.25 0 0014.25 4.5h-6A2.25 2.25 0 006 6.75v10.5A2.25 2.25 0 008.25 19.5h6a2.25 2.25 0 002.25-2.25v-1.5M9.75 15.75h6A2.25 2.25 0 0018 13.5v-6A2.25 2.25 0 0015.75 5.25h-6A2.25 2.25 0 007.5 7.5v6a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
        </div>
      </div>
      {/* Monaco Editor */}
      <div
        ref={containerRef}
        className={`w-full h-[400px] border-t border-b border-zinc-800 bg-zinc-900 rounded-b-none rounded-t-none transition-all duration-300 ${isFocused ? 'ring-4 ring-blue-500/60 border-blue-400 shadow-lg' : ''}`}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 z-20">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {/* Submit button */}
      <div className="flex justify-end px-4 pb-4 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow hover:from-blue-700 hover:to-pink-700 transition-all text-lg transform hover:scale-105 hover:shadow-2xl duration-200"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Submit'}
        </button>
      </div>
    </div>
  );
} 