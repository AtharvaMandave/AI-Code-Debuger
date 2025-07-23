import React from 'react';

function renderDesc(desc) {
  if (desc == null) return '';
  if (typeof desc === 'string' || typeof desc === 'number') return desc;
  if (Array.isArray(desc)) {
    return (
      <ul className="ml-4 list-disc">
        {desc.map((item, i) => (
          <li key={i}>{renderDesc(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof desc === 'object') {
    const { type, description, line, ...rest } = desc;
    const hasKnown = Boolean(type || description || line);

    return (
      <span>
        {type && <span className="font-semibold">[{type}] </span>}
        {description && <span>{description} </span>}
        {line && <span>(line {line})</span>}
        {Object.keys(rest).length > 0 && (
          <span className="ml-2 text-xs text-zinc-500">{JSON.stringify(rest)}</span>
        )}
        {!hasKnown && Object.keys(rest).length === 0 && (
          <span>{JSON.stringify(desc)}</span>
        )}
      </span>
    );
  }
  return String(desc);
}

export default function Explanation({ aiResponse }) {
  if (!aiResponse) return null;

  const { explanation, bugs_detected, issues, suggested_fix, line_by_line } = aiResponse;

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/80 p-6 rounded-xl shadow w-full max-w-2xl ml-0 md:ml-8 mt-6 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100">
      <h2 className="text-xl font-bold mb-2">AI Explanation</h2>
      <p className="mb-4">{explanation}</p>

      <h3 className="font-semibold mb-1">Bugs / Issues Found</h3>
      {bugs_detected && issues && issues.length > 0 ? (
        <ul className="list-disc list-inside mb-4 text-red-600 dark:text-red-400">
          {issues.map((issue, idx) => (
            <li key={idx}>{renderDesc(issue)}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-green-700 dark:text-green-400">No bugs or issues detected.</p>
      )}

      <h3 className="font-semibold mb-1">Suggested Fix</h3>
      {suggested_fix ? (
        <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto mb-4">
          <code>{suggested_fix}</code>
        </pre>
      ) : (
        <p className="mb-4">No suggested fix provided.</p>
      )}

      <h3 className="font-semibold mb-1">Line-by-Line Breakdown</h3>
      {line_by_line && Object.keys(line_by_line).length > 0 ? (
        <ul className="list-decimal list-inside space-y-1">
          {Object.entries(line_by_line).map(([line, desc], idx) => (
            <li key={idx}>
              <span className="font-mono font-semibold">Line {line}:</span>{' '}
              {renderDesc(desc)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No line-by-line breakdown available.</p>
      )}
    </div>
  );
}
