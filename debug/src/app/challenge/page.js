"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("../../components/CodeEditor"), { ssr: false });

const MODES = [
  { value: "fix-bug", label: "Fix the Bug", icon: "🐛", color: "from-red-500 to-pink-500" },
  { value: "output-predictor", label: "Output Predictor", icon: "🔮", color: "from-purple-500 to-indigo-500" },
  { value: "refactor-rush", label: "Refactor Rush", icon: "⚡", color: "from-green-500 to-emerald-500" },
];

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", icon: "🟨" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "cpp", label: "C++", icon: "⚙️" },
];

export default function ChallengePage() {
  // Game state
  const [mode, setMode] = useState(MODES[0].value);
  const [difficulty, setDifficulty] = useState("easy");
  const [language, setLanguage] = useState("javascript");
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [userOutput, setUserOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [detailedFeedback, setDetailedFeedback] = useState("");
  const [xp, setXp] = useState(0);
  const [rank, setRank] = useState("Bronze");
  const [attempts, setAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [hint, setHint] = useState("");
  const [xpEarned, setXpEarned] = useState(0);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [allChallenges, setAllChallenges] = useState({});
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const timerRef = useRef();

  // Simulate userId (replace with real auth in production)
  const userId = typeof window !== "undefined" && window.localStorage ? (window.localStorage.getItem("debug_user_id") || (() => { const id = "user_" + Math.random().toString(36).slice(2, 10); window.localStorage.setItem("debug_user_id", id); return id; })()) : "user_demo";

  // Fetch all challenges for navigation
  const fetchAllChallenges = async () => {
    try {
      console.log('Fetching all challenges for language:', language);
      const res = await fetch(`/api/challenge/list?language=${language}`);
      const data = await res.json();
      console.log('All challenges loaded for language:', language, data);
      setAllChallenges(data.challenges);
      setCurrentWeek(data.currentWeek);
      
      // If no challenges exist, show a message
      if (data.totalChallenges === 0) {
        console.log('No challenges found for language:', language);
        setFeedback(`No ${language} challenges found for this week. Click 'Generate New' to create ${language} challenges using AI.`);
      } else {
        console.log(`Found ${data.totalChallenges} ${language} challenges`);
      }
      
      // Set initialLoading to false after first load
      console.log('Setting initialLoading to false');
      setInitialLoading(false);
    } catch (e) {
      console.error('Error fetching all challenges for language:', language, e);
      setFeedback(`Error loading ${language} challenges. Please try again.`);
      console.log('Setting initialLoading to false due to error');
      setInitialLoading(false);
    }
  };

  // Generate new challenges using Gemini
  const generateNewChallenges = async () => {
    setGeneratingChallenges(true);
    setFeedback(`Generating new ${language} challenges using AI... This may take a moment.`);
    try {
      const res = await fetch("/api/challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      console.log('Challenges generated for language:', language, data);
      await fetchAllChallenges();
      await fetchChallenge();
      setFeedback(`✅ New ${language} challenges generated successfully! Ready to play.`);
    } catch (e) {
      console.error('Error generating challenges:', e);
      setFeedback("❌ Failed to generate challenges. Please try again.");
    } finally {
      setGeneratingChallenges(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/challenge/leaderboard");
      const data = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    }
  };

  const showLeaderboardModal = () => {
    fetchLeaderboard();
    setShowLeaderboard(true);
  };

  const navigateToChallenge = (targetMode, targetDifficulty) => {
    setMode(targetMode);
    setDifficulty(targetDifficulty);
    setFeedback("");
    setDetailedFeedback("");
    setHint("");
    setHintUsed(false);
    setSkipped(false);
    setAttempts(0);
    setTimeLeft(180);
    setXpEarned(0);
    setShowDetailedFeedback(false);
    fetchChallenge(targetMode, targetDifficulty);
  };

  const navigateToNext = () => {
    const currentModeIndex = MODES.findIndex(m => m.value === mode);
    const currentDifficultyIndex = ["easy", "medium", "hard"].indexOf(difficulty);
    
    let nextModeIndex = currentModeIndex;
    let nextDifficultyIndex = currentDifficultyIndex;
    
    if (currentDifficultyIndex < 2) {
      nextDifficultyIndex = currentDifficultyIndex + 1;
    } else {
      nextDifficultyIndex = 0;
      if (currentModeIndex < MODES.length - 1) {
        nextModeIndex = currentModeIndex + 1;
      } else {
        nextModeIndex = 0;
      }
    }
    
    navigateToChallenge(MODES[nextModeIndex].value, ["easy", "medium", "hard"][nextDifficultyIndex]);
  };

  const navigateToPrevious = () => {
    const currentModeIndex = MODES.findIndex(m => m.value === mode);
    const currentDifficultyIndex = ["easy", "medium", "hard"].indexOf(difficulty);
    
    let prevModeIndex = currentModeIndex;
    let prevDifficultyIndex = currentDifficultyIndex;
    
    if (currentDifficultyIndex > 0) {
      prevDifficultyIndex = currentDifficultyIndex - 1;
    } else {
      prevDifficultyIndex = 2;
      if (currentModeIndex > 0) {
        prevModeIndex = currentModeIndex - 1;
      } else {
        prevModeIndex = MODES.length - 1;
      }
    }
    
    navigateToChallenge(MODES[prevModeIndex].value, ["easy", "medium", "hard"][prevDifficultyIndex]);
  };

  const fetchChallenge = async (selectedMode = mode, selectedDifficulty = difficulty, selectedLanguage = language) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenge/random?mode=${selectedMode}&difficulty=${selectedDifficulty}&language=${selectedLanguage}`);
      if (!res.ok) {
        throw new Error('Failed to fetch challenge');
      }
      const data = await res.json();
      setChallenge(data.challenge);
      setCode(data.challenge.starterCode || "");
      setUserOutput("");
      setFeedback("");
      setDetailedFeedback("");
      setHint("");
      setHintUsed(false);
      setSkipped(false);
      setAttempts(0);
      setTimeLeft(180);
      setXpEarned(0);
      setShowDetailedFeedback(false);
    } catch (e) {
      console.error('Error fetching challenge:', e);
      setFeedback("Error loading challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setFeedback("");
    setDetailedFeedback("");
    setHint("");
    setHintUsed(false);
    setSkipped(false);
    setAttempts(0);
    setTimeLeft(180);
    setXpEarned(0);
    setShowDetailedFeedback(false);
    fetchAllChallenges();
    fetchChallenge(mode, difficulty, newLanguage);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setAttempts(attempts + 1);
    try {
      const res = await fetch("/api/challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge._id,
          code: challenge.mode === "output-predictor" ? userOutput : code,
          mode: challenge.mode,
          language: language,
          userId: userId,
        }),
      });
      const data = await res.json();
      setFeedback(data.feedback);
      setDetailedFeedback(data.detailedFeedback || "");
      setXpEarned(data.xpEarned || 0);
      if (data.correct) {
        setXp(xp + (data.xpEarned || 0));
        if (data.newRank) setRank(data.newRank);
      }
    } catch (e) {
      console.error('Error submitting challenge:', e);
      setFeedback("Error submitting solution. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHint = async () => {
    setHintUsed(true);
    try {
      const res = await fetch("/api/challenge/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge._id }),
      });
      const data = await res.json();
      setHint(data.hint);
    } catch (e) {
      console.error('Error fetching hint:', e);
      setHint("Error loading hint. Please try again.");
    }
  };

  const handleSkip = () => {
    setSkipped(true);
    setFeedback("Challenge skipped. Try the next one!");
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const timeDisplay = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    fetchAllChallenges();
    fetchChallenge();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !skipped) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !skipped) {
      setFeedback("⏰ Time's up! Challenge failed.");
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, skipped]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-700">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Initial Loading Screen */}
      {initialLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-10">
          <div className="relative p-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 animate-pulse">
              🎮
            </div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Loading Challenge Game</div>
            <div className="text-slate-600 dark:text-slate-400">Preparing your coding adventure...</div>
          </div>
        </div>
      )}
      
      {/* Main Game UI - only show when not initially loading */}
      {!initialLoading && (
        <div className="relative z-10">
          {/* Top Navigation Bar */}
          <div className="p-6 bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                      🎮
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Contest</h1>
                      <p className="text-slate-600 dark:text-slate-400">Week {currentWeek}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <select
                      className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                      value={mode}
                      onChange={e => setMode(e.target.value)}
                    >
                      {MODES.map(m => (
                        <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                      ))}
                    </select>
                    <select
                      className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value)}
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                    <select
                      className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                      value={language}
                      onChange={e => handleLanguageChange(e.target.value)}
                    >
                      {LANGUAGES.map(l => (
                        <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                      <span className="text-slate-600 dark:text-slate-400">XP:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{xp}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                      <span className="text-slate-600 dark:text-slate-400">Rank:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{rank}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 ${
                      timeLeft < 30 ? 'border-red-500/50' : ''
                    }`}>
                      <span className="text-slate-600 dark:text-slate-400">Time:</span>
                      <span className={`font-bold ${timeLeft < 30 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {timeDisplay}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={showLeaderboardModal}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
                      🏆 Leaderboard
                    </button>
                    <button
                      onClick={generateNewChallenges}
                      disabled={generatingChallenges}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingChallenges ? "🔄 Generating..." : "✨ Generate New"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Challenge Navigation */}
          <div className="p-4 bg-white/5 backdrop-blur-sm border-b border-white/10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={navigateToPrevious}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all duration-300 hover:scale-105"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                  <span className="text-slate-600 dark:text-slate-400">
                    {MODES.find(m => m.value === mode)?.icon} {mode.replace('-', ' ').toUpperCase()}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(difficulty)}`}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </span>
                </div>
                <button
                  onClick={navigateToNext}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all duration-300 hover:scale-105"
                >
                  Next →
                </button>
              </div>
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                <span>Week {currentWeek}</span>
                <span>•</span>
                <span>9 Questions</span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel - Problem Description */}
              <div className="space-y-6">
                {challenge ? (
                  <>
                    {/* Problem Header */}
                    <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{challenge.title}</h2>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                        <span>Mode: {MODES.find(m => m.value === challenge.mode)?.icon} {MODES.find(m => m.value === challenge.mode)?.label}</span>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📝 Problem Description</h3>
                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
                        <p>{challenge.description}</p>
                        {challenge.mode === 'output-predictor' && challenge.starterCode && (
                          <div className="mt-6 p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50">
                            <div className="text-sm text-slate-400 mb-2">Code to Analyze:</div>
                            <pre className="text-sm text-slate-200 whitespace-pre-wrap">{challenge.starterCode}</pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Examples */}
                    {challenge.examples && challenge.examples.length > 0 && (
                      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">💡 Examples</h3>
                        <div className="space-y-4">
                          {challenge.examples.map((example, index) => (
                            <div key={index} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50">
                              <div className="text-sm text-slate-400 mb-3">Example {index + 1}:</div>
                              <div className="space-y-2 text-slate-300">
                                <div><strong className="text-blue-400">Input:</strong> <code className="bg-slate-800 px-2 py-1 rounded">{example.input}</code></div>
                                <div><strong className="text-green-400">Output:</strong> <code className="bg-slate-800 px-2 py-1 rounded">{example.output}</code></div>
                                {example.explanation && (
                                  <div><strong className="text-yellow-400">Explanation:</strong> {example.explanation}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {challenge.constraints && challenge.constraints.length > 0 && (
                      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">⚡ Constraints</h3>
                        <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-2">
                          {challenge.constraints.map((constraint, index) => (
                            <li key={index} className="text-slate-600 dark:text-slate-400">{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback Section */}
                    {feedback && (
                      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">📊 Result</h3>
                        <div className={`p-4 rounded-2xl border-2 ${
                          feedback.includes("🎉") || feedback.includes("Correct") 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-red-500/10 border-red-500/30"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`font-semibold ${
                              feedback.includes("🎉") || feedback.includes("Correct")
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {feedback}
                            </span>
                            {xpEarned > 0 && (
                              <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-medium">
                                +{xpEarned} XP
                              </span>
                            )}
                          </div>
                          {detailedFeedback && (
                            <div className="mt-4">
                              <button
                                onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
                                className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline transition-colors"
                              >
                                {showDetailedFeedback ? "Hide" : "Show"} detailed feedback
                              </button>
                              {showDetailedFeedback && (
                                <div className="mt-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50">
                                  <pre className="whitespace-pre-wrap text-sm text-slate-300">{detailedFeedback}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hint Section */}
                    {hint && (
                      <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">💡 Hint</h3>
                        <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
                          <div className="text-yellow-600 dark:text-yellow-400">
                            💡 {hint}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-center">
                    <div className="text-6xl mb-4">🤔</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Challenge Available</div>
                    <div className="text-slate-600 dark:text-slate-400">Try generating new challenges or switching languages.</div>
                  </div>
                )}
              </div>

              {/* Right Panel - Code Editor and Controls */}
              <div className="space-y-6">
                {/* Code Editor */}
                <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                  {challenge && challenge.mode === "output-predictor" ? (
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">🔮 Predict Output</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          Analyze the code shown in the description and predict what output it will produce.
                        </p>
                        <textarea
                          className="w-full h-48 p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-slate-300 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                          placeholder="Enter your predicted output here... (e.g., [1, 2, 3] or 'Hello World')"
                          value={userOutput}
                          onChange={e => setUserOutput(e.target.value)}
                          disabled={loading || skipped || timeLeft === 0}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {challenge?.mode === 'fix-bug' ? '🐛 Fix the Bug' : 
                           challenge?.mode === 'refactor-rush' ? '⚡ Optimize the Code' : '💻 Your Solution'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          {challenge?.mode === 'fix-bug' ? 
                            'The code below has a bug. Identify and fix it.' :
                           challenge?.mode === 'refactor-rush' ? 
                            'The code below is inefficient. Optimize it for better performance.' :
                            'Write your solution below.'
                          }
                        </p>
                      </div>
                      <div className="h-96">
                        <CodeEditor
                          value={code}
                          language={language}
                          onChange={setCode}
                          onLanguageChange={setLanguage}
                          readOnly={loading || skipped || timeLeft === 0}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Controls */}
                <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSubmit}
                        disabled={skipped || timeLeft === 0 || loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="spinner"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span>🚀</span>
                            <span>Submit</span>
                          </div>
                        )}
                      </button>
                      <button
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleHint}
                        disabled={hintUsed || skipped || timeLeft === 0 || loading}
                      >
                        💡 Hint
                      </button>
                      <button
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSkip}
                        disabled={skipped || timeLeft === 0 || loading}
                      >
                        ⏭️ Skip
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                      <span>Attempts: {attempts}</span>
                      {hintUsed && <span className="text-yellow-600">💡 Hint Used</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">🏆 Leaderboard</h2>
              <button 
                className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600 transition-all duration-300 hover:scale-105" 
                onClick={() => setShowLeaderboard(false)}
              >
                ✕
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700/50">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="py-4 px-6 text-left text-slate-300 font-semibold">#</th>
                    <th className="py-4 px-6 text-left text-slate-300 font-semibold">User</th>
                    <th className="py-4 px-6 text-left text-slate-300 font-semibold">XP</th>
                    <th className="py-4 px-6 text-left text-slate-300 font-semibold">Rank</th>
                    <th className="py-4 px-6 text-left text-slate-300 font-semibold">Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((u, i) => (
                    <tr key={u.userId} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 text-slate-300">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-medium">{u.userId.slice(-6)}</td>
                      <td className="py-4 px-6 text-slate-300">{u.xp}</td>
                      <td className="py-4 px-6 text-slate-300">{u.rank}</td>
                      <td className="py-4 px-6 text-slate-300">{u.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 