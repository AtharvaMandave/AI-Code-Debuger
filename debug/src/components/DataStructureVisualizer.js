import React, { useState, useEffect } from 'react';
import ArrayRenderer from './ArrayRenderer';
import LinkedListRenderer from './LinkedListRenderer';
import BinaryTreeRenderer from './BinaryTreeRenderer';
import StackRenderer from './StackRenderer';
import QueueRenderer from './QueueRenderer';
import GraphRenderer from './GraphRenderer';
// import StackRenderer, QueueRenderer, GraphRenderer if you add them

const typeToRenderer = {
  array: ArrayRenderer,
  linked_list: LinkedListRenderer,
  binary_tree: BinaryTreeRenderer,
  stack: StackRenderer,
  queue: QueueRenderer,
  graph: GraphRenderer,
};

export default function DataStructureVisualizer({ timeline, code }) {
  const [step, setStep] = useState(0);
  useEffect(() => { setStep(0); }, [timeline]);
  if (!timeline || timeline.length === 0) return null;
  const { structure_type, state, code_line, operation } = timeline[step];
  const Renderer = typeToRenderer[structure_type] || (() => <div>Unknown structure: {structure_type}</div>);
  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow p-4 mt-6 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg capitalize">{structure_type.replace('_', ' ')} Visualization</h3>
        <div className="flex gap-2">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100">Prev</button>
          <span className="text-sm">Step {step + 1} / {timeline.length}</span>
          <button onClick={() => setStep(s => Math.min(timeline.length - 1, s + 1))} disabled={step === timeline.length - 1} className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100">Next</button>
        </div>
      </div>
      <div className="mb-2 text-sm text-zinc-500">Operation: <span className="font-semibold text-blue-600 dark:text-blue-400">{operation}</span> &nbsp;|&nbsp; Code Line: <span className="font-mono">{code_line}</span></div>
      <Renderer state={state} highlightOp={operation} />
      {code && code_line && (
        <pre className="mt-4 p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-700">
          {code.split('\n')[code_line - 1]}
        </pre>
      )}
    </div>
  );
} 