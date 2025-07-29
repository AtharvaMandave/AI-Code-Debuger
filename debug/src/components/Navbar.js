"use client";
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useTheme } from './ThemeContext';

export default function Navbar() {
  const { dark, setDark } = useTheme();
  return (
    <nav className="w-full sticky top-0 z-40 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3 h-16">
        {/* Title */}
        <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">AI Debugger</span>
        {/* Nav Links */}
        <div className="flex items-center gap-6 text-base font-medium">
          <NavLink href="/" label="Home" />
          <NavLink href="/debug" label="Debug" />
          <NavLink href="/challenge" label="Challenge Game" />
          <NavLink href="/history" label="History" />
          <NavLink href="/convert" label="Convert" />
         
        </div>
        {/* User Actions */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span className="text-lg transition-transform duration-200">
              {dark ? "🌙" : "☀️"}
            </span>
          </button>
          <SignedOut>
            <SignInButton>
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow-sm hover:from-blue-700 hover:to-pink-700 transition-all duration-200">Sign In</button>
            </SignInButton>
            <SignUpButton>
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-sm hover:from-purple-700 hover:to-pink-600 transition-all duration-200">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-zinc-700 dark:text-zinc-200"
    >
      {label}
    </Link>
  );
} 