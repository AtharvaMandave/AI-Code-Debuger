import React from 'react';

function renderNode(node, highlightOp, depth = 0, pos = 0, parentPos = 0) {
  if (!node) return null;
  const { value, left, right } = node;
  const isInsert = highlightOp === 'insert' && depth === 0;
  const isDelete = highlightOp === 'delete' && value == null;
  const isUpdate = highlightOp === 'update';
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 60 }}>
      <div
        className={`relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-400 dark:from-pink-700 dark:to-pink-900 text-xl font-bold shadow-lg border-2 transition-all duration-500
          ${isInsert ? 'border-green-400 dark:border-green-600 scale-110 shadow-2xl animate-bounce' : ''}
          ${isDelete ? 'border-red-400 dark:border-red-600 opacity-50 animate-fadeOut' : ''}
          ${isUpdate ? 'border-blue-400 dark:border-blue-600 animate-pulse' : ''}
        `}
        title={isInsert ? 'Inserted' : isDelete ? 'Deleted' : isUpdate ? 'Updated' : ''}
      >
        {value !== null && value !== undefined ? value : <span className="opacity-50">∅</span>}
        {isInsert && <span className="absolute -top-3 right-0 text-green-600 text-lg animate-bounce">➕</span>}
        {isDelete && <span className="absolute -top-3 right-0 text-red-600 text-lg animate-bounce">➖</span>}
        {isUpdate && <span className="absolute -top-3 right-0 text-blue-600 text-lg animate-pulse">✏️</span>}
      </div>
      <div className="flex flex-row justify-between w-full mt-2">
        {left && (
          <div className="flex flex-col items-center">
            <svg width="32" height="24" className="-mb-2 animate-pulse" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="edgeGradientL" x1="0" y1="0" x2="32" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f472b6" />
                  <stop offset="1" stopColor="#f9a8d4" />
                </linearGradient>
              </defs>
              <path d="M16 0v20M16 20l-12-12" stroke="url(#edgeGradientL)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {renderNode(left, highlightOp, depth + 1, pos * 2, pos)}
          </div>
        )}
        {right && (
          <div className="flex flex-col items-center">
            <svg width="32" height="24" className="-mb-2 animate-pulse" viewBox="0 0 32 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="edgeGradientR" x1="0" y1="0" x2="32" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f472b6" />
                  <stop offset="1" stopColor="#f9a8d4" />
                </linearGradient>
              </defs>
              <path d="M16 0v20M16 20l12-12" stroke="url(#edgeGradientR)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {renderNode(right, highlightOp, depth + 1, pos * 2 + 1, pos)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BinaryTreeRenderer({ state, highlightOp }) {
  if (!state || typeof state !== 'object') return <div>Invalid binary tree state</div>;
  return (
    <div className="flex flex-col items-center transition-all duration-500">
      {renderNode(state, highlightOp)}
    </div>
  );
} 