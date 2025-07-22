import Image from "next/image";
import Link from 'next/link';

const features = [
  {
    title: 'AI-Powered Code Analysis',
    desc: 'Detect bugs, get suggestions, and understand your code with advanced AI models.',
    icon: '🤖',
  },
  {
    title: 'Interactive Visualizations',
    desc: 'See your code logic as interactive flowcharts for better understanding.',
    icon: '🧩',
  },
  {
    title: 'Multi-Language Support',
    desc: 'Analyze JavaScript, Python, TypeScript, and more.',
    icon: '🌐',
  },
  {
    title: 'History & Insights',
    desc: 'Browse your past analyses and revisit AI explanations anytime.',
    icon: '📚',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 transition-colors">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-900/80 shadow-sm sticky top-0 z-40 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow">AI Debugger</span>
        </div>
        <div className="flex gap-6 text-base font-medium">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
          <Link href="/debug" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Debug</Link>
          <Link href="/history" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">History</Link>
          <Link href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col-reverse md:flex-row items-center justify-between w-full max-w-6xl mx-auto min-h-[520px] py-12 md:py-24 px-4 md:px-8 overflow-hidden">
        {/* Blurred blobs background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-80px] right-[-80px] w-[320px] h-[320px] bg-gradient-to-tr from-pink-400 via-blue-400 to-purple-400 opacity-20 rounded-full blur-2xl animate-pulse" />
        </div>
        {/* Text content */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            Debug Smarter, Not Harder
          </h1>
          <p className="text-lg md:text-2xl text-zinc-700 dark:text-zinc-200 mb-8 max-w-xl">
            Let AI find bugs, explain code, and visualize logic – instantly.
          </p>
          <Link href="/debug">
            <button className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300 animate-bounce">
              Try It Now
            </button>
          </Link>
        </div>
        {/* Demo video/GIF placeholder */}
        <div className="flex-1 flex items-center justify-center mb-8 md:mb-0 z-10">
          <div className="w-[320px] h-[200px] md:w-[400px] md:h-[250px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl shadow-lg flex items-center justify-center border-4 border-white/40 dark:border-zinc-700 animate-fade-in">
            <span className="text-zinc-400 dark:text-zinc-500 text-lg">Demo Video/GIF Coming Soon</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <div className="flex justify-center w-full mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl w-full">
          {features.map((f, i) => (
            <div key={i} className="bg-white/80 dark:bg-zinc-800/80 rounded-xl shadow p-6 flex flex-col items-center text-center border border-zinc-100 dark:border-zinc-800">
              <div className="text-4xl mb-2">{f.icon}</div>
              <div className="font-bold text-lg mb-1">{f.title}</div>
              <div className="text-zinc-600 dark:text-zinc-300 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">About AI Debugger</h2>
        <p className="text-zinc-700 dark:text-zinc-200 text-lg mb-4">
          AI Debugger is your all-in-one tool for code analysis, bug detection, and visualization. Powered by Gemini AI and built with Next.js, it helps developers of all levels understand, debug, and improve their code faster than ever before.
        </p>
        <p className="text-zinc-500 dark:text-zinc-400 text-base">
          Whether you're a student, professional, or hobbyist, AI Debugger empowers you to write better code and learn from AI-driven insights.
        </p>
      </section>

      <footer className="w-full py-6 flex justify-center items-center text-zinc-400 dark:text-zinc-600 text-xs border-t border-zinc-100 dark:border-zinc-800">
        &copy; {new Date().getFullYear()} AI Debugger. All rights reserved.
      </footer>
    </div>
  );
}
