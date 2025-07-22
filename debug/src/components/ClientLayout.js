"use client";
import React, { useEffect, useState } from "react";

export default function ClientLayout({ children }) {
  // Set dark mode as default and sync with localStorage
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
    }
    return true; // default to dark mode
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <button
          className="rounded-full px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
      {children}
    </>
  );
} 