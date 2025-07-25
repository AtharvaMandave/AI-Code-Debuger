import React from 'react';

export default function StackRenderer({ state, highlightOp }) {
  if (!Array.isArray(state)) return <div>Invalid stack state</div>;
  return (
    <div className="flex flex-col-reverse items-center justify-center transition-all duration-500" style={{ minHeight: 120 }}>
      {state.map((val, idx) => {
        const isPush = highlightOp === 'push' && idx === state.length - 1;
        const isPop = highlightOp === 'pop' && val == null;
        const isUpdate = highlightOp === 'update';
        return (
          <div
            key={idx}
            className={`w-20 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-200 to-blue-400 dark:from-blue-700 dark:to-blue-900 text-lg font-bold shadow-lg mb-2 transition-all duration-500
              ${isPush ? 'scale-110 shadow-2xl animate-bounce' : ''}
              ${isPop ? 'opacity-50 animate-fadeOut' : ''}
              ${isUpdate ? 'ring-4 ring-blue-400 dark:ring-blue-600 animate-pulse' : ''}
            `}
            title={isPush ? 'Pushed' : isPop ? 'Popped' : isUpdate ? 'Updated' : ''}
          >
            {val !== null && val !== undefined ? val : <span className="opacity-50">∅</span>}
            {isPush && <span className="absolute -top-3 right-0 text-green-600 text-lg animate-bounce">➕</span>}
            {isPop && <span className="absolute -top-3 right-0 text-red-600 text-lg animate-bounce">➖</span>}
            {isUpdate && <span className="absolute -top-3 right-0 text-blue-600 text-lg animate-pulse">✏️</span>}
          </div>
        );
      })}
      <span className="text-xs text-zinc-500 mt-2">Top</span>
    </div>
  );
} 