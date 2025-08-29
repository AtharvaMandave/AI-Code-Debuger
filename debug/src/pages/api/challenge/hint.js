import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');
const mongoose = require('mongoose');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }

  const { challengeId } = req.body;

  if (!challengeId) {
    return res.status(400).json({ error: 'Challenge ID is required' });
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    return res.status(400).json({ error: 'Invalid challenge ID format' });
  }

  try {
    const challenge = await Challenge.findById(challengeId);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Generate a hint based on the challenge type and difficulty
    let hint = '';
    
    switch (challenge.mode) {
      case 'fix-bug':
        hint = generateFixBugHint(challenge.difficulty, challenge.language);
        break;
      case 'output-predictor':
        hint = generateOutputPredictorHint(challenge.difficulty, challenge.language);
        break;
      case 'refactor-rush':
        hint = generateRefactorHint(challenge.difficulty, challenge.language);
        break;
      default:
        hint = 'Think about the logic and check for common patterns.';
    }

    return res.status(200).json({ hint });
  } catch (error) {
    console.error('Error generating hint:', error);
    return res.status(500).json({ error: 'Failed to generate hint' });
  }
}

function generateFixBugHint(difficulty, language) {
  const hints = {
    easy: [
      'Check for syntax errors like missing semicolons or brackets.',
      'Look for off-by-one errors in loops.',
      'Verify variable names are spelled correctly.',
      'Check if all variables are properly initialized.'
    ],
    medium: [
      'Look for logical errors in conditional statements.',
      'Check array bounds and index access.',
      'Verify function parameters and return values.',
      'Look for type mismatches or conversion issues.'
    ],
    hard: [
      'Check for race conditions or timing issues.',
      'Look for memory leaks or resource management.',
      'Verify algorithm correctness and edge cases.',
      'Check for concurrency issues if applicable.'
    ]
  };
  
  const languageHints = {
    javascript: 'Remember JavaScript is loosely typed - check for type coercion issues.',
    python: 'Check indentation and Python-specific syntax.',
    java: 'Look for Java-specific issues like null pointer exceptions.',
    cpp: 'Check for C++ memory management and pointer issues.'
  };
  
  const difficultyHints = hints[difficulty] || hints.easy;
  const randomHint = difficultyHints[Math.floor(Math.random() * difficultyHints.length)];
  const languageHint = languageHints[language] || '';
  
  return `${randomHint} ${languageHint}`.trim();
}

function generateOutputPredictorHint(difficulty, language) {
  const hints = {
    easy: [
      'Trace through the code step by step.',
      'Check what each variable holds at each step.',
      'Look for loops and how many times they execute.',
      'Pay attention to the order of operations.'
    ],
    medium: [
      'Consider edge cases and boundary conditions.',
      'Look for recursive functions and their base cases.',
      'Check for side effects and state changes.',
      'Analyze the data flow through the program.'
    ],
    hard: [
      'Look for complex algorithms and their behavior.',
      'Consider time and space complexity implications.',
      'Check for optimization techniques used.',
      'Analyze the overall program structure and flow.'
    ]
  };
  
  const difficultyHints = hints[difficulty] || hints.easy;
  return difficultyHints[Math.floor(Math.random() * difficultyHints.length)];
}

function generateRefactorHint(difficulty, language) {
  const hints = {
    easy: [
      'Look for repeated code that can be extracted into functions.',
      'Check for magic numbers that should be constants.',
      'Consider using more descriptive variable names.',
      'Look for opportunities to simplify complex expressions.'
    ],
    medium: [
      'Identify code that can be modularized.',
      'Look for design patterns that could improve the code.',
      'Check for performance bottlenecks.',
      'Consider error handling and edge cases.'
    ],
    hard: [
      'Look for architectural improvements.',
      'Consider using more efficient algorithms.',
      'Check for memory optimization opportunities.',
      'Look for ways to improve code maintainability.'
    ]
  };
  
  const difficultyHints = hints[difficulty] || hints.easy;
  return difficultyHints[Math.floor(Math.random() * difficultyHints.length)];
} 