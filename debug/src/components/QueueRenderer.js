import React from 'react';

export default function QueueRenderer({ state, highlightOp }) {
  if (!Array.isArray(state)) return <div>Invalid queue state</div>;
  return (
    <div className="flex gap-3 justify-center items-end transition-all duration-500">
      <span className="text-xs text-zinc-500 mr-2">Front</span>
      {state.map((val, idx) => {
        const isEnqueue = highlightOp === 'enqueue' && idx === state.length - 1;
        const isDequeue = highlightOp === 'dequeue' && val == null;
        const isUpdate = highlightOp === 'update';
        return (
          <div
            key={idx}
            className={`relative flex flex-col items-center group transition-all duration-500
              rounded-xl shadow-lg
              ${isEnqueue ? 'bg-gradient-to-br from-green-300 to-green-500 scale-110 shadow-2xl animate-bounce' : ''}
              ${isDequeue ? 'bg-gradient-to-br from-red-200 to-red-400 opacity-50 animate-fadeOut' : ''}
              ${isUpdate ? 'ring-4 ring-blue-400 dark:ring-blue-600 animate-pulse' : ''}
            `}
            style={{ minWidth: 48, minHeight: 48, borderRadius: 16 }}
            title={isEnqueue ? 'Enqueued' : isDequeue ? 'Dequeued' : isUpdate ? 'Updated' : ''}
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-xl font-bold shadow-lg transition-all duration-500">
              {val !== null && val !== undefined ? val : <span className="opacity-50">∅</span>}
            </div>
            <span className="text-xs text-zinc-500 mt-1">{idx}</span>
            {isEnqueue && (
              <span className="absolute -top-3 right-0 text-green-600 text-lg animate-bounce">➕</span>
            )}
            {isDequeue && (
              <span className="absolute -top-3 right-0 text-red-600 text-lg animate-bounce">➖</span>
            )}
            {isUpdate && (
              <span className="absolute -top-3 right-0 text-blue-600 text-lg animate-pulse">✏️</span>
            )}
          </div>
        );
      })}
      <span className="text-xs text-zinc-500 ml-2">Rear</span>
    </div>
  );
} 