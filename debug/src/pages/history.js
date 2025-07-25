import React from 'react';
import dbConnect from '../lib/db';
import Snippet from '../models/Snippet';
import Link from 'next/link';
import '../app/globals.css';
import { getAuth } from '@clerk/nextjs/server';


export async function getServerSideProps(context) {
  await dbConnect();
  const { userId } = getAuth(context.req);
  console.log('DEBUG: History userId:', userId);
  if (!userId) {
    return {
      props: { snippets: [] },
    };
  }
  const snippets = await Snippet.find({ userId }, null, { sort: { createdAt: -1 } }).lean();
  console.log('DEBUG: History snippets found:', snippets.length);
  return {
    props: {
      snippets: snippets.map(s => ({
        _id: s._id.toString(),
        language: s.language,
        code: s.code,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
      })),
    },
  };
}

function truncateCode(code, max = 120) {
  if (!code) return '';
  return code.length > max ? code.slice(0, max) + '...' : code;
}

export default function HistoryPage({ snippets }) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100 py-12 px-4 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg">Analysis History</h1>
          {snippets.length === 0 && <p className="text-center text-zinc-400">No snippets found.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {snippets.map(snippet => (
              <div key={snippet._id} className="bg-zinc-900/90 rounded-2xl shadow-xl p-6 flex flex-col border border-zinc-800 hover:scale-105 hover:shadow-2xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider">{snippet.language}</span>
                  <span className="text-xs text-zinc-400">{snippet.createdAt && new Date(snippet.createdAt).toLocaleString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })}</span>
                </div>
                <pre className="bg-zinc-800 rounded-lg p-3 text-xs overflow-x-auto mb-4 border border-zinc-700"><code>{truncateCode(snippet.code)}</code></pre>
                <Link href={`/history/${snippet._id}`} legacyBehavior>
                  <a className="mt-auto px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold text-center shadow hover:scale-105 hover:shadow-2xl transition-all duration-200">View Full Analysis</a>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 