import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');
const UserGameStats = require('../../../models/UserGameStats');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  const { userId, challengeId, userCode, userOutput, mode } = req.body;
  if (!userId || !challengeId) {
    return res.status(400).json({ error: 'Missing userId or challengeId' });
  }
  const challenge = await Challenge.findById(challengeId);
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
  } else {
    // Use Gemini to check fix/refactor
    const prompt = `You are a code challenge judge. Given the original buggy/inefficient code and the user's submission, determine if the user's code correctly fixes the bug or improves the code as required.

Original code:
${challenge.starterCode}

User submission:
${userCode}

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
      } catch (e) {
        console.error('JSON parse error:', e);
      }
      
      correct = !!judge.correct;
      feedback = judge.feedback || (correct ? '🎉 Correct! Well done!' : '❌ Incorrect. Try again!');
      detailedFeedback = judge.detailedFeedback || 'No detailed feedback available.';
      xpEarned = correct ? (judge.score || 15) : 0;
    } catch (e) {
      console.error('Gemini API error:', e);
      return res.status(500).json({ error: 'Gemini API error', details: e.message });
    }
  }

  // Update user stats
  let stats = await UserGameStats.findOne({ userId });
  if (!stats) {
    stats = await UserGameStats.create({ userId });
  }
  
  stats.attempts += 1;
  
  // Only award XP for correct answers and if challenge not already completed
  if (correct && !stats.completedChallenges.includes(challenge._id.toString())) {
    stats.xp += xpEarned;
    stats.completedChallenges.push(challenge._id);
    
    // Improved rank logic
    if (stats.xp >= 100) stats.rank = 'Diamond';
    else if (stats.xp >= 75) stats.rank = 'Gold';
    else if (stats.xp >= 50) stats.rank = 'Silver';
    else if (stats.xp >= 25) stats.rank = 'Bronze';
    else stats.rank = 'Rookie';
  }
  
  stats.lastPlayed = new Date();
  await stats.save();

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