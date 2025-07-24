import '../../app/globals.css';
import dbConnect from '../../lib/db';
import Snippet from '../../models/Snippet';
import Explanation from '../../components/Explanation';
import Visualizer from '../../components/Visualizer';
import React from 'react';
import { getAuth } from '@clerk/nextjs/server';

export async function getServerSideProps(context) {
  await dbConnect();
  const { id } = context.query;
  const { userId } = getAuth(context.req);
  if (!userId) {
    return { notFound: true };
  }
  const snippet = await Snippet.findOne({ _id: id, userId }).lean();
  if (!snippet) {
    return { notFound: true };
  }
  return {
    props: {
      snippet: {
        ...snippet,
        _id: snippet._id.toString(),
        createdAt: snippet.createdAt ? new Date(snippet.createdAt).toISOString() : '',
      },
    },
  };
}

export default function HistoryDetail({ snippet }) {
  if (!snippet) return <div className="text-center text-red-500 font-bold mt-12">Snippet not found.</div>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100 py-12 px-4 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-zinc-900/90 rounded-2xl shadow-2xl p-8 mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">Analysis Detail</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <span className="text-sm text-zinc-400">ID: {snippet._id}</span>
          <span className="text-sm text-zinc-400">{snippet.createdAt && new Date(snippet.createdAt).toLocaleString()}</span>
        </div>
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider mb-2">{snippet.language}</span>
        </div>
        <pre className="bg-zinc-800 rounded-lg p-4 text-sm overflow-x-auto mb-8 border border-zinc-700"><code>{snippet.code}</code></pre>
        <Explanation aiResponse={snippet.aiResponse} />
        <Visualizer aiResponse={snippet.aiResponse} />
      </div>
    </div>
  );
} 