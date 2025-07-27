import dbConnect from '../../../lib/db';
const UserGameStats = require('../../../models/UserGameStats');

export default async function handler(req, res) {
  await dbConnect();
  try {
    const leaderboard = await UserGameStats.find({})
      .sort({ xp: -1 })
      .limit(20)
      .select('userId xp rank attempts');
    return res.status(200).json(leaderboard);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
} 