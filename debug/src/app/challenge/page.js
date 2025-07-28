"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("../../components/CodeEditor"), { ssr: false });

const MODES = [
  { value: "fix-bug", label: "Fix the Bug" },
  { value: "output-predictor", label: "Output Predictor" },
  { value: "refactor-rush", label: "Refactor Rush" },
];

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
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
      console.log('All challenges loaded:', data);
      setAllChallenges(data.challenges);
      setCurrentWeek(data.currentWeek);
      
      // If no challenges exist, show a message
      if (data.totalChallenges === 0) {
        console.log('No challenges found, suggesting to generate new ones');
        setFeedback("No challenges found for this week. Click 'Generate New' to create challenges using AI.");
      }
      
      // Set initialLoading to false after first load
      console.log('Setting initialLoading to false');
      setInitialLoading(false);
    } catch (e) {
      console.error('Error fetching all challenges:', e);
      setFeedback("Error loading challenges. Please try again.");
      console.log('Setting initialLoading to false due to error');
      setInitialLoading(false);
    }
  };

  // Generate new challenges using Gemini
  const generateNewChallenges = async () => {
    setGeneratingChallenges(true);
    setFeedback("Generating new challenges using AI... This may take a moment.");
    try {
      const res = await fetch("/api/challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      const data = await res.json();
      console.log('Challenges generated:', data);
      await fetchAllChallenges();
      await fetchChallenge();
      setFeedback("✅ New challenges generated successfully! Ready to play.");
    } catch (e) {
      console.error('Error generating challenges:', e);
      setFeedback("❌ Failed to generate challenges. Please try again.");
    } finally {
      setGeneratingChallenges(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/challenge/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch (e) {
      setLeaderboard([]);
    }
  };

  // Show leaderboard modal
  const showLeaderboardModal = () => {
    setShowLeaderboard(true);
  };

  // Navigate to specific challenge
  const navigateToChallenge = (targetMode, targetDifficulty) => {
    const modeChallenges = allChallenges[targetMode] || [];
    const targetChallenge = modeChallenges.find(c => c.difficulty === targetDifficulty);
    
    if (targetChallenge) {
      setMode(targetMode);
      setDifficulty(targetDifficulty);
      setChallenge(targetChallenge);
      setCode(targetChallenge.starterCode);
      setLanguage(targetChallenge.language);
      setUserOutput("");
      setFeedback("");
      setDetailedFeedback("");
      setHint("");
      setHintUsed(false);
      setSkipped(false);
      setTimeLeft(180);
      setXpEarned(0);
      setShowDetailedFeedback(false);
    }
  };

  // Navigate to next challenge
  const navigateToNext = () => {
    const difficulties = ['easy', 'medium', 'hard'];
    const modes = ['fix-bug', 'output-predictor', 'refactor-rush'];
    
    let currentModeIndex = modes.indexOf(mode);
    let currentDifficultyIndex = difficulties.indexOf(difficulty);
    
    // Move to next difficulty or next mode
    if (currentDifficultyIndex < 2) {
      currentDifficultyIndex++;
    } else {
      currentDifficultyIndex = 0;
      currentModeIndex = (currentModeIndex + 1) % modes.length;
    }
    
    const nextMode = modes[currentModeIndex];
    const nextDifficulty = difficulties[currentDifficultyIndex];
    
    navigateToChallenge(nextMode, nextDifficulty);
  };

  // Navigate to previous challenge
  const navigateToPrevious = () => {
    const difficulties = ['easy', 'medium', 'hard'];
    const modes = ['fix-bug', 'output-predictor', 'refactor-rush'];
    
    let currentModeIndex = modes.indexOf(mode);
    let currentDifficultyIndex = difficulties.indexOf(difficulty);
    
    // Move to previous difficulty or previous mode
    if (currentDifficultyIndex > 0) {
      currentDifficultyIndex--;
    } else {
      currentDifficultyIndex = 2;
      currentModeIndex = (currentModeIndex - 1 + modes.length) % modes.length;
    }
    
    const prevMode = modes[currentModeIndex];
    const prevDifficulty = difficulties[currentDifficultyIndex];
    
    navigateToChallenge(prevMode, prevDifficulty);
  };

  // Fetch random challenge
  const fetchChallenge = async (selectedMode = mode, selectedDifficulty = difficulty, selectedLanguage = language) => {
    console.log('Fetching challenge:', { selectedMode, selectedDifficulty, selectedLanguage });
    setLoading(true);
    setFeedback("");
    setDetailedFeedback("");
    setHint("");
    setHintUsed(false);
    setSkipped(false);
    setTimeLeft(180);
    setXpEarned(0);
    setShowDetailedFeedback(false);
    setActiveTab("description");
    try {
      const res = await fetch(`/api/challenge/random?mode=${selectedMode}&difficulty=${selectedDifficulty}&language=${selectedLanguage}`);
      if (!res.ok) {
        throw new Error("No challenge found");
      }
      const data = await res.json();
      console.log('Challenge fetched:', data);
      setChallenge(data);
      setCode(data.starterCode);
      setLanguage(data.language);
      setUserOutput("");
      setInitialLoading(false);
    } catch (e) {
      console.error('Error fetching challenge:', e);
      setChallenge(null);
      setFeedback("No challenge found for this mode/difficulty. Please click 'Generate New' to create challenges using AI.");
      setInitialLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Timer logic - stop timer when challenge is completed or skipped
  useEffect(() => {
    if (timeLeft > 0 && challenge && !skipped && !feedback.includes("🎉") && !feedback.includes("Correct")) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, challenge, skipped, feedback]);

  // On mount, fetch challenges and leaderboard
  useEffect(() => {
    fetchAllChallenges();
    fetchLeaderboard();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Loading timeout reached, setting initialLoading to false');
      setInitialLoading(false);
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, []);

  // Initial challenge fetch after initial loading is complete
  useEffect(() => {
    if (!initialLoading) {
      fetchChallenge(mode, difficulty, language);
    }
  }, [initialLoading, mode, difficulty, language]);

  // Mode/difficulty/language change
  useEffect(() => {
    if (!initialLoading) {
      fetchAllChallenges();
    }
  }, [mode, difficulty, language]);

  // Submit handler
  const handleSubmit = async () => {
    if (!challenge) return;
    console.log('Submitting challenge:', challenge._id);
    setLoading(true);
    setFeedback("");
    setDetailedFeedback("");
    setXpEarned(0);
    try {
      const res = await fetch("/api/challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          challengeId: challenge._id,
          userCode: code,
          userOutput: userOutput,
          mode: challenge.mode,
        }),
      });
      const data = await res.json();
      console.log('Submission result:', data);
      setFeedback(data.feedback);
      setDetailedFeedback(data.detailedFeedback || "");
      setXp(data.xp);
      setRank(data.rank);
      setAttempts(data.attempts);
      setXpEarned(data.xpEarned || 0);
      
      // Don't auto-fetch new challenge, let user navigate manually
      fetchLeaderboard();
    } catch (e) {
      console.error('Submission error:', e);
      setFeedback("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Hint handler (Gemini integration placeholder)
  const handleHint = async () => {
    setHintUsed(true);
    setLoading(true);
    setHint("");
    try {
      // TODO: Integrate Gemini for smart hints
      setHint("Hint: Check the comparison operator or logic in the loop.");
    } catch (e) {
      setHint("No hint available.");
    } finally {
      setLoading(false);
    }
  };

  // Skip handler
  const handleSkip = () => {
    setSkipped(true);
    setFeedback("Challenge skipped. No XP awarded.");
  };

  // Timer formatting
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const timeDisplay = `${min}:${sec.toString().padStart(2, "0")}`;

  // Get difficulty color
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Initial Loading Screen */}
      {initialLoading && (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">Loading Challenge Game...</div>
        </div>
      )}
      
      {/* Main Game UI - only show when not initially loading */}
      {!initialLoading && (
        <>
          {/* Top Navigation Bar - LeetCode Style */}
          <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Contest - Week {currentWeek}</h1>
                <div className="flex items-center space-x-4">
                  <select
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                  >
                    {MODES.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <select
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">XP:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{xp}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rank:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{rank}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Time:</span>
                  <span className={`font-semibold ${timeLeft < 30 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {timeDisplay}
                  </span>
                </div>
                <button
                  onClick={showLeaderboardModal}
                  className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Leaderboard
                </button>
                <button
                  onClick={generateNewChallenges}
                  disabled={generatingChallenges}
                  className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                  {generatingChallenges ? "Generating..." : "Generate New"}
                </button>
              </div>
            </div>
          </div>

          {/* Challenge Navigation */}
          <div className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={navigateToPrevious}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {mode.replace('-', ' ').toUpperCase()} - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </span>
                <button
                  onClick={navigateToNext}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Next →
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Week {currentWeek}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">|</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">9 Questions</span>
              </div>
            </div>
          </div>

          {/* Main Content Area - Split Layout */}
          <div className="flex h-[calc(100vh-140px)]">
            {/* Left Panel - Problem Description */}
            <div className="w-1/2 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto">
              <div className="p-6">
                {challenge ? (
                  <>
                    {/* Problem Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{challenge.title}</h2>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Mode: {MODES.find(m => m.value === challenge.mode)?.label}
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Problem Description</h3>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {challenge.description}
                        {challenge.mode === 'output-predictor' && challenge.starterCode && (
                          <div className="mt-4">
                            <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-lg border">
                              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{challenge.starterCode}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Examples */}
                    {challenge.examples && challenge.examples.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Examples</h3>
                        {challenge.examples.map((example, index) => (
                          <div key={index} className="mb-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Example {index + 1}:</div>
                            <div className="text-gray-700 dark:text-gray-300">
                              <div><strong>Input:</strong> {example.input}</div>
                              <div><strong>Output:</strong> {example.output}</div>
                              {example.explanation && (
                                <div><strong>Explanation:</strong> {example.explanation}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Constraints */}
                    {challenge.constraints && challenge.constraints.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Constraints</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                          {challenge.constraints.map((constraint, index) => (
                            <li key={index}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Feedback Section */}
                    {feedback && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Result</h3>
                        <div className={`p-4 rounded-lg border-2 ${
                          feedback.includes("🎉") || feedback.includes("Correct") 
                            ? "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700" 
                            : "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700"
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold ${
                              feedback.includes("🎉") || feedback.includes("Correct")
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                            }`}>
                              {feedback}
                            </span>
                            {xpEarned > 0 && (
                              <span className="text-sm bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded font-medium">
                                +{xpEarned} XP
                              </span>
                            )}
                          </div>
                          {detailedFeedback && (
                            <div className="mt-3">
                              <button
                                onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
                                className="text-sm text-blue-600 dark:text-blue-400 underline hover:no-underline"
                              >
                                {showDetailedFeedback ? "Hide" : "Show"} detailed feedback
                              </button>
                              {showDetailedFeedback && (
                                <div className="mt-2 p-3 bg-white dark:bg-zinc-800 rounded border text-sm">
                                  <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{detailedFeedback}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hint Section */}
                    {hint && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hint</h3>
                        <div className="p-4 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700 rounded-lg">
                          <div className="text-yellow-800 dark:text-yellow-200">
                            💡 {hint}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">No challenge available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Code Editor and Controls */}
            <div className="w-1/2 flex flex-col">
              {/* Code Editor */}
              <div className="flex-1 p-4">
                {challenge && challenge.mode === "output-predictor" ? (
                  <div className="h-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Predict Output</h3>
                      <textarea
                        className="w-full h-32 p-3 border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                        placeholder="Enter your predicted output here..."
                        value={userOutput}
                        onChange={e => setUserOutput(e.target.value)}
                        disabled={loading || skipped || timeLeft === 0}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Solution</h3>
                    </div>
                    <div className="h-[calc(100%-60px)]">
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
              <div className="border-t border-gray-200 dark:border-zinc-700 p-4 bg-gray-50 dark:bg-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSubmit}
                      disabled={skipped || timeLeft === 0 || loading}
                    >
                      {loading ? "Submitting..." : "Submit"}
                    </button>
                    <button
                      className="px-4 py-2 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleHint}
                      disabled={hintUsed || skipped || timeLeft === 0 || loading}
                    >
                      Hint
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSkip}
                      disabled={skipped || timeLeft === 0 || loading}
                    >
                      Skip
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Attempts: {attempts}</span>
                    {hintUsed && <span className="text-yellow-600">Hint Used</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 max-w-lg w-full border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">🏆 Leaderboard</h2>
              <button className="text-lg px-3 py-1 rounded bg-zinc-700 text-white" onClick={() => setShowLeaderboard(false)}>Close</button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-1">#</th>
                  <th className="py-1">User</th>
                  <th className="py-1">XP</th>
                  <th className="py-1">Rank</th>
                  <th className="py-1">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, i) => (
                  <tr key={u.userId} className="border-b border-zinc-200 dark:border-zinc-700">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1">{u.userId.slice(-6)}</td>
                    <td className="py-1">{u.xp}</td>
                    <td className="py-1">{u.rank}</td>
                    <td className="py-1">{u.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 