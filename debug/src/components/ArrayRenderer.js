import React from 'react';

export default function ArrayRenderer({ state, highlightOp }) {
  if (!Array.isArray(state)) return <div>Invalid array state</div>;
  return (
    <div className="flex gap-3 justify-center items-end transition-all duration-500">
      {state.map((val, idx) => {
        const isInsert = highlightOp === 'insert' && idx === state.length - 1;
        const isDelete = highlightOp === 'delete' && val == null;
        const isUpdate = highlightOp === 'update';
        return (
          <div
            key={idx}
            className={`relative flex flex-col items-center group transition-all duration-500
              rounded-xl shadow-lg
              ${isInsert ? 'bg-gradient-to-br from-green-300 to-green-500 scale-110 shadow-2xl animate-bounce' : ''}
              ${isDelete ? 'bg-gradient-to-br from-red-200 to-red-400 opacity-50 animate-fadeOut' : ''}
              ${isUpdate ? 'ring-4 ring-blue-400 dark:ring-blue-600 animate-pulse' : ''}
            `}
            style={{ minWidth: 48, minHeight: 48, borderRadius: 16 }}
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-xl font-bold shadow-lg transition-all duration-500 text-black dark:text-white">
              {val !== null && val !== undefined ? val : <span className="opacity-50">∅</span>}
            </div>
            <span className="text-xs text-zinc-500 mt-1">{idx}</span>
            {isInsert && (
              <span className="absolute -top-3 right-0 text-green-600 text-lg animate-bounce" title="Inserted">➕</span>
            )}
            {isDelete && (
              <span className="absolute -top-3 right-0 text-red-600 text-lg animate-bounce" title="Deleted">➖</span>
            )}
            {isUpdate && (
              <span className="absolute -top-3 right-0 text-blue-600 text-lg animate-pulse" title="Updated">✏️</span>
            )}
          </div>
        );
      })}
    </div>
  );
} 