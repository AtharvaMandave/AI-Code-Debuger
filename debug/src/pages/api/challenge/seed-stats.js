import dbConnect from '../../../lib/db';
const UserGameStats = require('../../../models/UserGameStats');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Create sample user stats
    const sampleUsers = [
      { userId: 'user_001', xp: 85, rank: 'Gold', attempts: 12, totalCorrect: 8, totalIncorrect: 4 },
      { userId: 'user_002', xp: 120, rank: 'Diamond', attempts: 15, totalCorrect: 12, totalIncorrect: 3 },
      { userId: 'user_003', xp: 45, rank: 'Silver', attempts: 8, totalCorrect: 6, totalIncorrect: 2 },
      { userId: 'user_004', xp: 15, rank: 'Bronze', attempts: 5, totalCorrect: 3, totalIncorrect: 2 },
      { userId: 'user_005', xp: 65, rank: 'Silver', attempts: 10, totalCorrect: 7, totalIncorrect: 3 },
      { userId: 'user_006', xp: 95, rank: 'Gold', attempts: 13, totalCorrect: 10, totalIncorrect: 3 },
      { userId: 'user_007', xp: 25, rank: 'Bronze', attempts: 6, totalCorrect: 4, totalIncorrect: 2 },
      { userId: 'user_008', xp: 55, rank: 'Silver', attempts: 9, totalCorrect: 6, totalIncorrect: 3 },
      { userId: 'user_009', xp: 75, rank: 'Gold', attempts: 11, totalCorrect: 8, totalIncorrect: 3 },
      { userId: 'user_010', xp: 35, rank: 'Bronze', attempts: 7, totalCorrect: 5, totalIncorrect: 2 }
    ];

    // Clear existing stats and create new ones
    await UserGameStats.deleteMany({});
    
    const createdStats = await UserGameStats.create(sampleUsers);
    
    return res.status(200).json({ 
      message: 'Sample user stats created successfully', 
      count: createdStats.length 
    });
  } catch (error) {
    console.error('Error seeding user stats:', error);
    return res.status(500).json({ error: 'Failed to seed user stats' });
  }
} 