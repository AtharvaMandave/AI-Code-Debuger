"use client";
import React from "react";
import { ThemeProvider } from './ThemeContext';

export default function ClientLayout({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
} 