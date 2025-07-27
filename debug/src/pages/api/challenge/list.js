import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  
  const { language = 'javascript' } = req.query;
  
  function getCurrentWeekNumber() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
  
  try {
    const currentWeek = getCurrentWeekNumber();
    const challenges = await Challenge.find({ 
      language: language,
      weekNumber: currentWeek 
    }).sort({ mode: 1, difficulty: 1 });
    
    // Group challenges by mode
    const groupedChallenges = {
      'fix-bug': [],
      'output-predictor': [],
      'refactor-rush': []
    };
    
    challenges.forEach(challenge => {
      if (groupedChallenges[challenge.mode]) {
        groupedChallenges[challenge.mode].push(challenge);
      }
    });
    
    return res.status(200).json({
      challenges: groupedChallenges,
      currentWeek: currentWeek,
      totalChallenges: challenges.length
    });
    
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
} 