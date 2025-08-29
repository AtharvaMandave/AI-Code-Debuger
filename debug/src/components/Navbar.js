"use client";
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useTheme } from './ThemeContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { dark, setDark } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-4 h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
              AI
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
          </div>
          <span className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Debugger
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink href="/" label="Home" />
          <NavLink href="/debug" label="Debug" />
          <NavLink href="/challenge" label="Challenge" />
          <NavLink href="/history" label="History" />
          <NavLink href="/convert" label="Convert" />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            className="relative p-3 rounded-xl bg-white/10 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-slate-100 hover:bg-white/20 dark:hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            <span className="text-lg transition-transform duration-300">
              {dark ? "🌙" : "☀️"}
            </span>
          </button>

          {/* Auth Buttons */}
          <SignedOut>
            <SignInButton>
              <button className="px-6 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-900 dark:text-slate-100 font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-xl",
                  userButtonPopoverCard: "rounded-2xl border border-white/20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl",
                  userButtonPopoverActionButton: "hover:bg-white/10 rounded-xl",
                }
              }}
            />
          </SignedIn>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-900 dark:text-slate-100 hover:bg-white/20 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50">
          <div className="px-4 py-6 space-y-4">
            <MobileNavLink href="/" label="Home" onClick={() => setIsMobileMenuOpen(false)} />
            <MobileNavLink href="/debug" label="Debug" onClick={() => setIsMobileMenuOpen(false)} />
            <MobileNavLink href="/challenge" label="Challenge" onClick={() => setIsMobileMenuOpen(false)} />
            <MobileNavLink href="/history" label="History" onClick={() => setIsMobileMenuOpen(false)} />
            <MobileNavLink href="/convert" label="Convert" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2 rounded-xl text-slate-900 dark:text-slate-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:bg-white/10 backdrop-blur-md group"
    >
      {label}
      <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
    </Link>
  );
}

function MobileNavLink({ href, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 rounded-xl text-slate-900 dark:text-slate-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/10 transition-all duration-300"
    >
      {label}
    </Link>
  );
} 