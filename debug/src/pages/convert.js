import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const LANGUAGES = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'C', value: 'c' },
  { label: 'Go', value: 'go' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'PHP', value: 'php' },
  { label: 'Rust', value: 'rust' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Swift', value: 'swift' },
  { label: 'C#', value: 'csharp' },
  { label: 'Scala', value: 'scala' },
  { label: 'Haskell', value: 'haskell' },
  { label: 'Perl', value: 'perl' },
  { label: 'R', value: 'r' },
  { label: 'Dart', value: 'dart' },
  { label: 'Elixir', value: 'elixir' },
  { label: 'Julia', value: 'julia' },
  { label: 'Shell', value: 'bash' },
  { label: 'SQL', value: 'sql' },
  { label: 'MATLAB', value: 'matlab' },
  { label: 'Objective-C', value: 'objectivec' },
];

const CodeEditor = dynamic(() => import('../components/CodeEditor'), { ssr: false });

export default function ConvertPage() {
  const [sourceCode, setSourceCode] = useState('');
  const [sourceLang, setSourceLang] = useState('python');
  const [targetLang, setTargetLang] = useState('javascript');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce translation
  useEffect(() => {
    if (!sourceCode.trim()) {
      setTranslated('');
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: sourceCode,
            source_language: sourceLang,
            target_language: targetLang,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Unknown error');
          setTranslated('');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTranslated(data.translated_code || '');
      } catch (err) {
        setError(err.message);
        setTranslated('');
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce
    return () => clearTimeout(timeout);
  }, [sourceCode, sourceLang, targetLang]);

  return (
    
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12 px-4 flex flex-col items-center">
      <Head>
        <title>Code Translator</title>
      </Head>
      <div className="w-full max-w-5xl bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Multilingual Code Translator</h1>
        <form className="mb-0">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-white">Source Language</label>
              <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="w-full p-2 rounded border dark:bg-zinc-900 dark:text-zinc-100">
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-white">Target Language</label>
              <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full p-2 rounded border dark:bg-zinc-900 dark:text-zinc-100">
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="mt-2 text-red-500 font-semibold">{error}</div>}
        </form>
        <div className="flex flex-col md:flex-row gap-6 mt-4 items-stretch">
          {/* Left: Source Code Editor */}
          <div className="flex-1 min-w-0 flex flex-col">
            <label className="block font-semibold mb-1 text-white dark:text-zinc-100">Source Code</label>
            <div className="flex-1 flex flex-col bg-zinc-900 dark:bg-zinc-900 rounded-lg p-0 min-h-[400px] max-h-[600px]">
              <CodeEditor
                value={sourceCode}
                language={sourceLang}
                onChange={setSourceCode}
                highlightLines={[]}
              />
            </div>
          </div>
          {/* Right: Translated Code Output */}
          <div className="flex-1 min-w-0 flex flex-col">
            <label className="block font-semibold mb-1 text-white dark:text-zinc-100">Translated Code</label>
            <div className="flex-1 bg-zinc-900 dark:bg-zinc-900 rounded-lg p-0 min-h-[400px] max-h-[600px] flex flex-col justify-start">
              {loading ? (
                <div className="text-blue-500 font-semibold animate-pulse p-4">Translating...</div>
              ) : translated ? (
                <SyntaxHighlighter language={targetLang} style={vscDarkPlus} wrapLongLines customStyle={{ background: 'transparent', color: '#f4f4f5', margin: 0, minHeight: '100%' }}>
                  {translated}
                </SyntaxHighlighter>
              ) : (
                <div className="text-zinc-500 dark:text-zinc-300 italic p-4">Translation will appear here.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 