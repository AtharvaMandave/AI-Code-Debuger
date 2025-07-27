const mongoose = require('mongoose');

const UserGameStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  rank: { type: String, default: 'Bronze' },
  attempts: { type: Number, default: 0 },
  completedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  lastPlayed: Date
});

module.exports = mongoose.models.UserGameStats || mongoose.model('UserGameStats', UserGameStatsSchema); 