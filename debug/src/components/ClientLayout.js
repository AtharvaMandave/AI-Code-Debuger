"use client";
import React, { useEffect, useState } from "react";
import { createContext } from 'react';

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

  // Provide a context for theme toggling
  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Add ThemeContext for use in navbars
export const ThemeContext = createContext({ dark: true, setDark: () => {} }); 