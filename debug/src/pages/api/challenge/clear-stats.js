import dbConnect from '../../../lib/db';
const UserGameStats = require('../../../models/UserGameStats');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Delete all user stats
    const result = await UserGameStats.deleteMany({});
    
    return res.status(200).json({ 
      message: 'All user stats cleared successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing user stats:', error);
    return res.status(500).json({ error: 'Failed to clear user stats' });
  }
} 