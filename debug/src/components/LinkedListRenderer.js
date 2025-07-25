import React from 'react';

export default function LinkedListRenderer({ state, highlightOp }) {
  if (!Array.isArray(state)) return <div>Invalid linked list state</div>;
  return (
    <div className="flex gap-4 items-center justify-center transition-all duration-500">
      {state.map((node, idx) => {
        const isInsert = highlightOp === 'insert' && idx === state.length - 1;
        const isDelete = highlightOp === 'delete' && node == null;
        const isUpdate = highlightOp === 'update';
        return (
          <div key={idx} className="flex items-center">
            <div
              className={`w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-200 to-purple-400 dark:from-purple-700 dark:to-purple-900 text-xl font-bold shadow-lg border-2 transition-all duration-500
                ${isInsert ? 'border-green-400 dark:border-green-600 scale-110 shadow-2xl animate-bounce' : ''}
                ${isDelete ? 'border-red-400 dark:border-red-600 opacity-50 animate-fadeOut' : ''}
                ${isUpdate ? 'border-blue-400 dark:border-blue-600 animate-pulse' : ''}
              `}
              title={isInsert ? 'Inserted' : isDelete ? 'Deleted' : isUpdate ? 'Updated' : ''}
            >
              {node && node.value !== undefined ? node.value : <span className="opacity-50">∅</span>}
              {isInsert && <span className="absolute -top-3 right-0 text-green-600 text-lg animate-bounce">➕</span>}
              {isDelete && <span className="absolute -top-3 right-0 text-red-600 text-lg animate-bounce">➖</span>}
              {isUpdate && <span className="absolute -top-3 right-0 text-blue-600 text-lg animate-pulse">✏️</span>}
            </div>
            {idx < state.length - 1 && (
              <svg width="36" height="16" className="mx-2 animate-pulse" viewBox="0 0 36 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="arrowGradient" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <path d="M2 8h30m0 0l-4-4m4 4l-4 4" stroke="url(#arrowGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
} 