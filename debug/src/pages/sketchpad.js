import React, { useState } from 'react';

const LANGUAGES = ['JavaScript', 'Python'];

export default function Sketchpad() {
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/sketchpad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, language })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-zinc-800 rounded-2xl shadow-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-6">AI Code Sketchpad</h1>
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <label className="block text-lg font-semibold mb-2">Describe what you want the code to do:</label>
          <textarea
            className="w-full h-32 p-3 rounded bg-zinc-700 text-white border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. 'Sort a list using bubble sort'"
            required
          />
          <div className="flex items-center gap-4">
            <label className="font-semibold">Target Language:</label>
            <select
              className="bg-zinc-700 text-white rounded p-2 border border-zinc-600"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Code'}
          </button>
        </form>
        {result && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-2">Generated Code</h2>
              {/* Monaco Editor placeholder */}
              <pre className="bg-zinc-900 rounded p-4 overflow-x-auto border border-zinc-700"><code>{result.code}</code></pre>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Explanation</h2>
              <div className="bg-zinc-900 rounded p-4 border border-zinc-700">{result.explanation}</div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Visualization</h2>
              {/* Visualization block placeholder */}
              <div className="bg-zinc-900 rounded p-4 border border-zinc-700 min-h-[120px]">{result.visualization ? <pre>{result.visualization}</pre> : 'No visualization available.'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 