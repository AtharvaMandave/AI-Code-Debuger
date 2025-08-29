import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');
const UserGameStats = require('../../../models/UserGameStats');

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
  
  const { userId, challengeId, code, userOutput, mode } = req.body;
  
  // Input validation
  if (!userId || !challengeId) {
    return res.status(400).json({ error: 'Missing userId or challengeId' });
  }
  
  if (!code && mode !== 'output-predictor') {
    return res.status(400).json({ error: 'Missing code for non-output-predictor challenges' });
  }
  
  if (!userOutput && mode === 'output-predictor') {
    return res.status(400).json({ error: 'Missing userOutput for output-predictor challenges' });
  }
  
  let challenge;
  try {
    challenge = await Challenge.findById(challengeId);
  } catch (error) {
    console.error('Challenge lookup error:', error);
    return res.status(500).json({ error: 'Failed to retrieve challenge' });
  }
  
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found' });
  }
  
  let correct = false;
  let feedback = '';
  let xpEarned = 0;
  let detailedFeedback = '';

  if (challenge.mode === 'output-predictor') {
    // Direct output match with case-insensitive comparison
    const userOutputClean = userOutput ? userOutput.trim().toLowerCase() : '';
    const solutionClean = challenge.solution ? challenge.solution.trim().toLowerCase() : '';
    correct = userOutputClean === solutionClean;
    feedback = correct ? '🎉 Correct! Your output prediction is right!' : '❌ Incorrect output. Try again!';
    detailedFeedback = correct ? 
      `Expected: "${challenge.solution}"\nYour answer: "${userOutput}"` :
      `Expected: "${challenge.solution}"\nYour answer: "${userOutput}"`;
    xpEarned = correct ? 15 : 0;
  } else if (challenge.mode === 'fix-bug' || challenge.mode === 'refactor-rush') {
    // Use Gemini to check fix/refactor
    const prompt = `You are a code challenge judge. Given the original buggy/inefficient code and the user's submission, determine if the user's code correctly fixes the bug or improves the code as required.

Original code:
${challenge.starterCode}

User submission:
${code}

Reference solution:
${challenge.solution}

Mode: ${challenge.mode}
Task: ${challenge.description}

Evaluate the user's code and respond with a JSON object:
{
  "correct": true/false,
  "feedback": "Brief feedback message",
  "detailedFeedback": "Detailed explanation of what was wrong or right",
  "score": 0-10
}

Return ONLY the JSON object, nothing else.`;
    
    try {
      const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [ { text: prompt } ] }
          ]
        }),
      });
      
      if (!geminiRes.ok) {
        throw new Error(`Gemini API error: ${geminiRes.status}`);
      }
      
      const data = await geminiRes.json();
      let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonText = content;
      
      // Extract JSON from response
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      }
      const jsonMatch = jsonText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      // Clean JSON
      jsonText = jsonText.trim()
        .replace(/\n/g, '\n')
        .replace(/\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*$/g, '');
      
      let judge = { correct: false, feedback: 'Unable to parse Gemini response.', detailedFeedback: 'Please try again.', score: 0 };
      try {
        judge = JSON.parse(jsonText);
        
        // Validate judge response structure
        if (typeof judge.correct !== 'boolean') {
          judge.correct = false;
        }
        if (typeof judge.feedback !== 'string') {
          judge.feedback = 'Invalid response format';
        }
        if (typeof judge.detailedFeedback !== 'string') {
          judge.detailedFeedback = 'No detailed feedback available';
        }
        if (typeof judge.score !== 'number' || judge.score < 0 || judge.score > 10) {
          judge.score = 0;
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        judge = { 
          correct: false, 
          feedback: 'Unable to parse AI response. Please try again.', 
          detailedFeedback: 'The AI response was malformed. Please submit your solution again.', 
          score: 0 
        };
      }
      
      correct = !!judge.correct;
      feedback = judge.feedback || (correct ? '🎉 Correct! Well done!' : '❌ Incorrect. Try again!');
      detailedFeedback = judge.detailedFeedback || 'No detailed feedback available.';
      xpEarned = correct ? (judge.score || 15) : 0;
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return res.status(500).json({ 
        error: 'AI evaluation service unavailable', 
        details: 'Please try again later or contact support if the problem persists.' 
      });
    }
  } else {
    return res.status(400).json({ error: 'Invalid challenge mode' });
  }

  // Update user stats
  let stats;
  try {
    stats = await UserGameStats.findOne({ userId });
    if (!stats) {
      stats = await UserGameStats.create({ userId });
    }
  } catch (dbError) {
    console.error('User stats error:', dbError);
    return res.status(500).json({ error: 'Failed to update user statistics' });
  }
  
  stats.attempts += 1;
  
  // Only award XP for correct answers and if challenge not already completed
  if (correct && !stats.completedChallenges.includes(challenge._id.toString())) {
    stats.xp += xpEarned;
    // Ensure we're adding a proper ObjectId
    stats.completedChallenges.push(challenge._id);
    
    // Update totalCorrect count
    stats.totalCorrect += 1;
    
    // Improved rank logic
    if (stats.xp >= 100) stats.rank = 'Diamond';
    else if (stats.xp >= 75) stats.rank = 'Gold';
    else if (stats.xp >= 50) stats.rank = 'Silver';
    else if (stats.xp >= 25) stats.rank = 'Bronze';
    else stats.rank = 'Rookie';
  } else if (!correct) {
    // Update totalIncorrect count for incorrect attempts
    stats.totalIncorrect += 1;
  }
  
  stats.lastPlayed = new Date();
  
  try {
    await stats.save();
  } catch (saveError) {
    console.error('Stats save error:', saveError);
    console.error('Stats object:', {
      userId: stats.userId,
      xp: stats.xp,
      rank: stats.rank,
      attempts: stats.attempts,
      completedChallengesLength: stats.completedChallenges.length,
      totalCorrect: stats.totalCorrect,
      totalIncorrect: stats.totalIncorrect
    });
    return res.status(500).json({ error: 'Failed to save user statistics' });
  }

  return res.status(200).json({ 
    correct, 
    feedback, 
    detailedFeedback,
    xp: stats.xp, 
    rank: stats.rank, 
    attempts: stats.attempts,
    xpEarned: correct ? xpEarned : 0
  });
} 