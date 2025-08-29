'use client'
import Image from "next/image";
import Link from 'next/link';
import { useTheme } from '../components/ThemeContext';
import { useState, useEffect } from 'react';

const features = [
  {
    title: 'AI-Powered Code Analysis',
    desc: 'Detect bugs, get suggestions, and understand your code with advanced AI models.',
    icon: '🤖',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Interactive Visualizations',
    desc: 'See your code logic as interactive flowcharts for better understanding.',
    icon: '🧩',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Multi-Language Support',
    desc: 'Analyze JavaScript, Python, TypeScript, and more.',
    icon: '🌐',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'History & Insights',
    desc: 'Browse your past analyses and revisit AI explanations anytime.',
    icon: '📚',
    gradient: 'from-orange-500 to-red-500',
  },
];

export default function LandingPage() {
  const { dark, setDark } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-700">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Hero Section */}
      <section className="relative flex flex-col-reverse lg:flex-row items-center justify-between w-full max-w-7xl mx-auto min-h-[90vh] py-12 px-4 lg:px-8 overflow-hidden">
        {/* Interactive cursor follower */}
        <div 
          className="fixed w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full pointer-events-none z-50 transition-transform duration-100 ease-out"
          style={{
            left: mousePosition.x - 8,
            top: mousePosition.y - 8,
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          }}
        />
        
        {/* Text content */}
        <div className={`flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-slate-700 dark:text-slate-300 mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            AI-Powered Debugging Platform
          </div>
          
          <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-6 leading-tight">
            Debug
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Smarter
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Transform your debugging experience with AI-powered code analysis, interactive visualizations, and intelligent insights that help you write better code faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link href="/debug">
              <button className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 overflow-hidden">
                <span className="relative z-10">Start Debugging Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
            <button className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300 font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
              Watch Demo
            </button>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Multi-language Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
        
        {/* Demo showcase */}
        <div className={`flex-1 flex items-center justify-center mb-8 lg:mb-0 z-10 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative w-full max-w-md lg:max-w-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">AI Debugger</div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 rounded animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800 rounded animate-pulse delay-100"></div>
                <div className="h-4 bg-gradient-to-r from-pink-200 to-red-200 dark:from-pink-800 dark:to-red-800 rounded animate-pulse delay-200"></div>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-white/10">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">AI Analysis</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Detecting potential issues...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Everything you need to debug, analyze, and improve your code with AI assistance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              10K+
            </div>
            <div className="text-slate-600 dark:text-slate-400">Lines of Code Analyzed</div>
          </div>
          <div className="text-center p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              95%
            </div>
            <div className="text-slate-600 dark:text-slate-400">Bug Detection Accuracy</div>
          </div>
          <div className="text-center p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
              5+
            </div>
            <div className="text-slate-600 dark:text-slate-400">Programming Languages</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 lg:px-8 py-20 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-xl border border-white/20">
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to Transform Your Debugging?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already debugging smarter with AI assistance.
          </p>
          <Link href="/debug">
            <button className="px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      <footer className="relative z-10 w-full py-8 flex justify-center items-center text-slate-400 dark:text-slate-600 text-sm border-t border-white/10">
        <div className="text-center">
          <div className="mb-2">© {new Date().getFullYear()} AI Debugger. All rights reserved.</div>
          <div className="flex items-center justify-center gap-6 text-xs">
            <span>Built with Next.js</span>
            <span>•</span>
            <span>Powered by AI</span>
            <span>•</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
